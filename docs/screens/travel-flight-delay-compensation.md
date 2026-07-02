# Screen: Flight Delay Compensation Calculator

## URL
`/travel/flight-delay-compensation` (EN), `/ko/travel/flight-delay-compensation` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`legal`) → Related Tools.

## 목적
노선(EU 역내/역외, 미국 등), 지연 시간, 적용 규정을 선택하면 예상 보상 범위를 계산해 보여준다. 실제 청구 가능 여부는 항공사/규정 확인이 필요함을 명확히 한다.

## 입력
- 적용 규정 선택 (EU261, 미국 DOT 기준 등 — 정적 규정 테이블)
- 출발/도착 공항 국가 (EU 역내/역외 판정용, 드롭다운)
- 비행 거리 구간 (1500km 이하 / 1500~3500km / 3500km 초과 — EU261 보상액 구간 기준)
- 지연 시간 (시간 단위 슬라이더)
- 지연 사유 (항공사 귀책 / 기상 등 불가항력 — 불가항력 선택 시 "보상 대상 아닐 가능성" 안내)

## 출력/로직 (`lib/utils/flightDelayCompensation.ts`)
- 규정별 보상 테이블은 `lib/config/flightCompensationRules.ts`에 정적 데이터로 관리 (외부 API 아님)
- `estimateCompensation(input: FlightDelayInput): { amountRange: { min: number; max: number }; currency: string; eligible: boolean; reason: string }`

## UI 구성
- 단계별 입력 폼 (규정 → 거리 → 지연시간 → 사유)
- 결과: 예상 보상 범위를 큰 숫자로, 바로 아래 "실제 청구 가능 여부는 항공사 확인 필요" 문구
- 지연 사유가 불가항력이면 결과 카드 톤을 중립/경고로 전환 (녹색 "지급 확정" 같은 단정적 표시 금지)

## tools-config 항목
- `category: 'travel'`, `disclaimerType: 'legal'`, `aiOverviewResistance: 'high'` (다변수 개인화 결과)
- Disclaimer 문구: "본 계산 결과는 법률 자문이 아니며, 실제 보상 여부는 항공사 및 관할 규정을 반드시 확인하시기 바랍니다."
- FAQ 예: "EU261이 적용되는 조건은?", "지연 사유가 기상이면 보상받을 수 없나요?"

## 상태
- 로컬 `useState`만.

## Analytics 이벤트
`Tool Open`, `Calculate`, `Share`(결과 링크 공유 시 유용 — URL 쿼리로 입력값 인코딩 검토)

## 금지사항
- "보상 지급 확정" 같은 단정적 문구를 사용하지 않는다. 이유: 실제 지급 여부는 항공사/기관 판단 사항이며, 이 툴은 추정치만 제공.
- 규정 테이블(`flightCompensationRules.ts`)의 출처(EU261 원문, DOT 규정 등)를 화면 본문에 명시한다.
