# 사용법 — Harness 템플릿

이 문서는 이 리포를 실제 프로젝트에 적용할 때 따라야 할 순서를 정리한 것이다.
문서 맵과 아키텍처 상세는 [CLAUDE.md](../CLAUDE.md)를 참고한다.

---

## 0. 사전 준비

```bash
git init
```

`scripts/execute.py`는 git 저장소가 아니면 즉시 실패한다 (`feat-{task-name}` 브랜치를 자동 생성하기 때문). 다른 작업보다 먼저 실행한다.

---

## 1. Placeholder 채우기

| 파일 | 항목 |
|------|------|
| [CLAUDE.md](../CLAUDE.md) | `{프로젝트명}`, 프로젝트 설명 |
| `phases/index.json` | `{프로젝트명}` |

---

## 2. 문서 작성 (순서 중요)

1. **`docs/PRD.md`** — 화면 목록 TOC, MVP 범위, MVP 제외 사항
2. **`docs/UI_GUIDE.md`** — 디자인 시스템 (색상, 컴포넌트, 타이포그래피). `docs/screens/`보다 먼저 확정하는 게 이상적 — screen 스펙에서 참조할 수 있어야 하기 때문.
3. **`docs/screens/{화면명}.md`** — 화면별 상세 스펙. 화면 수만큼 반복 작성.
4. **`docs/tech-debt-tracker.md`** — [docs/tech-debt-tracker-guide.md](tech-debt-tracker-guide.md)를 참고해 신규 생성. 에이전트가 git 히스토리를 맥락으로 읽지 않으므로, 알려진 기술 부채는 반드시 인-레포 마크다운으로 남겨야 다음 세션이 인식한다.

---

## 3. `/harness` 로 구현 계획 설계

`.claude/commands/harness.md`에 정의된 슬래시 커맨드. 아래 순서로 진행된다:

1. **탐색** — `/docs/` 하위 문서를 읽고 기획·아키텍처 파악
2. **논의** — 구체화가 필요한 사항을 사용자와 논의
3. **Step 설계** — 여러 step으로 쪼갠 구현 계획 초안 제시 (하나의 step = 하나의 레이어/모듈)
4. **파일 생성** (사용자 승인 후):
   - `phases/index.json`에 새 task 항목 추가
   - `phases/{task-name}/index.json` — step 목록과 상태
   - `phases/{task-name}/step{N}.md` — step별 상세 지시서 (읽어야 할 파일, 작업, AC, 금지사항)

`phases/example-phase/`가 실제 예시(project-setup step0)와 빈 템플릿(step1)을 담고 있으니 새 phase 작성 시 참고한다.

---

## 4. 실행

```bash
python3 scripts/execute.py {task-name}          # 순차 실행
python3 scripts/execute.py {task-name} --push    # 실행 후 origin에 push
```

`execute.py`가 자동으로 처리하는 것:

- `feat-{task-name}` 브랜치 생성/checkout
- 가드레일 주입 — `CLAUDE.md` + `docs/**/*.md` 전체를 매 step 프롬프트에 포함
- 컨텍스트 누적 — 완료된 step의 `summary`를 다음 step 프롬프트에 전달
- 자가 교정 — 실패 시 최대 3회 재시도, 이전 에러 메시지를 프롬프트에 피드백
- 2단계 커밋 — 코드 변경(`feat`)과 메타데이터(`chore`) 분리 커밋
- 타임스탬프 자동 기록 (`started_at`, `completed_at`, `failed_at`, `blocked_at`)

### 에러 복구

| 상태 | 대응 |
|------|------|
| `error` | `phases/{task-name}/index.json`에서 해당 step의 `status`를 `"pending"`으로, `error_message` 삭제 후 재실행 |
| `blocked` | `blocked_reason`에 적힌 사유(API 키, 외부 인증 등)를 해결한 뒤 `status`를 `"pending"`으로, `blocked_reason` 삭제 후 재실행 |

---

## 5. `/review` 로 최종 검증

`.claude/commands/review.md`가 `CLAUDE.md` / `ARCHITECTURE.md` / `ADR.md` 기준으로 코드 레벨 위반(any 타입, mock 직접 import, app/api 직접 접근, `NEXT_PUBLIC_` 시크릿 노출 등)을 grep으로 자동 탐지하고 체크리스트를 판정한다. 위반이 있으면 수정 후 재실행을 반복한다.

---

## 훅 동작 (자동, 별도 실행 불필요)

`.claude/settings.json`에 등록되어 세션 중 자동으로 개입한다.

| 훅 | 시점 | 하는 일 |
|----|------|---------|
| `dangerous-cmd-guard.sh` | `Bash` 실행 전 | `rm -rf`, `git push --force`, `git reset --hard`, `DROP TABLE` 등 위험 명령 차단 |
| `tdd-guard.sh` | `Edit`/`Write` 전 | `components/`, `lib/`, `hooks/` 하위 구현 파일 수정 시 대응하는 테스트 파일이 없으면 차단 |
| `circuit-breaker.sh` | `Bash` 실패 시 | 60초 안에 5회 이상 실패하면 경고 — 같은 전략 반복 대신 접근 방식 전환 유도 |
| Stop hook | 응답 종료 시 | `package.json`이 있으면 `npm run lint && build && test` 자동 실행 (스캐폴딩 전에는 스킵) |

---

## 전체 워크플로우 요약

```
git init
    ↓
placeholder 채우기 (CLAUDE.md, phases/index.json)
    ↓
docs/PRD.md 작성 (화면 목록 TOC)
    ↓
docs/UI_GUIDE.md 작성 (디자인 확정 후)
    ↓
docs/screens/{화면명}.md 작성 (화면별 스펙)
    ↓
docs/tech-debt-tracker.md 생성
    ↓
/harness 실행 → phases/ 자동 생성
    ↓
execute.py 실행 → 코드 자동 작성
    ↓
/review 실행 → 규칙 기반 리뷰
```
