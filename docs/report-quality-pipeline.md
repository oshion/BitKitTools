# 주간 리포트 품질 파이프라인 설계

> 상태: 구현 완료 (2026-11-19). 첫 적용: 2026-11-23(월) 주간 리포트.

## 문제
2026-11-09·11-16 리포트의 숫자는 원본과 맞았지만 해석이 틀렸다.

| 실제 오류 | 원인 |
|---|---|
| 치이카와 결과 페이지의 "공유/재시작 버튼 결함" (해당 페이지에 두 버튼이 없음) | URL 단위 Clarity 수치에서 AI가 UI 원인을 추측 |
| 위 추측이 개선 스펙 3건으로 확산 | AI 요약이 `history.md`에 저장되고 스펙 생성기가 이를 읽음 |
| "세션 +80.8%, 신규 카테고리가 성장 견인" (47건 중 39건이 11-09 하루) | AI가 주간 합계만 받아 날짜 쏠림을 모름 |
| "세션 8→26, +225%" (5건은 Lighthouse 측정) | 측정 방문 오염을 데이터에서 구분하지 않음 |
| "hydrometer calibration 73→24위" 강조 (11-15에 80위로 복귀) | 소표본 변동을 신호처럼 서술 |

## 원칙
1. 숫자와 사실은 코드가 쓴다. AI는 바꿀 수 없다.
2. AI의 주장은 근거 ID가 있어야 하고, 코드 검사를 통과해야 발행된다.
3. 검증되지 않은 AI 문장은 다음 단계의 입력이 되지 않는다.
4. 실패하면 그럴듯한 글이 아니라 사실만 있는 리포트를 낸다.

## 흐름
```
processed 데이터 → buildReportFacts() → AI(주장 JSON) → validateClaims() → renderReport()
                         │                                   │
                         └── 사실 섹션 ──────────────────────┴── 통과 주장 + 제거된 주장 목록
```

## 1. 사실 계층 — `scripts/lib/reportFacts.ts`
`buildReportFacts(days, previousDays, weeklyData, context): ReportFact[]`

```ts
type SampleGrade = 'usable' | 'small'
type ReportFact = {
  id: string            // 예: 'totals.clicks', 'page:/travel/x/:gsc', 'query:bac calculator:rank'
  text: string          // 리포트에 그대로 출력되는 문장
  values: number[]      // 주장 검사에 쓰는 숫자
  subjects: string[]    // 이 사실이 다루는 경로·쿼리
  sample: SampleGrade
}
```

포함 항목: 클릭·노출·페이지별 세션 합계와 전주 비교, 페이지·쿼리 지표, 순위 변동, 날짜별 세션과 최대 집중일 비율, 측정 방문 제외 수치, Clarity URL 단위 신호, Lighthouse 점수, 정리 후보.

- **소표본(`small`)**: 클릭 10 미만, 노출 100 미만, 세션 30 미만 중 해당 지표.
- **세션 표기**: GA4 수집값은 페이지별 합계라 한 방문자가 중복될 수 있으므로 "페이지별 세션 합계"로 표기한다.
- **측정 방문 보정**: 수정(PR #54, 2026-11-19) 이전 월요일의 측정 대상 5개 페이지 세션에서 1건씩 뺀다. 11-23 리포트 기간(11-14~11-20)의 11-16이 해당하며, 정리 후보 계산에도 적용한다.

## 2. 주장 계층 — `scripts/lib/reportClaims.ts`
AI는 마크다운 대신 아래 구조만 반환한다. 사실 목록은 프롬프트에 ID와 함께 제공한다.

```ts
type ReportClaim = {
  section: ReportSectionKey
  kind: 'observation' | 'hypothesis' | 'recommendation'
  text: string
  evidence: string[]    // ReportFact.id
}
```

`validateClaims(claims, facts): { accepted: ReportClaim[]; rejected: { claim: ReportClaim; reason: string }[] }`

| 규칙 | 제거 조건 |
|---|---|
| R1 근거 존재 | `evidence`가 비었거나 없는 ID를 인용 |
| R2 숫자 일치 | 문장의 숫자가 인용한 사실의 값과 다름(반올림 허용) |
| R3 대상 일치 | 문장의 경로·쿼리가 인용한 사실의 `subjects`에 없음 |
| R4 요소 추측 금지 | 근거가 URL 단위인데 버튼·링크·핸들러·버그·결함 등 특정 요소나 고장을 지목 |
| R5 소표본 단정 금지 | 근거가 `small`인데 급증·급락·성장·견인·개선됨·원인 등 단정 표현 사용, 또는 `hypothesis`·`recommendation`이 아닌 추세 주장 |
| R6 쏠림 | 세션의 50% 이상이 하루에 몰린 주에 세션 증가를 성과로 서술 |

표현 목록은 코드 상수로 두고 실제 오탐·누락 사례가 나오면 테스트와 함께 고친다.

## 3. 출력 — `renderReport()`
1. 제목·기간
2. **검증된 사실** (코드 작성)
3. 기존 섹션 순서의 통과 주장. `hypothesis`는 "가설:", `recommendation`은 "제안:"으로 표시
4. 정리 후보 표, 성능 경고, 제목 실험 (기존처럼 코드 작성)
5. **제거된 주장** N건과 이유

파일 경로는 그대로라 Slack 발송, 전략 재검토, 스펙 append는 변경 없이 동작한다.

**실패 처리**: JSON이 잘못되면 1회 재요청한다. 그래도 실패하거나 응답이 잘리면 사실 섹션만으로 리포트를 발행하고 상단에 표시한다.

## 4. 확산 차단
- `history.md`의 주간 줄은 `buildFallbackHistoryEntry()`로 코드가 쓴다. AI는 더 이상 history를 쓰지 않는다.
- 스펙 프롬프트에서 history는 "이미 시도한 일과 결정" 용도로만 쓰고, 현황 근거는 사실 목록만 준다.
- 틀린 것으로 확인된 2026년 11월 2주차 AI 문장(버튼 점검 필요)은 정정 표시한다.
- 스펙 생성 기준 추가:
  - 게시 28일 미만 페이지는 개선 스펙을 만들지 않는다.
  - 근거 세션의 50% 이상이 하루에 몰린 이탈률 후보는 제외한다.
  - 이탈률 후보는 10세션 이상이어야 한다.

## 5. 테스트
실제 오류를 픽스처로 고정한다.
- 11-16 버튼 결함 문장 → R4로 제거
- 11-16 세션 성장 문장 → R6으로 제거
- calibration 순위 단정 → R5로 제거
- 잘못된 숫자·없는 경로·없는 근거 ID → R1~R3으로 제거
- 정상 관찰 문장과 가설 표시 문장 → 통과
- 11-16 날짜 측정 방문 보정, 잘못된 JSON·잘린 응답 → 사실 전용 리포트
- 병합 전 임시 브랜치의 Actions에서 실제 API로 1회 실행해 결과를 확인하고, 데이터는 커밋하지 않는다.

## 범위 밖
- AI 가설이 실제로 맞는지 판정하는 것 (가설로 표시만 한다)
- 과거 리포트 재생성
- 요소 단위 Clarity 데이터 수집

## 변경 파일
신규: `scripts/lib/reportFacts.ts`, `scripts/lib/reportClaims.ts`, `scripts/lib/renderReport.ts` 및 테스트
수정: `scripts/generate-report.ts`, `scripts/generate-improvement-spec.ts`, `scripts/generate-growth-spec.ts`, `scripts/generate-weekly-specs.ts`, `.claude/commands/report-review.md`, `data/history.md`
