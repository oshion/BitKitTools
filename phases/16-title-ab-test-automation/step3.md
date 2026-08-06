# Step 3: title-experiment-orchestration

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`(특히 ADR-016 — master 브랜치 보호 + PR auto-merge 게이트, GITHUB_TOKEN의 두 가지 제약)
- `/bitkittools-ai-automation-roadmap.md`의 "2-2" 섹션 전체 — 이 스텝이 구현하는 대상의 최종 명세
- 이전 step 산출물: `/scripts/lib/detectCtrAnomalies.ts`, `/scripts/generate-title-variant.ts`(`generateTitleVariants`), `/scripts/lib/validateTitleVariant.ts`, `/scripts/lib/titleExperimentReindex.ts`(`findReindexedExperiments`)
- `/scripts/lib/detectStagnation.ts` — `ActionLogEntry`, `ActionLog`, `readActionLog`, `isCooldownComplete`, `filterCooldownComplete` (이 스텝에서 `ActionLogEntry`에 필드를 추가한다)
- `/scripts/execute.py`의 `_build_pr_body`/`_open_pr_and_enable_automerge` 함수(약 420~479줄) — Python이지만 이 프로젝트가 PR 생성/auto-merge에 쓰는 정확한 `gh` CLI 인자(`gh pr create --base master --head <branch> --title ... --body ...`, `gh pr merge <url> --auto --merge`)를 그대로 참고하라. 이번 스텝은 이 패턴을 Node/TypeScript로 재현한다(Python이 아니라 `child_process`로 `gh`를 호출).
- `/scripts/collect-lighthouse.ts`의 `runLhciCollect` — `spawnSync`로 외부 CLI를 호출하고 실패를 처리하는 이 프로젝트의 관례
- `/src/lib/config/tools-config.ts`와 `/src/types/tool.ts` (`ToolConfig`, `DisclaimerType`, `LocalizedText`) — 실제 title/description을 수정할 대상 파일과 YMYL 판정에 쓸 `disclaimerType`

## 배경 — 반드시 이해하고 시작할 것

- 이 스크립트는 **GitHub Actions 러너 안에서 실행된다**(`weekly-report.yml`, 다음 step에서 연결). `gh` CLI는 `ubuntu-latest`에 기본 설치돼 있고, `GH_TOKEN` 환경변수만 있으면 별도 `gh auth login` 없이 인증된다. 이 스텝에서는 `GH_TOKEN`이 이미 설정돼 있다고 가정하고 코드를 작성하라(실제로 어떤 값을 넣을지는 다음 step에서 워크플로우 yml에 정의한다).
- **왜 GITHUB_TOKEN 기본값이 아니라 PAT(`GH_BOT_PAT`)로 인증해야 하는가**: 기본 `GITHUB_TOKEN`으로 만든 PR은 무한 재귀 방지 정책 때문에 다른 워크플로우(`test-gate.yml`)를 트리거하지 않는다 — 그러면 auto-merge가 영원히 필요조건을 못 채운다(ADR-016 참고, 이번 세션에 실제로 겪은 버그). `GH_TOKEN`이 어떤 값이든(PAT면 정상 트리거) 이 스크립트 코드 자체는 신경 쓸 필요 없다 — 그냥 환경변수의 `GH_TOKEN`을 그대로 쓰면 된다.
- `tools-config.ts`는 코드 파일이다. **master에 직접 push하지 않는다** — 반드시 브랜치 push → PR → (YMYL 아니면) auto-merge 순서를 거친다.
- YMYL(`disclaimerType`이 `medical`/`legal`/`financial`)인 tool은 PR까지는 동일하게 만들되 **auto-merge를 걸지 않는다** — 사람이 직접 머지해야 한다.

## 작업

이 phase의 핵심 오케스트레이션 스크립트 `scripts/run-title-experiment.ts`를 만든다. **로직(순수 함수로 분리 가능한 판단)과 부수효과(파일 I/O, `gh` 호출, git 브랜치 조작)를 명확히 나눠서 작성하라** — 판단 로직은 유닛 테스트로 검증하고, 부수효과는 얇은 wrapper로 감싸 나중에 mock 가능하게 한다.

### A. `action-log.json` 스키마 확장

`/scripts/lib/detectStagnation.ts`의 `ActionLogEntry`에 title-experiment 전용 optional 필드를 추가한다:

```typescript
export interface ActionLogEntry {
  id: string
  type: string
  page: string
  deployedAt: string
  description: string
  // title-experiment 전용 (optional — 다른 type의 액션은 안 씀)
  cooldownStartedAt?: string       // 재색인 확인 시각, 21일 기준점 (step 2 결과로 채워짐)
  attemptNumber?: number           // 이 페이지에서 몇 번째 시도인지 (1~3)
  originalTitle?: import('../../src/types/tool').LocalizedText
  originalDescription?: import('../../src/types/tool').LocalizedText
  status?: 'in-progress' | 'kept' | 'rolled-back'
}
```

기존 `readActionLog`는 그대로 재사용한다. `writeActionLog`가 아직 없다면 이 스텝에서 추가하라(`writeTrend`와 대칭되는 형태 — `mkdirSync` + `writeFileSync`).

### B. 기존 실험 점검 (매주 먼저 실행)

1. `readActionLog()`로 읽는다.
2. `cooldownStartedAt`이 없는 `type: 'title-experiment'` 항목: `findReindexedExperiments`(step 2)로 재색인 확인된 것만 `cooldownStartedAt`을 채워 저장.
3. `cooldownStartedAt`이 있고, 그 시점 기준 21일 경과한 항목(`isCooldownComplete`를 호출하되 **`deployedAt`이 아니라 `cooldownStartedAt`을 기준으로 비교**하도록 호출부에서 별도 Date 계산을 하거나, `isCooldownComplete`가 임의 timestamp 필드를 받도록 살짝 조정하라 — 기존 함수 시그니처를 억지로 재사용하지 말고 자연스러운 형태로 판단):
   - 최신 GSC 처리 데이터에서 이 페이지의 CTR을 가져와 **원본(`originalTitle`/`originalDescription` 배포 당시 CTR — action-log에 별도로 기록해뒀어야 비교 가능하다는 점에 유의. 기록 방법이 애매하면 "원본 대비 비교"는 원본 배포 당시가 아니라 **가장 최근 measured 원본 기간**과 비교하는 대신, 간단하게 "이번 버전 CTR이 이 페이지의 실험 시작 전 마지막 측정 CTR보다 나은가"로 단순화해도 된다 — 완벽한 인과 비교보다 "명백히 나빠지지 않았는가"를 걸러내는 게 목적이라는 걸 기억하고 실용적으로 구현하라)와 **직전 버전** 대비 비교한다.
   - 개선(원본·직전 버전 모두보다 CTR이 높음) → `status: 'kept'`로 기록, 종료.
   - 개선 실패 → `attemptNumber < 3`이면 새 후보 버전으로 배포(아래 D)하고 `attemptNumber + 1`, 아니면 **원본 title/description으로 롤백 배포**하고 `status: 'rolled-back'`.

### C. 신규 실험 시작 (B 이후)

4. `action-log.json`에서 `status`가 아직 없거나 `'in-progress'`인 `title-experiment` 항목 개수를 센다. **2개 이상이면 신규 시작 없이 종료.**
5. `detectCtrAnomalies`(step 0) 결과에서 YMYL 페이지를 제외하고 최우선 순위 페이지를 필요한 만큼(위 개수를 2개로 채우는 만큼, 한 번에 최대 1~2개) 선정한다.
6. `generateTitleVariants`(step 1)로 후보 생성 → 빈 배열이면(가드레일 통과 실패) 이번 주 이 페이지는 스킵.
7. 배포(아래 D) → `action-log.json`에 `id`(예: `title-exp-{page}-{timestamp}`), `type: 'title-experiment'`, `page`, `deployedAt`, `description`, `attemptNumber: 1`, `originalTitle`/`originalDescription`(배포 전 `tools-config.ts`에서 읽은 현재 값), `status: 'in-progress'` 기록.

### D. 배포 (B/C 공용 함수로 분리)

```typescript
async function deployTitleVariant(
  page: string,
  variant: TitleVariant,           // 또는 롤백이면 원본 값
  isYmyl: boolean,
  ghToken: string
): Promise<{ prUrl: string; autoMerged: boolean }>
```

- `tools-config.ts`에서 해당 tool의 `title`/`description`을 새 값으로 교체(파일을 파싱해 수정 — 정규식이 아니라 실제로 구조를 이해하고 안전하게 바꾸는 방법을 구현 시 판단하라. 단, 이 파일은 대형 배열 리터럴이라 AST 파싱 없이 안전하게 고치기 까다로울 수 있음을 인지하고, 실제 구현에서 문자열 치환이 안전한지 신중히 검토하라).
- 새 브랜치 생성(`title-experiment/{page}/{timestamp}` 형태) → 커밋 → push.
- `spawnSync('gh', ['pr', 'create', '--base', 'master', '--head', branch, '--title', ..., '--body', ...], { env: { ...process.env, GH_TOKEN: ghToken } })`
- `isYmyl`이 아니면 `spawnSync('gh', ['pr', 'merge', prUrl, '--auto', '--merge'], { env: { ...process.env, GH_TOKEN: ghToken } })`. YMYL이면 이 호출을 생략하고 Slack 플래그용으로 `autoMerged: false`를 반환한다.

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

**로컬에서 실제 `gh pr create`를 실행해 진짜 PR을 만들지 마라.** `spawnSync`를 호출하는 부분은 mock으로 테스트하고, 판단 로직(비교, 후보 선정, 동시실행 제한)은 순수 함수로 분리해 실제 값으로 테스트한다. 실제 배포 동작은 다음 step에서 워크플로우에 연결한 뒤 GitHub Actions에서 라이브로 검증한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아래를 코드로 확인한다:
   - 진행 중 실험이 2개 이상이면 신규 시작 로직이 호출되지 않는가(테스트로 확인)
   - YMYL 페이지는 어떤 경로로도 `gh pr merge --auto`가 호출되지 않는가(테스트로 확인 — mock 호출 인자를 검사)
   - 3회 시도 후 원본 롤백 로직이 정확히 트리거되는가
   - `cooldownStartedAt` 기준으로 21일을 재는지(배포 시각 기준이 아닌지)
3. 결과에 따라 `phases/16-title-ab-test-automation/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: `tools-config.ts` 안전 수정 방법이 애매해 설계 판단이 필요한 경우) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- YMYL 페이지에 대해 어떤 코드 경로로도 auto-merge를 걸지 마라 — 방어적으로 두 번 체크해도 무방하다.
- 동시 실행 2개 제한을 우회하는 코드를 만들지 마라.
- `master`에 직접 push하는 코드를 만들지 마라 — 반드시 브랜치+PR을 거친다.
- 로컬에서 실제로 `gh` 명령을 실행하는 테스트를 만들지 마라(mock 필수).
- `tools-config.ts`를 정규식으로 거칠게 치환해서 다른 tool의 데이터를 오염시킬 위험이 있는 방식으로 구현하지 마라 — 안전하게 대상 tool의 필드만 정확히 바꾸는지 반드시 확인하라.
- 기존 테스트를 깨뜨리지 마라.
