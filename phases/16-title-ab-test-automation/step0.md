# Step 0: ctr-benchmark-detection

## 읽어야 할 파일

먼저 아래 파일들을 읽고 이 phase의 설계 배경과 기존 관례를 파악하라:

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/bitkittools-ai-automation-roadmap.md`의 **"2-2. 타이틀/설명 순차 A/B 테스트 자동화"** 섹션과 **"Phase 4"** 섹션 — 이 phase 전체 설계 근거가 여기 있다. 특히 "후보 선정 (2단계 CTR 판단)"과 "모듈 경계 원칙"(판단 로직과 정책 로직 분리) 부분을 정확히 이해하고 시작하라.
- `/scripts/lib/detectStagnation.ts` — 이 프로젝트의 순수 함수 + 파일 I/O 분리 관례(`readX`/`writeX` + 순수 로직 함수), 롤링 데이터 파일을 다루는 패턴 참고
- `/src/types/tool.ts` (`ToolConfig`, `DisclaimerType`)

## 배경

지금 사이트는 오가닉 세션/클릭이 거의 0에 가까워, 자체 데이터만으로 "정상 CTR"의 기준을 정할 방법이 없다. 그래서 이 phase는 임계값을 고정 상수로 박아넣지 않고, 매 실행 시점에 다시 계산되는 두 단계 상대 기준으로 판단한다:
1. **업계 벤치마크 비교** — 데이터량과 무관하게 처음부터 동작
2. **자체 데이터 percentile 비교** — 표본이 쌓이면 자동으로 활성화, 부족하면 조용히 빈 결과

이 스텝에서 만드는 `detectCtrAnomalies.ts`는 **Phase 4(개선 spec 생성)에서도 그대로 재사용하는 공유 모듈**이다. "이 페이지/쿼리의 CTR이 나쁜가?"만 순수하게 판단하고, YMYL 제외나 동시실행 제한 같은 "그래서 뭘 할지"에 대한 정책은 넣지 않는다 — 그건 이 함수를 호출하는 쪽(다음 step 이후)의 책임이다.

## 작업

### 1. `data/reference/ctr-benchmark.json` 작성

SERP 평균 포지션(1~10, 11위 이후는 하나로 묶음)별 업계 평균 CTR 참조표를 정적 JSON으로 만든다. 형식 예:

```json
{
  "source": "업계에 통상적으로 알려진 근사 곡선 — 특정 단일 연구를 인용한 것이 아니며 정확도가 검증된 값이 아니다. 포지션이 낮아질수록 CTR이 감소한다는 방향성만 신뢰하고, 실제 자체 데이터가 쌓이면 이 값 대신 자체 데이터 기반 판단(2차 필터)의 비중을 높여간다.",
  "collectedAt": "2026-08-06",
  "byPosition": [
    { "position": 1, "expectedCtr": 0.28 },
    { "position": 2, "expectedCtr": 0.15 },
    { "position": 3, "expectedCtr": 0.11 },
    { "position": 4, "expectedCtr": 0.08 },
    { "position": 5, "expectedCtr": 0.07 },
    { "position": 6, "expectedCtr": 0.05 },
    { "position": 7, "expectedCtr": 0.04 },
    { "position": 8, "expectedCtr": 0.03 },
    { "position": 9, "expectedCtr": 0.03 },
    { "position": 10, "expectedCtr": 0.02 }
  ],
  "defaultExpectedCtrBeyondPosition10": 0.01
}
```

`source` 필드에는 반드시 "정확한 출처를 특정할 수 없는 근사치"라는 점을 명시하라 — 실제로 검증되지 않은 수치를 마치 공신력 있는 인용인 것처럼 적지 마라.

### 2. `scripts/lib/detectCtrAnomalies.ts` 작성 (순수 함수)

```typescript
export interface PageCtrSample {
  page: string        // URL 또는 slug — 호출부가 정한 식별자 형식을 그대로 사용
  query: string
  impressions: number
  clicks: number
  avgPosition: number
}

export interface PositionCtrBenchmark {
  position: number
  expectedCtr: number
}

export interface CtrBenchmarkTable {
  byPosition: PositionCtrBenchmark[]
  defaultExpectedCtrBeyondPosition10: number
}

export interface CtrAnomaly {
  page: string
  query: string
  ctr: number
  reasons: Array<'below-benchmark' | 'below-site-percentile'>  // 둘 다 해당하면 배열에 둘 다
}

/** 노출수가 minImpressions 미만인 샘플은 애초에 후보 계산에서 제외 */
export function filterByMinImpressions(
  samples: PageCtrSample[],
  minImpressions: number
): PageCtrSample[]

/**
 * 1차 필터: avgPosition으로 벤치마크 기대 CTR을 찾고, 실제 CTR이
 * expectedCtr * ratioThreshold 이하이면 anomaly로 판정.
 * position이 정수가 아니면(예: 3.4) 가장 가까운 정수로 반올림해 매칭한다.
 */
export function detectBenchmarkAnomalies(
  samples: PageCtrSample[],
  benchmark: CtrBenchmarkTable,
  options?: { minImpressions?: number; ratioThreshold?: number }
): CtrAnomaly[]

/**
 * 2차 필터: samples.length(노출 게이트 통과한 것만) < minSampleSize이면
 * 빈 배열 반환. 그 이상이면 CTR 기준 하위 percentileThreshold%를 anomaly로 판정.
 */
export function detectPercentileAnomalies(
  samples: PageCtrSample[],
  options?: { minImpressions?: number; minSampleSize?: number; percentileThreshold?: number }
): CtrAnomaly[]

/**
 * 1차+2차를 합쳐 페이지+쿼리 기준으로 중복 제거하고(reasons 배열에 합침),
 * 두 필터에 모두 해당하는 항목이 배열 앞쪽에 오도록 정렬해 반환.
 */
export function detectCtrAnomalies(
  samples: PageCtrSample[],
  benchmark: CtrBenchmarkTable,
  options?: {
    minImpressions?: number     // 기본 10
    ratioThreshold?: number     // 기본 0.5 (기대 CTR의 50% 이하)
    minSampleSize?: number      // 기본 20 (2차 필터 활성화 최소 표본)
    percentileThreshold?: number // 기본 20 (하위 20%)
  }
): CtrAnomaly[]
```

모든 기본값은 상수로 분리하고 함수 인자로 오버라이드 가능하게 하라 — 하드코딩 금지(Phase 15의 `findScoresBelowThreshold`가 threshold를 인자로 받았던 것과 같은 원칙).

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `scripts/lib/__tests__/detectCtrAnomalies.test.ts`에서 최소 아래 케이스를 검증하는지 확인한다:
   - 노출수가 `minImpressions` 미만인 샘플은 1차/2차 모두에서 제외되는가
   - 벤치마크 대비 CTR이 `ratioThreshold` 경계값에서 정확히 판정되는가 (동일할 때 포함 여부를 명확히 정하고 테스트로 고정)
   - 표본이 `minSampleSize` 미만이면 2차 필터가 빈 배열을 반환하는가 (경고나 예외 없이 조용히)
   - 1차·2차 둘 다 해당하는 항목이 `reasons`에 둘 다 담기고 결과 배열 앞쪽에 오는가
   - `avgPosition`이 10을 초과하면 `defaultExpectedCtrBeyondPosition10`을 쓰는가
3. 결과에 따라 `phases/16-title-ab-test-automation/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `ctr-benchmark.json`의 수치를 마치 검증된 출처가 있는 것처럼 서술하지 마라 — 근사치임을 명시하라.
- `detectCtrAnomalies.ts` 안에 YMYL 제외나 동시실행 제한 같은 정책 로직을 넣지 마라 — 이 모듈은 "CTR이 나쁜가"만 판단한다(다음 step들이 정책을 담당).
- 임계값(10, 0.5, 20, 20%)을 함수 내부에 하드코딩하지 마라 — 반드시 옵션 인자로 받고 기본값만 상수로 둬라.
- 기존 테스트를 깨뜨리지 마라.
