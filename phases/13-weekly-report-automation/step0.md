# Step 0: ga4-bounce-rate-collection

## 읽어야 할 파일

먼저 아래 파일들을 읽고 기존 데이터 수집/가공 파이프라인의 구조와 관례를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/collect-analytics.ts` (기존 GA4/GSC/Clarity 수집 스크립트 — 이 파일의 `collectGa4` 함수를 확장한다)
- `/scripts/process-analytics.ts` (raw → processed 변환 스크립트 — `ProcessedPage`에 필드를 추가한다)
- `/.github/workflows/collect-data.yml` (이 워크플로우는 수정하지 않는다 — 기존 스텝이 그대로 새 로직을 포함하게 됨)

## 배경

주간 리포트(다음 step들)가 "이탈률(bounceRate) 높은 페이지"를 보여주려면 GA4에서 `bounceRate` 지표가 필요한데, 현재 `collectGa4`는 `(pagePath, eventName)` 조합으로 `sessions`/`eventCount`만 가져온다. `bounceRate`는 세션 단위 지표라 이벤트 dimension과 섞으면 값이 왜곡되므로, **별도의 GA4 리포트 호출**로 분리해서 가져와야 한다.

## 작업

### 1. `scripts/collect-analytics.ts` 수정

- 새 함수 `collectGa4Bounce(date: string): Promise<void>`를 추가한다. `collectGa4`와 동일한 인증/에러 처리 패턴을 따르되:
  - `dimensions: [{ name: 'pagePath' }]` (eventName 없이 페이지 단독)
  - `metrics: [{ name: 'bounceRate' }, { name: 'sessions' }]`
  - `dateRanges`는 기존 `collectGa4`와 동일하게 `yesterday`
  - 결과를 **별도 파일** `data/raw/ga4-bounce-{date}.json`에 저장한다 (기존 `ga4-{date}.json`은 건드리지 않음 — 이미 process-analytics.ts가 그 파일을 특정 스키마로 파싱하고 있어 스키마를 바꾸면 하위호환이 깨진다).
- `main()` 함수에서 `collectGa4` 성공 시(또는 실패와 무관하게 독립적으로) `collectGa4Bounce`도 호출한다. **`collectGa4Bounce`의 실패는 `ga4Success` 판정에 영향을 주지 않는다** — try/catch로 감싸 로그만 남기고 계속 진행한다(기존 Clarity 수집과 동일한 "best-effort" 원칙).

### 2. `scripts/process-analytics.ts` 수정

- `ProcessedPage` 인터페이스에 `bounceRate: number | null` 필드를 추가한다 (기존 필드들과 나란히, 기본값 `null`).
- `processDate(date)` 함수에서 `data/raw/ga4-bounce-{date}.json`을 읽어(없으면 무시하고 계속 진행 — 기존 `readJsonFile`의 null 반환 패턴 재사용) `pagePath` 기준으로 `pageMap`에 `bounceRate`를 병합하는 로직을 추가한다. GA4가 아직 페이지 단위 세션이 없어 값이 없는 경우 `null`을 유지한다.
- 이 파일이 이미 처리한 날짜(`data/processed/{date}.json`이 이미 존재)는 재처리하지 않는 기존 멱등성 규칙을 그대로 유지한다 — 이 step으로 인해 과거 이미 처리된 날짜의 `processed/*.json`에 `bounceRate`가 소급 추가되지는 않는다(의도된 동작, 문제 없음).

### 3. 이후 step들을 위한 타입 재사용

- `ProcessedDay`, `ProcessedPage`, `ProcessedQuery` 인터페이스 앞에 `export`를 붙여, 다음 step(`scripts/lib/aggregateWeeklyReport.ts`)이 `import type { ProcessedDay } from '../process-analytics'`로 재사용할 수 있게 한다. 타입을 중복 정의하지 마라.

## Acceptance Criteria

```bash
npm run lint
npm run build
npm test
```

`GOOGLE_SERVICE_ACCOUNT_JSON` 없이 로컬에서 `collect-analytics.ts`를 실행하면 명확한 에러로 종료하는지 확인한다(실제 GA4 API 성공 여부는 로컬에서 검증 불가 — 실제 워크플로우 실행에서만 검증).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `bounceRate`를 기존 `ga4-{date}.json` 파일 스키마에 억지로 끼워넣지 않고 별도 파일로 분리했는가?
   - `collectGa4Bounce` 실패가 `ga4Success`/전체 종료 코드에 영향을 주지 않는가?
   - `process-analytics.ts`의 멱등성(이미 처리된 날짜는 건너뜀)이 유지되는가?
   - `ProcessedDay`/`ProcessedPage`/`ProcessedQuery`가 다음 step에서 import 가능하도록 export됐는가?
3. 결과에 따라 `phases/13-weekly-report-automation/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 기존 `ga4-{date}.json`의 스키마(`dimensionHeaders`/`metricHeaders`/`rows`가 `(pagePath, eventName)` 조합)를 변경하지 마라 — 별도 파일로 분리해야 한다.
- `collect-data.yml` 워크플로우 파일 자체는 수정하지 마라(기존 "Run analytics collection" 스텝이 `collect-analytics.ts` 전체를 실행하므로 이미 새 로직을 포함하게 된다).
- 기존 테스트를 깨뜨리지 마라.
