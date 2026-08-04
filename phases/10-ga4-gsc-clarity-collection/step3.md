# Step 3: collect-data-workflow

## 읽어야 할 파일

먼저 아래 파일들을 읽고 기존 배포 워크플로우 구조와 완성된 수집 스크립트를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/.github/workflows/deploy.yml` (기존 배포 워크플로우 — 이 step에서 트리거 조건을 수정한다)
- `/.github/workflows/test-gate.yml` (워크플로우 문법/컨벤션 참고용)
- `/scripts/collect-analytics.ts` (이전 3개 step에서 완성된 GA4+GSC+Clarity 수집 스크립트)

## 작업

### 1. `.github/workflows/collect-data.yml` 생성

매일 1회 실행되는 크론 워크플로우다.

- Trigger: `schedule`(cron 표현식 `'0 3 * * *'` — 매일 UTC 03:00, 한국시간 정오 근처) + `workflow_dispatch`(수동 실행 테스트 가능하도록)
- Runner: `ubuntu-latest`
- `permissions: contents: write` 를 워크플로우 상단에 명시한다 — 이 워크플로우가 직접 `/data/raw/*.json`을 레포에 커밋+푸시해야 하기 때문에 기본 `GITHUB_TOKEN`에 쓰기 권한이 필요하다.
- Steps: `actions/checkout@v4` → `actions/setup-node@v4`(Node 20) → `npm ci` → `npx tsx scripts/collect-analytics.ts` 실행(아래 env로 시크릿 주입) → 결과 파일들을 git commit + push
  ```yaml
  env:
    GOOGLE_SERVICE_ACCOUNT_JSON: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_JSON }}
    GA4_PROPERTY_ID: ${{ secrets.GA4_PROPERTY_ID }}
    CLARITY_API_KEY: ${{ secrets.CLARITY_API_KEY }}
  ```
- git commit 스텝: `git config user.name "github-actions[bot]"` / `git config user.email "github-actions[bot]@users.noreply.github.com"` 으로 봇 계정을 설정하고, `/data/raw/*.json` 변경분만 add해서 `chore(collect-data): daily analytics collection {날짜}` 형태 커밋 메시지로 커밋 후 push한다. **변경된 파일이 없으면(예: 모든 API 호출이 실패해 새 파일이 생성되지 않은 경우) 커밋을 시도하지 않고 조용히 종료한다** — `git diff --quiet` 등으로 변경 여부를 먼저 확인하라(빈 커밋 시도 시 워크플로우가 에러로 실패하는 것을 방지).

### 2. `.github/workflows/deploy.yml` 수정 — **중요**

이 워크플로우가 매일 `/data/raw/*.json`을 `master`에 커밋하게 되는데, 지금 `deploy.yml`은 `push: branches: [master]`에 반응해 매번 전체 빌드+배포를 실행한다. 이대로 두면 데이터 수집 커밋마다 불필요하게 사이트 전체가 재배포된다(로드맵 문서 "착수 전 확인할 우려 사항" 항목에 이미 명시된 문제).

`deploy.yml`의 트리거를 아래처럼 수정한다:

```yaml
on:
  push:
    branches:
      - master
    paths-ignore:
      - 'data/**'
      - 'phases/**'
      - '*.md'
```

`phases/**`와 `*.md`(문서/harness 산출물)도 사이트 콘텐츠와 무관하므로 함께 배포 트리거에서 제외한다. **단, `.github/workflows/**`나 `src/**`, `public/**` 등 실제 사이트에 영향을 주는 경로는 절대 이 목록에 넣지 마라** — 이 변경으로 인해 진짜 코드/콘텐츠 변경이 배포를 트리거하지 못하게 되면 안 된다.

## Acceptance Criteria

```bash
npm run build
```
추가로 `.github/workflows/collect-data.yml`과 수정된 `.github/workflows/deploy.yml`이 유효한 YAML 문법이어야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `collect-data.yml`에 `permissions: contents: write`가 명시됐는가?
   - 커밋 전 변경사항 유무를 확인해서 빈 커밋 시도로 실패하지 않는가?
   - `deploy.yml`의 `paths-ignore`에 `data/**`, `phases/**`, `*.md`만 포함되고, `src/**`/`public/**`/`.github/workflows/**` 같은 실제 배포 관련 경로는 제외되지 않았는가?
   - 시크릿 값이 워크플로우 파일에 하드코딩되지 않았는가?
3. 결과에 따라 `phases/10-ga4-gsc-clarity-collection/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단
4. 이 step이 phase의 마지막 step이므로, 전체 완료 후 `npm run lint && npm test && npm run build`를 한 번 더 실행해 phase 전체가 정상 동작하는지 최종 확인한다.

## 금지사항

- `deploy.yml`의 `paths-ignore`에 실제 사이트 코드/콘텐츠 경로(`src/**`, `public/**`, `.github/workflows/**` 등)를 포함시키지 마라 — 그러면 진짜 배포가 필요한 변경이 배포를 트리거하지 못하게 된다.
- 시크릿 값을 하드코딩하지 마라.
- rsync 배포 스텝이나 IndexNow 알림 스텝(`deploy.yml` 내 기존 로직)을 수정하지 마라 — 트리거 조건(`on:` 블록)만 수정한다.
- 기존 테스트를 깨뜨리지 마라.
