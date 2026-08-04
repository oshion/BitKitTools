# Step 0: raw-to-processed-transform

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 실제 raw 데이터 형태를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/collect-analytics.ts` (raw 데이터를 만드는 스크립트 — 어떤 요청으로 이 응답이 나왔는지 확인)
- `/data/raw/` 디렉토리의 실제 파일들(`ga4-*.json`, `gsc-*.json`, `clarity-*.json`)을 직접 열어서 실제 응답 구조를 확인하라. 아래는 실제 수집된 예시다(트래픽이 적어 일부는 비어있을 수 있음):
  - GA4: `{ dimensionHeaders: [{name:"pagePath"},{name:"eventName"}], metricHeaders: [{name:"sessions"},{name:"eventCount"}], metadata, kind, rows?: [{ dimensionValues: [{value}], metricValues: [{value}] }] }` — `rows`는 매칭되는 데이터가 없으면 필드 자체가 없을 수 있다(에러 아님, 정상 빈 응답).
  - GSC: `{ rows: [{ keys: [query, page, country, device], clicks, impressions, ctr, position }], responseAggregationType }` — `page`는 `https://bitkittools.com/...` 형태의 전체 URL이다.
  - Clarity: `{ collectedAt, collectionDate, note, data: [{ metricName, information: [...] }] }` — `information` 배열이 비어있을 수 있다(트래픽이 API 조회 창 밖에 있을 때).

## 작업

`scripts/process-analytics.ts`를 작성한다. `/data/raw/`의 GA4/GSC/Clarity 파일을 읽어 페이지·쿼리 단위로 합쳐서 분석하기 쉬운 형태로 가공한 뒤 `/data/processed/{YYYY-MM-DD}.json`에 저장한다.

**동작 방식**:
- `/data/raw/`를 스캔해서, 아직 `/data/processed/{날짜}.json`이 존재하지 않는 날짜들을 찾아 그 날짜들만 처리한다(이미 처리된 날짜는 건너뛴다 — 멱등성 확보, 재실행해도 중복 처리 안 됨).
- 각 날짜에 대해, GA4/GSC/Clarity 세 파일 중 존재하는 것만 읽는다(수집 실패로 특정 소스가 그 날짜에 없을 수 있음 — 없는 소스는 조용히 건너뛰고 있는 것만으로 처리한다).
- **GA4 pagePath와 GSC page(전체 URL)를 같은 페이지로 매칭**시켜야 한다 — GSC의 `page`에서 `https://bitkittools.com` 부분을 제거하고 trailing slash를 정규화해서 GA4의 `pagePath`와 비교 가능한 형태로 맞춘다.
- 출력 스키마(시그니처 수준, 정확한 필드명은 합리적으로 정하되 아래 정보는 반드시 포함):
  ```ts
  interface ProcessedDay {
    date: string
    pages: Array<{
      path: string
      sessions: number          // GA4, 없으면 0
      events: Record<string, number>  // GA4 eventName → eventCount (tool_open/input_enter/calculate/copy_result/share)
      gscImpressions: number    // 해당 페이지의 모든 쿼리 impressions 합
      gscClicks: number
      gscAvgPosition: number | null  // impressions 가중평균 또는 단순평균 — 방식은 코드 주석으로 명시
    }>
    queries: Array<{
      query: string; page: string; country: string; device: string
      impressions: number; clicks: number; ctr: number; position: number
    }>  // GSC row를 거의 그대로 유지 — Phase 2의 검색 의도 분류가 쿼리 단위 원본이 필요함
    clarity: unknown | null   // Clarity raw data.data를 그대로 보존(정보가 제한적이라 가공 없이 pass-through)
  }
  ```
- `queries`는 원본에 가깝게 유지하고, `pages`만 GA4+GSC를 합친 요약으로 만든다.

## Acceptance Criteria

```bash
npm run lint
npm run build
npx tsx scripts/process-analytics.ts
```

로컬에 있는 `/data/raw/*.json` 파일들을 대상으로 스크립트를 실행해 `/data/processed/*.json`이 정상 생성되는지 확인한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 이미 처리된 날짜를 재실행해도 중복 처리하지 않는가(멱등성)?
   - GA4/GSC 중 하나가 없는 날짜도 에러 없이 처리되는가?
   - GSC page(전체 URL)와 GA4 pagePath가 올바르게 매칭되는가?
   - `queries`가 원본 GSC row 수준의 세부 정보를 유지하는가?
3. 결과에 따라 `phases/11-analytics-processing/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이미 처리된 날짜를 다시 처리해서 `/data/processed/`에 중복/덮어쓰기가 발생하게 만들지 마라.
- 존재하지 않는 raw 파일(수집 실패한 소스)에 대해 스크립트가 크래시하게 만들지 마라 — 없으면 건너뛴다.
- 이 step에서 보관 정리(60일 삭제, 롤업) 로직을 추가하지 마라(다음 step 스코프).
- 이 step에서 `collect-data.yml`을 수정하지 마라(다음다음 step 스코프).
- 기존 테스트를 깨뜨리지 마라.
