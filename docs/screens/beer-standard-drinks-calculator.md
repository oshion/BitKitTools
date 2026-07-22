# Screen: Standard Drinks / Alcohol Units Calculator

## URL
`/beer/standard-drinks-calculator` (EN), `/ko/beer/standard-drinks-calculator` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`medical`) → Related Tools.

## 목적
술 종류, 용량, 도수(ABV%)를 입력하면 국가별 "표준잔(standard drink)" 또는 "알코올 유닛(unit)" 기준으로 순수 알코올량을 환산해 보여준다. **혈중알코올농도(BAC)나 운전 가능 여부와는 무관한, 순수 알코올 함량 환산 도구**다 — `bac-calculator`와 목적이 명확히 다르다.

## disclaimerType 결정 근거
`general`이 아니라 **`medical`**로 정한다. 경쟁사 리서치 결과 이 종류의 계산기는 전부 주간/일간 권장 섭취량, 건강 위험 같은 보건 가이드라인 콘텐츠를 동반하는 것이 표준 패턴이었다 — 순수 산술 변환기가 아니라 건강 정보 인접 콘텐츠이므로 `growth-percentile`/`sleep-schedule`과 같은 수준의 신중함이 필요하다.

## 경쟁사 리서치 요약 (설계 근거)
- 국가별 표준잔 정의가 서로 다르다: **UK/Drinkaware 8g**, **호주/싱가포르 10g**, **캐나다 13.45g**, **미국 14g**(1잔 = 순수 알코올 그램수 기준)
- 조사한 모든 경쟁사(NHS, Drinkaware, Alcohol Think Again)가 **"운전 가능"이라는 표현을 단 한 번도 쓰지 않는다** — 전부 건강 위험/주간 권장량 프레이밍만 사용한다. 이 프로젝트도 동일 원칙을 따른다.
- Drinkaware는 칼로리 환산(치즈버거/피자 개수 비교)을 부가 콘텐츠로 넣어 참여도를 높인다 — 재미 요소로 고려할 만하다.

## 입력
- 음료 종류(맥주/와인/증류주/직접입력 프리셋 — ABV% 자동 채움, `bac-calculator`의 음료 프리셋 UI 패턴 재사용 가능하나 컴포넌트 자체는 공유하지 않는다)
- 용량(mL 또는 fl oz)
- 도수(ABV%, 프리셋 선택 시 자동 채움 또는 직접 입력)
- **국가/정의 선택**: 미국(14g) / 영국(8g) / 호주·싱가포르(10g) / 캐나다(13.45g) — 드롭다운, 기본값은 locale 기준(EN→미국 14g, KO→국내에 공식적으로 통용되는 표준잔 정의가 없으므로 미국 14g을 기본값으로 하되 명확히 라벨링)

## 출력/로직 (`lib/utils/standardDrinksCalculator.ts`)
```ts
export type DrinkStandard = 'us' | 'uk' | 'au-sg' | 'canada'
export const GRAMS_PER_STANDARD_DRINK: Record<DrinkStandard, number> // us:14, uk:8, 'au-sg':10, canada:13.45

export function calculateStandardDrinks(input: {
  volumeMl: number
  abvPercent: number
  standard: DrinkStandard
}): { pureAlcoholGrams: number; standardDrinks: number; caloriesKcal: number }
```
- 순수 알코올량(g) = `volumeMl × (abvPercent / 100) × 0.789`(에탄올 밀도 g/mL)
- 표준잔 수 = `pureAlcoholGrams / GRAMS_PER_STANDARD_DRINK[standard]`
- 칼로리(선택적 부가 콘텐츠) = `pureAlcoholGrams × 7`(알코올 1g당 약 7kcal — Drinkaware 패턴 참고, 참고용 근사치임을 명시)

## UI 구성
- 입력 폼: 음료 종류/용량/도수 → 국가 선택
- 결과: **표준잔 수가 유일한 큰 초점**(`text-5xl` 급), 그 아래 순수 알코올량(g)과 칼로리를 보조 정보로 작게 표시
- **주간 권장량 참고 문구**(선택적 콘텐츠, 상시 노출 아님 — 결과 아래 작은 안내 텍스트): 선택한 국가 기준의 공식 주간 권장 상한(예: 영국 14 units/week)을 인용하고, "이 값은 일반 가이드라인이며 개인 건강 상태에 따라 다르다"는 문구를 반드시 동반한다.
- `bac-calculator`로 이어지는 링크 배치 가능("혈중알코올농도가 궁금하다면 BAC Calculator") — 단, 이 툴 자체가 BAC나 운전 판단과 무관함을 FAQ에서 명확히 구분한다.

## tools-config 항목
- `id`/`slug`: `standard-drinks-calculator`
- `category: 'beer'`, `disclaimerType: 'medical'`, `aiOverviewResistance: 'high'`
- **disclaimerType 확정**(2026-07-21 사용자 확인): `medical`로 확정. 아래 Disclaimer 문구를 `DisclaimerBanner`(rule 11, 공통 컴포넌트) `medical` 타입 문구에 반영하되, 이 툴 전용으로 다음 요소를 모두 포함해 면밀하게 작성한다:
  - 의학적 조언/진단이 아니라는 점
  - 계산값은 근사치(환산 공식 기반)이며 개인의 체질/건강 상태에 따른 실제 영향과 다를 수 있다는 점
  - 임신, 간질환, 약물 복용 등 특정 건강 상태에서는 "권장량" 자체가 무의미하거나 위험할 수 있으므로 해당하는 경우 반드시 의료 전문가와 상담해야 한다는 점
  - 이 도구는 음주 여부나 음주량에 대한 권고를 하지 않으며 단순 환산 정보만 제공한다는 점
- Disclaimer 문구(초안): "본 계산 결과는 의학적 조언이나 진단이 아니며, 순수 알코올 함량을 환산한 참고용 근사치입니다. 실제 건강에 미치는 영향은 체질, 건강 상태, 복용 중인 약물 등에 따라 다를 수 있습니다. 임신 중이거나 간질환 등 건강상 이유로 음주에 주의가 필요한 경우, 또는 음주 관련 건강 판단이 필요한 경우 반드시 의료 전문가와 상담하시기 바랍니다. 본 도구는 음주를 권장하거나 특정 음주량을 권고하지 않습니다."
- 키워드 자기잠식 확인: `bac-calculator`는 "혈중알코올농도 추정치(운전 판단과 무관)", 이 툴은 "순수 알코올량을 표준잔/유닛으로 환산"— 목적이 다르므로 FAQ에서 명확히 구분 서술
- FAQ 예:
  - "표준잔(standard drink)이 뭔가요?" → 국가별 정의가 다르다는 점부터 설명
  - "이 계산기로 운전 가능 여부를 알 수 있나요?" → "아니오"로 시작, `bac-calculator`와의 차이를 명확히 설명하고 링크
  - "국가마다 표준잔 기준이 다른 이유는?" → 각국 보건당국이 독립적으로 정의를 정하기 때문이라는 점 설명

## Analytics 이벤트
`Tool Open`, `Calculate`

## 금지사항
- "운전 가능", "안전 음주량" 등 판단성 표현을 어디에도 쓰지 않는다 — 이 원칙은 `bac-calculator`보다도 더 엄격하게 지킨다(이 툴은 BAC/운전과 아예 무관한 순수 환산 도구이므로, 그런 맥락이 끼어들 여지 자체를 만들지 않는다).
- 특정 국가의 권장량을 "정답"처럼 단정하지 않는다 — 여러 국가 기준이 병존한다는 점을 항상 함께 보여준다.
- `bac-calculator`와 로직/컴포넌트를 공유하지 않는다(rule 8, 툴 격리).
