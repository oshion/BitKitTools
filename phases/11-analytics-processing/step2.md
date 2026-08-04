# Step 2: wire-into-collect-data-workflow

## 읽어야 할 파일

먼저 아래 파일들을 읽고 기존 워크플로우 구조와 이전 step들에서 만든 스크립트를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/.github/workflows/collect-data.yml` (기존 — 이 step에서 스텝을 추가한다)
- `/scripts/process-analytics.ts`
- `/scripts/manage-data-retention.ts`

## 작업

`.github/workflows/collect-data.yml`에 두 스텝을 추가한다. 순서는 반드시: **수집(`collect-analytics.ts`) → 가공(`process-analytics.ts`) → 정리(`manage-data-retention.ts`) → 커밋**이어야 한다(가공 전에 정리가 먼저 돌면 그날 막 수집한 raw가 아직 processed로 안 바뀐 상태에서 정리 로직이 도는 순서 오류가 생길 수 있다).

- 기존 "Run analytics collection" 스텝 다음에 "Process analytics data"(`npx tsx scripts/process-analytics.ts`) 스텝을 추가한다.
- 그다음 "Manage data retention"(`npx tsx scripts/manage-data-retention.ts`) 스텝을 추가한다.
- 기존 "Commit collected data" 스텝을 수정해서, `data/raw/*.json`뿐 아니라 `data/processed/**` 전체(일별 파일 + `weekly/` 롤업 파일)와 raw/processed에서 **삭제된 파일**도 커밋에 포함시킨다 — `git add data/raw data/processed`로 변경하고(개별 파일 패턴이 아니라 디렉토리 전체를 add해야 삭제도 스테이징됨), 커밋 메시지도 상황에 맞게 조정한다(예: `chore(collect-data): daily analytics collection, processing & retention {날짜}`).
- 변경사항이 없으면 커밋하지 않는 기존 로직(`git diff --quiet --staged`)은 그대로 유지한다.

## Acceptance Criteria

```bash
npm run build
```
`.github/workflows/collect-data.yml`이 유효한 YAML 문법이어야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 스텝 순서가 수집 → 가공 → 정리 → 커밋인가?
   - `git add`가 `data/raw`와 `data/processed` 둘 다(디렉토리 단위로) 포함하는가 — 삭제된 파일도 커밋에 반영되도록?
   - 빈 커밋 방지 로직이 그대로 유지되는가?
   - 기존 env(시크릿 주입) 설정이 유지되는가?
3. 결과에 따라 `phases/11-analytics-processing/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단
4. 이 step이 phase의 마지막 step이므로, 전체 완료 후 `npm run lint && npm test && npm run build`를 한 번 더 실행해 phase 전체가 정상 동작하는지 최종 확인한다.

## 금지사항

- 스텝 순서를 바꾸지 마라(수집 → 가공 → 정리 → 커밋 고정).
- `git add`를 개별 파일 패턴(`data/raw/*.json`)으로만 좁게 유지하지 마라 — 삭제/롤업된 파일이 커밋에서 누락된다.
- `deploy.yml`이나 이 워크플로우의 `permissions`/`schedule` 설정을 변경하지 마라.
- 기존 테스트를 깨뜨리지 마라.
