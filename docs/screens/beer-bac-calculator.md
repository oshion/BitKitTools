# Screen: BAC Calculator (Blood Alcohol Concentration)

## URL
`/beer/bac-calculator` (EN), `/ko/beer/bac-calculator` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`medical`, + 전용 경고 배너) → Related Tools.

## ⚠️ 법적 리스크 — 반드시 숙지
음주운전 판단 근거로 오인될 수 있는 YMYL 툴이다. 표준 `medical` disclaimer만으로는 부족하며, 아래 강화 규칙은 **선택이 아니라 필수**다 (하네스 재세팅 논의에서 확정, profile v2 Section 13-5 / ADR-014).

## 목적
성별, 체중, 술 종류, 마신 양, 경과 시간을 입력하면 Widmark 공식 기반 예상 혈중 알코올 농도(BAC)를 계산해 보여준다. **운전 가능 여부 판단 용도가 아님을 최우선으로 전달한다.**

## 입력
- 성별 (남/여 — Widmark 계수 r값에 사용)
- 체중 (kg/lb 전환 가능)
- 음주 항목 추가 (술 종류 프리셋 선택 시 ABV 자동 채움 + 용량 mL)
- 음주 시작 후 경과 시간 (시간 단위)

## 출력/로직 (`lib/utils/bacCalculator.ts`)
- Widmark 공식: `BAC = (알코올 섭취량(g) / (체중(g) × r)) - (분해율 × 경과시간)`
- `calculateBac(input: BacInput): { bacPercent: number; isEstimateOnly: true }` — 반환 타입에 `isEstimateOnly: true`를 고정해 컴포넌트가 이 필드를 무시하고 단정적 UI를 그릴 수 없게 설계

## UI 구성 (필수 안전장치)
1. **상시 노출 경고 배너** (닫기 버튼 없음, 페이지 최상단 고정 또는 결과 바로 위):
   > "이 결과는 운전 가능 여부를 판단하는 근거로 사용할 수 없습니다. 음주 후에는 절대 운전하지 마세요."
2. 결과는 **숫자(%)만 중립적으로 표시** — 배경색/아이콘으로 "안전"·"위험"·"운전 가능" 등급을 암시하지 않는다. 초록색·체크 아이콘·신호등 UI 전면 금지.
3. 임계값(예: 0.03%, 0.08% 등 국가별 법정 기준)과 무관하게 경고 배너 문구는 항상 동일하게 노출한다 — 수치가 낮다고 경고를 약화하지 않는다.
4. 표준 `<DisclaimerBanner disclaimerType="medical" />` 문구: "본 계산 결과는 의학적 조언이 아니며 참고용입니다. 실제 건강/음주 관련 판단은 반드시 전문가와 상담하시기 바랍니다." + 계산식 출처(Widmark formula, 학술 근거) 명시
5. 위 1~4는 `tools-config.ts`의 `disclaimerType` 값과 무관하게 이 컴포넌트에 고정 렌더링한다 (config로 끌 수 없음).

## tools-config 항목
- `category: 'beer'`, `disclaimerType: 'medical'`, `aiOverviewResistance: 'high'`
- FAQ 예: "BAC 계산기로 운전해도 되는지 알 수 있나요? (아니오, 알 수 없습니다 — 이유 설명)", "Widmark 공식이란?"

## 상태
- 로컬 `useState`만. 입력값(성별/체중/음주량)은 민감할 수 있어 LocalStorage에 저장하지 않는다.

## Analytics 이벤트
`Tool Open`, `Calculate` — 개인 식별 가능한 입력값은 이벤트 payload에 포함하지 않는다.

## 금지사항
- "운전 가능", "안전", "OK" 등 통과/합격을 암시하는 어떤 표현·색상·아이콘도 사용하지 않는다.
- 경고 배너를 닫거나 숨기는 UI를 제공하지 않는다.
- 계산 결과값에 따라 경고 문구의 강도를 조절하지 않는다 (항상 동일 문구).
