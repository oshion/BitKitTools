# Step 7: weekly-report-workflow

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이전 step들이 만든 스크립트와 기존 워크플로우 패턴을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/.github/workflows/collect-data.yml` (동일한 "크론 + git bot 커밋" 패턴을 그대로 참고)
- `/scripts/generate-report.ts` (step 4)
- `/scripts/generate-strategy-review.ts` (step 5)
- `/scripts/post-slack-report.ts` (step 6)
- `/data/action-log.json`, `/data/processed/trend.json`이 이번 phase에서 새로 생기는 파일임을 확인(step 3)

## 작업

`.github/workflows/weekly-report.yml`을 작성한다.

### 트리거

```yaml
on:
  schedule:
    - cron: '0 0 * * 1'   # 매주 월요일 00:00 UTC = 09:00 KST
  workflow_dispatch:
```

### 권한

`collect-data.yml`과 동일하게 `permissions: contents: write` (git commit/push를 위함).

### Job 구성 (`collect-data.yml`과 동일한 스타일)

1. Checkout (`actions/checkout@v4`)
2. Setup Node.js (`actions/setup-node@v4`, node-version 20, cache npm)
3. Install dependencies (`npm ci`)
4. Run report generation — env: `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}` — run: `npx tsx scripts/generate-report.ts`
5. Run strategy review (conditional no-op internally, 항상 실행하되 스크립트 자체가 정체 아니면 즉시 종료) — env: `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}` — run: `npx tsx scripts/generate-strategy-review.ts`
6. Post to Slack — env: `SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}` — run: `npx tsx scripts/post-slack-report.ts`
7. Commit generated report data — git bot 커밋 (`collect-data.yml`의 "Commit collected data" 스텝과 동일한 identity 설정):
   ```yaml
   - name: Commit report data
     run: |
       git config user.name "github-actions[bot]"
       git config user.email "github-actions[bot]@users.noreply.github.com"
       git add data/reports data/history.md data/processed/trend.json data/action-log.json
       if git diff --quiet --staged; then
         echo "No new report data to commit. Skipping commit."
       else
         DATE=$(date -u +%Y-%m-%d)
         git commit -m "chore(weekly-report): generate weekly report ${DATE}"
         git push
       fi
   ```

### `deploy.yml` 트리거 오발 방지

`deploy.yml`의 `paths-ignore`(`data/**`, `phases/**`, `*.md`)가 이미 `data/reports/**`, `data/history.md`, `data/processed/trend.json`, `data/action-log.json`을 전부 커버하는지 확인하라. **커버한다면 `deploy.yml`을 수정하지 않는다** — 새 데이터 경로가 기존 `data/**` 패턴 안에 이미 포함되어 있어야 정상이다. 만약 실제로 안 걸러진다면(예: 최상위 `*.md`가 `data/history.md`처럼 하위 경로의 `.md`는 안 걸러낼 수 있음 — glob 패턴 동작을 직접 확인하라) 그때만 `paths-ignore`를 최소 수정한다.

## Acceptance Criteria

```bash
npm run lint
npm run build
```

`.github/workflows/weekly-report.yml`이 유효한 YAML 문법이어야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 크론 스케줄이 매주 월요일 00:00 UTC(09:00 KST)로 정확히 설정됐는가?
   - `workflow_dispatch`로 수동 실행 가능한가(테스트를 위해 필수)?
   - 필요한 시크릿(`ANTHROPIC_API_KEY`, `SLACK_WEBHOOK_URL`)이 각 스텝에 올바르게 주입되는가?
   - `deploy.yml`의 `paths-ignore`가 이번 phase의 새 데이터 경로를 실제로 커버하는지 직접 확인했는가(추측하지 않았는가)?
   - git commit 스텝이 변경 없을 때 스킵하는 멱등성을 갖는가?
3. 이 step이 phase의 마지막 step이므로, 전체 완료 후 `npm run lint && npm test && npm run build`를 한 번 더 실행해 phase 전체가 정상 동작하는지 최종 확인한다.
4. 결과에 따라 `phases/13-weekly-report-automation/index.json`의 step 7을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `deploy.yml`의 `paths-ignore`가 실제로 새 경로를 못 걸러내는 게 확인되지 않은 이상 함부로 수정하지 마라 — 먼저 패턴 매칭을 직접 확인하라.
- `collect-data.yml`의 크론 스케줄이나 기존 스텝 순서를 건드리지 마라 — 완전히 새로운 워크플로우 파일이다.
- 기존 테스트를 깨뜨리지 마라.
