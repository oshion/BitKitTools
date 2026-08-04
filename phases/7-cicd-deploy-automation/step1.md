# Step 1: test-gate-workflow

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (특히 ADR-003: Jest + React Testing Library 채택)
- `/package.json` (`lint`/`test`/`build` 스크립트 정의 확인)
- `/.github/workflows/deploy.yml` (이전 step에서 생성된 파일 — 워크플로우 문법/컨벤션 참고용. 이 step은 이 파일을 수정하지 않는다)

## 작업

`.github/workflows/test-gate.yml` 을 생성한다. Pull Request가 열리거나 업데이트될 때마다 자동으로 lint/테스트/빌드를 검증하는 게이트다.

**요구사항**:

- Trigger: `pull_request` (모든 대상 브랜치)
- Runner: `ubuntu-latest`
- Job 순서: `actions/checkout@v4` → `actions/setup-node@v4`(Node 20 LTS) → `npm ci` → `npm run lint` → `npm test` → `npm run build`
- 각 스텝이 실패하면 이후 스텝은 실행되지 않고 워크플로우 전체가 실패로 표시되어야 한다 — GitHub Actions의 기본 동작(스텝 실패 시 job 중단)을 그대로 사용하고, 커스텀 실패 처리/알림 로직은 추가하지 않는다.
- 이 워크플로우는 어떤 서버에도 배포하지 않는다 — 순수 검증 전용이며, `deploy.yml`이 사용하는 EC2 관련 시크릿을 참조할 필요가 없다.

## Acceptance Criteria

```bash
npm run lint && npm test && npm run build
```

위 커맨드 시퀀스가 로컬에서 그대로 성공해야 한다(워크플로우가 러너에서 실행할 순서와 동일). 추가로 생성한 `.github/workflows/test-gate.yml`이 유효한 YAML 문법인지 확인한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - Playwright/E2E 관련 스텝을 추가하지 않았는가?
   - `test-gate.yml`의 트리거(`pull_request`)가 `deploy.yml`의 트리거(`push` to `main`)와 명확히 분리되어 서로 겹치지 않는가?
   - EC2/배포 관련 시크릿을 이 워크플로우에서 참조하지 않았는가?
3. 결과에 따라 `phases/7-cicd-deploy-automation/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- Playwright, Vitest 등 이 프로젝트가 채택하지 않은 테스트 도구를 추가하지 마라. 이유: ADR-003이 Jest를 명시적으로 채택했고, 이번 로드맵 논의에서 Playwright 도입은 명시적으로 제외하기로 결정됐다.
- 이 워크플로우에서 EC2/배포 관련 시크릿(`EC2_HOST`, `EC2_SSH_KEY` 등)을 참조하지 마라. 이유: 순수 검증 게이트이지 배포 파이프라인이 아니다.
- `deploy.yml`을 수정하지 마라. 이유: 이 step의 스코프는 test-gate.yml 생성으로 한정된다.
- 기존 테스트를 깨뜨리지 마라.
