# Screen: Flight Delay Compensation Calculator

## URL
`/travel/flight-delay-compensation` (EN), `/ko/travel/flight-delay-compensation` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`legal`) → Related Tools.

## 목적
노선(EU 역내/역외, 미국 등), 지연 시간, 적용 규정을 선택하면 예상 보상 범위를 계산해 보여준다. 실제 청구 가능 여부는 항공사/규정 확인이 필요함을 명확히 한다.

## 입력
- 적용 규정 선택 (EU261, 미국 DOT 기준 등 — 정적 규정 테이블)
- **혼란 유형 선택(신규)**: 지연(Delay) / 취소(Cancellation) / 탑승거부(Denied Boarding) — 아래 "혼란 유형별 계산 로직 차이" 참고, 규정에 따라 이 선택이 계산 로직 자체를 바꾼다
- 출발/도착 공항 국가 (EU 역내/역외 판정용, 드롭다운)
- 비행 거리 구간 (1500km 이하 / 1500~3500km / 3500km 초과 — EU261 보상액 구간 기준. 미국 DOT 탑승거부 선택 시에는 이 입력이 필요 없다 — 아래 참고)
- 지연 시간 (시간 단위 슬라이더 — 취소/탑승거부 선택 시에는 "대체편으로 최종 도착이 얼마나 늦었는지"로 라벨을 바꿔서 동일 필드 재사용)
- 지연 사유 (항공사 귀책 / 기상 등 불가항력 — 불가항력 선택 시 "보상 대상 아닐 가능성" 안내. **탑승거부는 이 선택지에서 제외** — 아래 참고)
- **편도 운임(신규, 미국 DOT + 탑승거부 조합에서만 노출)**: 통화 + 금액 입력. EU261/지연/취소 조합에서는 이 입력 자체를 렌더링하지 않는다.

## 혼란 유형별 계산 로직 차이 (신규, 반드시 숙지)
리서치 결과, EU261과 미국 DOT는 "취소"와 "탑승거부"를 완전히 다르게 취급한다 — **이 차이를 무시하고 하나의 계산식으로 뭉뚱그리면 안 된다**.

- **EU261 + 지연/취소**: 동일한 거리기반 정액 보상표(€250 / €400 / €600, 거리 구간 기준)를 그대로 쓴다. 기존 `estimateCompensation` 로직 재사용 가능 — 취소는 "지연"의 사유 중 하나로 취급해도 무방하다(EU261 원문상 취소도 동일 거리 구간 표를 적용받음).
- **EU261 + 탑승거부(오버부킹)**: 취소/지연과 **동일한** 거리기반 정액표를 그대로 쓴다(EU261은 오버부킹에 대해 "불가항력" 항변 자체를 인정하지 않는다 — 항공사의 상업적 결정이기 때문). 즉 EU261 한정으로는 세 가지 혼란 유형이 전부 같은 계산 로직을 공유한다.
- **미국 DOT + 지연/취소**: 미국 DOT는 애초에 단순 지연/취소에 대한 **정부 의무 보상 자체가 없다**(항공사 자율 고객서비스 정책 사항) — 기존 툴의 "eligible: false, reason: 항공사 정책에 따름" 로직을 그대로 유지한다.
- **미국 DOT + 탑승거부(오버부킹으로 인한 강제 하기)**: 유일하게 미국 DOT가 실제로 강제하는 보상 항목. **거리기반이 아니라 편도 운임의 백분율 기반**이다 — 대체편 도착이 1~2시간 늦으면 편도 운임의 200%(상한액 있음), 2시간(국제선은 4시간) 초과로 늦으면 400%(상한액 있음). **정확한 현재 상한액은 harness 구현 시점에 14 CFR § 250.5(eCFR, https://www.law.cornell.edu/cfr/text/14/250.5)에서 직접 재확인해서 하드코딩하라** — 웹 검색 중 출처마다 다른 상한액(예: $675/$1,350 vs $1,075/$2,150)이 나와 최신 값이 불확실하다. 반드시 규정 원문에서 현재 유효한 금액을 확인한 뒤 `flightCompensationRules.ts`에 출처(§ 250.5, 확인 날짜)와 함께 기록한다.

## 출력/로직 (`lib/utils/flightDelayCompensation.ts`)
- 규정별 보상 테이블은 `lib/config/flightCompensationRules.ts`에 정적 데이터로 관리 (외부 API 아님)
- `estimateCompensation(input: FlightDelayInput): { amountRange: { min: number; max: number }; currency: string; eligible: boolean; reason: string }` — `FlightDelayInput`에 `disruptionType: 'delay' | 'cancellation' | 'denied-boarding'` 필드를 추가한다.
- 미국 DOT + 탑승거부 조합만 별도 계산 경로를 탄다: `estimateDeniedBoardingCompensationUs(fareAmount: number, currency: string, delayHours: number, isInternational: boolean): { amountRange: {...}; currency; eligible; reason }` — 위 "혼란 유형별 계산 로직 차이"의 퍼센트/구간 로직 사용

## UI 구성
- 단계별 입력 폼 (규정 → **혼란 유형** → 거리 또는 운임(조합에 따라 분기) → 지연시간 → 사유(탑승거부 제외))
- 결과: 예상 보상 범위를 큰 숫자로, 바로 아래 "실제 청구 가능 여부는 항공사 확인 필요" 문구
- 지연 사유가 불가항력이면 결과 카드 톤을 중립/경고로 전환 (녹색 "지급 확정" 같은 단정적 표시 금지) — 탑승거부는 이 불가항력 예외가 적용되지 않는다는 점을 결과에 함께 설명

### 디자인 방향 — 크고 깔끔하게
- 예상 보상액이 결과 카드의 유일한 큰 초점(`text-5xl` 급 통화 표시), eligible 여부/사유는 그 아래 보조 텍스트로.
- 혼란 유형에 따라 입력 필드가 동적으로 바뀌는데(거리 vs 운임), 전환 시 레이아웃이 갑자기 점프하지 않도록 부드러운 전환 처리.

## tools-config 항목
- `category: 'travel'`, `disclaimerType: 'legal'`, `aiOverviewResistance: 'high'` (다변수 개인화 결과)
- Disclaimer 문구: "본 계산 결과는 법률 자문이 아니며, 실제 보상 여부는 항공사 및 관할 규정을 반드시 확인하시기 바랍니다."
- 키워드 보강(신규): 기존 "flight delay compensation" 계열 외에 GSC에서 실제 노출된 `flight cancellation compensation calculator`, `delayed flight compensation`, `eu261 compensation table`을 EN 키워드에 추가한다.
- 제목/설명 문구도 "delay"만이 아니라 "delay, cancellation, or denied boarding"을 명시적으로 언급하도록 갱신한다(현재는 delay 위주 문구).
- `relatedToolIds`에 신규 툴 `layover-connection-calculator`, `jetlag-recovery-calculator` 추가(상호 연결).
- FAQ 예: "EU261이 적용되는 조건은?", "지연 사유가 기상이면 보상받을 수 없나요?", **"취소된 항공편도 보상받을 수 있나요?"(신규) → EU261은 지연과 동일한 거리기반 표를 적용받는다는 점 설명**, **"탑승거부(오버부킹)도 이 계산기로 확인할 수 있나요?"(신규) → EU261은 지연/취소와 동일 로직, 미국 DOT는 운임 기반의 완전히 다른 계산식을 쓴다는 점을 명확히 구분해서 설명**

## 상태
- 로컬 `useState`만.

## Analytics 이벤트
`Tool Open`, `Calculate`, `Share`(결과 링크 공유 시 유용 — URL 쿼리로 입력값 인코딩 검토)

## 금지사항
- "보상 지급 확정" 같은 단정적 문구를 사용하지 않는다. 이유: 실제 지급 여부는 항공사/기관 판단 사항이며, 이 툴은 추정치만 제공.
- 규정 테이블(`flightCompensationRules.ts`)의 출처(EU261 원문, DOT 규정 등)를 화면 본문에 명시한다.
- **미국 DOT 탑승거부 상한액을 웹 검색 요약만 보고 하드코딩하지 마라** — 반드시 14 CFR § 250.5 원문에서 현재 유효한 금액을 재확인한다(위 "혼란 유형별 계산 로직 차이" 참고).
- EU261과 미국 DOT의 탑승거부 계산 로직을 뒤섞지 마라 — 완전히 다른 계산 경로로 분리 구현한다.
- 미국 DOT의 "지연/취소는 정부 의무 보상 대상이 아니다"라는 기존 로직을 탑승거부 추가 과정에서 실수로 바꾸지 마라(기존 동작 유지, 탑승거부만 신규 경로 추가).
