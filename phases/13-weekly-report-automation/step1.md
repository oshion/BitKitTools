# Step 1: weekly-data-aggregation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트 구조와 이전 step의 산출물을 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/scripts/process-analytics.ts` (이전 step에서 `bounceRate` 필드와 `export`된 `ProcessedDay`/`ProcessedPage`/`ProcessedQuery` 타입 추가됨 — 이 타입을 그대로 재사용)
- `/scripts/manage-data-retention.ts`와 `/scripts/__tests__/manage-data-retention.test.ts` (이 프로젝트의 순수 함수 + Jest 단위 테스트 작성 관례 참고)
- `/data/processed/` 아래 실제 파일 1~2개를 열어 실제 데이터 형태를 확인하라

## 작업

`scripts/lib/aggregateWeeklyReport.ts`를 작성한다. **순수 함수**로 작성하고(파일 시스템 접근 없음), CLI 진입점은 만들지 않는다 — 이 함수는 다음 step(`generate-report.ts`)이 직접 import해서 쓴다.

### 시그니처

```typescript
import type { ProcessedDay } from '../process-analytics'

export interface ZeroCtrPage {
  path: string
  impressions: number
}

export interface HighBouncePage {
  path: string
  bounceRate: number
  sessions: number
}

export interface CtrDeviation {
  path: string
  segmentType: 'country' | 'device'
  segment: string
  segmentCtr: number
  overallCtr: number
  deviationRatio: number // segmentCtr / overallCtr — 1보다 작을수록 그 세그먼트에서 저조
}

export interface QueryPositionChange {
  query: string
  page: string
  earliestPosition: number
  latestPosition: number
  positionChange: number // earliestPosition - latestPosition. 양수 = 순위 상승(개선)
}

export interface WeeklyReportData {
  periodStart: string // YYYY-MM-DD, days 중 가장 이른 날짜
  periodEnd: string // YYYY-MM-DD, days 중 가장 늦은 날짜
  totals: { impressions: number; clicks: number; sessions: number }
  zeroCtrPages: ZeroCtrPage[] // impressions > 0 && clicks === 0, 상위 10개 (impressions 내림차순)
  highBouncePages: HighBouncePage[] // sessions >= 5 (표본 부족 노이즈 배제), bounceRate 내림차순 상위 10개
  ctrDeviations: CtrDeviation[] // 아래 규칙 참고
  risingQueries: QueryPositionChange[] // positionChange 내림차순 상위 10개 (많이 오른 순)
  fallingQueries: QueryPositionChange[] // positionChange 오름차순(가장 많이 떨어진 순) 상위 10개
}

export function aggregateWeeklyReport(days: ProcessedDay[]): WeeklyReportData
```

### 핵심 규칙

1. **표본 부족 노이즈 방지**: `highBouncePages`는 `sessions >= 5`인 페이지만 포함한다. 해당하는 페이지가 없으면 빈 배열을 반환한다 — 트래픽이 거의 없는 지금 단계에서 세션 1~2개짜리 100% 이탈률을 "문제"로 표시하면 안 된다.
2. **CTR 편차 (`ctrDeviations`)**: `queries` 배열을 `(path, country)`와 `(path, device)`로 각각 그룹핑해 세그먼트별 CTR(`clicks/impressions`)을 계산하고, 페이지 전체 CTR과 비교한다. **최소 노출수 임계값(`impressions >= 10`)을 만족하는 세그먼트만** 포함한다(표본 부족 노이즈 방지, 1번과 동일 원칙). `deviationRatio`가 0.5 미만이거나 2 이상인(2배 이상 차이) 세그먼트만 결과에 포함한다 — 미미한 차이는 노이즈로 간주하고 제외한다.
3. **순위 추이 (`risingQueries`/`fallingQueries`)**: `days`를 날짜순 정렬 후, 가장 이른 날과 가장 늦은 날 양쪽에 모두 존재하는 `(query, page)` 조합만 비교 대상으로 삼는다(하루만 나타난 쿼리는 추이를 계산할 수 없으므로 제외). 각 날짜 내에서 같은 `(query, page)`가 country/device별로 여러 행일 수 있으므로, **해당 날짜의 해당 쿼리에 대해 impressions 가중 평균 position**을 먼저 구한 뒤 비교하라(기존 `process-analytics.ts`의 `gscAvgPosition` 계산 방식과 동일한 패턴).
4. **days가 비어있거나 1일치만 있는 경우**: `risingQueries`/`fallingQueries`는 빈 배열을 반환한다(비교 불가). 나머지 필드는 정상 계산한다.
5. `days` 배열의 정렬 순서를 가정하지 마라 — 함수 내부에서 `date` 기준으로 정렬해서 처리하라.

### 테스트

`scripts/lib/__tests__/aggregateWeeklyReport.test.ts`를 작성한다. `manage-data-retention.test.ts`처럼 실제 `ProcessedDay` 형태의 고정(fixture) 데이터를 만들어:
- `zeroCtrPages`가 impressions>0/clicks=0 페이지만 걸러내는지
- `highBouncePages`가 sessions<5 페이지를 제외하는지
- `ctrDeviations`가 임계값 미만 노출 세그먼트를 제외하고, 편차가 미미한 세그먼트도 제외하는지
- `risingQueries`/`fallingQueries`가 첫날·마지막날 모두 존재하는 쿼리만 비교하는지, 방향(양수/음수)이 올바른지
- 빈 배열/1일치 입력에서 크래시 없이 빈 결과를 반환하는지

를 각각 검증하라.

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 순수 함수로 작성됐는가(fs/네트워크 접근 없음)?
   - 노이즈 방지 임계값(세션 5, 노출 10)이 코드에 명시적으로 반영됐는가?
   - `any` 타입을 쓰지 않았는가(CLAUDE.md rule 6)?
   - 위 5가지 테스트 케이스가 모두 존재하고 통과하는가?
3. 결과에 따라 `phases/13-weekly-report-automation/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 이 step에서 파일 I/O, Anthropic API 호출, Slack 연동을 하지 마라 — 순수 계산 로직만 담당한다(다음 step들의 스코프).
- 임계값 없이 sessions 1~2개짜리 데이터를 "문제 있음"으로 표시하는 로직을 만들지 마라.
- 기존 테스트를 깨뜨리지 마라.
