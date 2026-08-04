# Step 1: data-retention-and-rollup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이전 step에서 만든 processed 데이터 구조를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/process-analytics.ts` (이전 step에서 생성 — `ProcessedDay` 타입/구조 확인)
- `/bitkittools-ai-automation-roadmap.md`의 Phase 1 6번 항목 (raw 60일 보관, 오래된 processed는 집계 요약만 유지한다는 정책 원문)

## 작업

`scripts/manage-data-retention.ts`를 작성한다. 두 가지 정리를 수행한다:

**1. raw 60일 보관**: `/data/raw/*.json` 중 파일명의 날짜가 오늘 기준 60일보다 오래된 파일은 삭제한다(파일명 패턴 `{ga4|gsc|clarity}-{YYYY-MM-DD}.json`에서 날짜를 파싱).

**2. processed 주간 롤업**: `/data/processed/*.json`(일별 파일) 중 파일명의 날짜가 오늘 기준 90일보다 오래된 파일들을, ISO 주차 단위로 묶어서 `/data/processed/weekly/{연도}-W{주차}.json` 하나로 합친 뒤, 합쳐진 원본 일별 파일들은 삭제한다.
- 주간 롤업 스키마(시그니처 수준): `{ week: "2026-W05", dateRange: { start, end }, totalSessions, totalGscImpressions, totalGscClicks, avgGscPosition, topPages: [...], topQueries: [...] }` — `이전 step의 ProcessedDay[] 배열을 해당 주차만큼 모아 합산/평균`한다. `topPages`/`topQueries`는 impressions 또는 sessions 기준 상위 N개(예: 10개)만 남긴다(전체를 다 남기면 롤업의 의미가 없다 — 압축이 목적).
- 이미 롤업된 주(같은 `{연도}-W{주차}.json`이 이미 존재)는 다시 만들지 않고 건너뛴다(멱등성).
- 롤업 대상 일별 파일이 없는 주(예: 아직 90일이 안 지난 주)는 건너뛴다.

**공통**: 두 정리 작업 모두 실제로 삭제/롤업한 파일 목록을 콘솔에 로그로 남긴다(나중에 워크플로우 로그에서 뭐가 지워졌는지 추적 가능하도록).

## Acceptance Criteria

```bash
npm run lint
npm run build
npx tsx scripts/manage-data-retention.ts
```

지금은 raw/processed 파일이 전부 최근 데이터라 실제로 삭제/롤업될 파일이 없을 가능성이 높다 — 그 경우 "삭제/롤업 대상 없음"을 로그로 남기고 정상 종료하는지 확인한다. 테스트 코드에서는 임시 디렉토리에 오래된 날짜의 가짜 파일을 만들어 실제로 삭제/롤업되는지 검증하는 유닛 테스트를 작성한다(Jest, `fs`를 임시 디렉토리로 모킹하거나 `os.tmpdir()` 기반 임시 폴더 사용).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 60일 이내 raw 파일은 삭제되지 않는가?
   - 90일 이내 processed 일별 파일은 롤업되지 않는가?
   - 이미 롤업된 주는 재처리되지 않는가(멱등성)?
   - 삭제/롤업 대상이 없을 때도 에러 없이 정상 종료하는가?
   - 실제 삭제/롤업 동작을 검증하는 유닛 테스트가 있는가?
3. 결과에 따라 `phases/11-analytics-processing/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 60일 이내 raw 파일이나 90일 이내 processed 파일을 실수로 삭제하지 마라 — 날짜 파싱/비교 로직에 오프바이원 에러가 없는지 특히 주의하라.
- 실제 프로덕션 `/data/` 디렉토리에서 테스트하지 마라 — 유닛 테스트는 반드시 임시 디렉토리를 사용한다.
- 이 step에서 `collect-data.yml`을 수정하지 마라(다음 step 스코프).
- 기존 테스트를 깨뜨리지 마라.
