# Step 4: weekly-report-integration

## 읽어야 할 파일

- `/.github/workflows/weekly-report.yml` (전체)
- `/scripts/lib/aggregateWeeklyReport.ts`, `/scripts/generate-report.ts` — Phase 15에서 Lighthouse 섹션을 추가한 방식(`readTodayLighthouseSnapshot` + `buildPerformanceWarningSection` — **결정론적으로 코드에서 만들고 AI 프롬프트 판단에 맡기지 않는** 패턴)을 그대로 참고하라. 이번 스텝의 "진행 중인 타이틀 실험" 섹션도 동일 원칙을 따른다.
- 이전 step 산출물: `/scripts/run-title-experiment.ts`
- `/bitkittools-ai-automation-roadmap.md`의 "실행 주기·출력 형태" 노트(Phase 4 섹션 상단) — `weekly-report.yml`에 전부 통합하고 각 단계가 독립적으로 실패 허용된다는 원칙

## 작업

### 1. `weekly-report.yml`에 스텝 추가

리포트 생성(`generate-report.ts`) 이후, Slack 발송 이전에 아래 스텝을 추가한다:

```yaml
      - name: Run title experiment
        env:
          GH_TOKEN: ${{ secrets.GH_BOT_PAT }}
        run: npx tsx scripts/run-title-experiment.ts
        continue-on-error: true
```

`continue-on-error: true`를 쓰는 이유: 이 스텝이 실패해도(예: 이번 주 후보가 없어서 정상 종료가 아니라 예외로 죽는 버그, 일시적 GitHub API 오류 등) 리포트 생성·Slack 발송·데이터 커밋은 계속 진행되어야 한다 — Phase 13/15에서 이미 확립한 "한 단계 실패가 전체를 막지 않는다" 원칙과 동일하다. 단, `run-title-experiment.ts` 내부에서도 각 페이지 단위 실패가 다른 페이지 처리를 막지 않도록 이미 설계돼 있어야 한다(step 3에서 이미 처리됨 — 이 스텝에서는 워크플로우 레벨의 방어만 추가).

`GH_TOKEN`은 **PR 생성/auto-merge용**이고, 기존 Checkout 스텝의 `token: ${{ secrets.GH_BOT_PAT }}`(git push 인증용)와는 별개의 용도라는 걸 인지하고 두 군데 다 필요하면 유지하라 — 이미 Checkout에 있다면 중복 걱정 없이 이 스텝에만 `GH_TOKEN` env를 추가하면 된다.

### 2. 리포트에 "진행 중인 타이틀 실험" 섹션 추가

`generate-report.ts` 또는 `aggregateWeeklyReport.ts`(기존 코드 구조를 보고 적절한 위치 판단)에 아래를 결정론적으로 생성하는 함수를 추가한다:

```typescript
export function buildTitleExperimentSection(actionLog: ActionLog): string | null
```

- `action-log.json`에서 `type: 'title-experiment'`인 항목을 전부 나열: 페이지, 시작일(`deployedAt`), 시도 횟수(`attemptNumber`), 상태(`status` — 없으면 "재색인 대기 중", `in-progress`면 "쿨다운 진행 중(N일 경과)", `kept`/`rolled-back`이면 그대로).
- 대상 항목이 하나도 없으면 `null`을 반환해 섹션 자체를 생략한다(Phase 15의 `buildPerformanceWarningSection`이 경고 없을 때 `null`을 반환하던 것과 동일 패턴).
- 최종 리포트 조합 시 `aiReport + '\n\n' + (performanceWarning ?? '') + '\n\n' + (titleExperimentSection ?? '')` 형태로 이어 붙인다(기존 Lighthouse 경고 섹션 이어붙이던 방식 그대로 확장).

### 3. `git add` 대상 확인

`weekly-report.yml`의 "Commit report data" 스텝에서 `git add` 대상 목록에 `data/action-log.json`이 이미 포함돼 있는지 확인한다(이미 있다면 손대지 않는다 — 있을 것으로 예상되지만 실제 파일을 열어 확인하라).

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `weekly-report.yml`을 YAML로 파싱해 문법 오류가 없는지 확인한다(`node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/weekly-report.yml','utf-8'))"` 또는 프로젝트에 이미 있는 YAML 파서 활용 — 로컬에서 실제로 워크플로우를 실행하지 않는다).
3. `buildTitleExperimentSection`의 단위 테스트: 빈 action-log(null 반환), 여러 상태가 섞인 항목(각 상태별 문구 확인)을 검증한다.
4. 새로 추가한 "Run title experiment" 스텝이 `continue-on-error: true`인지, `Commit report data`보다 앞에 있는지 확인한다.
5. 결과에 따라 `phases/16-title-ab-test-automation/index.json`의 step 4를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요(예: GitHub Secrets 설정 확인 필요) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 로컬에서 `npx tsx scripts/run-title-experiment.ts`를 실제로 실행하지 마라 — `gh` 인증 없이 실행하면 의미 없는 실패만 발생하고, 실제 배포 동작 확인은 이 phase가 끝난 뒤 실제 GitHub Actions 실행으로 검증한다(이 phase의 범위 밖).
- "진행 중인 타이틀 실험" 섹션 내용을 AI 프롬프트가 알아서 요약하게 맡기지 마라 — 반드시 코드로 결정론적으로 생성한다.
- 기존 `weekly-report.yml` 스텝 순서나 다른 스텝의 동작을 바꾸지 마라 — 새 스텝을 적절한 위치에 추가하는 것만 한다.
- 기존 테스트를 깨뜨리지 마라.
