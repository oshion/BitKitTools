# Screen: Hydrometer Temperature Correction Calculator

## URL
`/beer/hydrometer-temperature-correction` (EN), `/ko/beer/hydrometer-temperature-correction` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`general`) → Related Tools.

## 목적
비중계(hydrometer)는 특정 기준온도(보통 59°F/15°C 또는 68°F/20°C)에서 정확하도록 보정되어 있다. 실제 측정 시료의 온도가 기준온도와 다르면 읽은 비중값이 실제와 어긋난다. 측정값·기준온도·실제 시료온도를 입력하면 보정된 비중(SG)을 계산해 보여준다.

## 경쟁사 리서치 요약 (설계 근거)
- 대부분의 경쟁 계산기(Brewer's Friend, MoreBeer)는 입력/출력 UI만 있고 **공식을 공개하지 않는다** — 우리는 공식을 투명하게 보여줘서 차별화한다.
- 공식 자체는 브루잉 커뮤니티에서 "표준"으로 널리 쓰이지만, **1차 학술 출처가 명확하지 않다**(직접 검색 검증 결과, National Bureau of Standards의 물/설탕 용액 열팽창 연구에서 유래했다고 알려져 있으나 정확한 원 논문은 특정하기 어려움). **거짓으로 정밀한 학술 인용을 만들지 않는다** — "브루잉 업계에서 널리 통용되는 표준 보정식"이라고 정직하게 서술한다.
- 두 가지 기준온도(59°F/15°C, 68°F/20°C)가 흔히 쓰이므로 둘 다 프리셋으로 제공한다.

## 입력
- 측정된 비중(Measured Gravity, 예: 1.052)
- 시료 온도(Sample Temperature) — 측정 당시 액체의 실제 온도
- 기준온도(Calibration Temperature) — 비중계 눈금이 정확한 기준 온도. **59°F(15°C) / 68°F(20°C) 프리셋 버튼 + 직접 입력** 모두 지원
- 단위 토글: °F / °C (두 온도 입력 필드 모두에 공통 적용)

## 출력/로직 (`lib/utils/hydrometerCorrection.ts`)
```ts
export function correctGravity(input: {
  measuredGravity: number
  sampleTempF: number
  calibrationTempF: number
}): { correctedGravity: number; deltaFromMeasured: number }
```
- 보정 공식: `CG = MG × f(ST) / f(CT)`
- `f(T) = 1.00130346 − 0.000134722124·T + 0.00000204052596·T² − 0.00000000232820948·T³` (T는 화씨 °F 기준 — °C 입력값은 계산 전 내부적으로 °F로 변환)
- `deltaFromMeasured = correctedGravity − measuredGravity` — 보정 전후 차이를 함께 보여줘서 "온도 보정이 실제로 얼마나 영향을 미치는지" 직관적으로 전달한다.

## UI 구성
- 입력 폼: 측정 비중 → 시료온도 → 기준온도(프리셋 버튼 2개 + 직접입력) → 단위 토글
- 결과: **보정된 비중(CG)이 유일한 큰 초점**(`text-5xl` 급, `UI_GUIDE.md` 결과 강조 색상 `#f59e0b`), 그 아래 작은 텍스트로 "측정값 대비 {deltaFromMeasured} 차이" 표시
- 계산/결과 사이 로딩 애니메이션 없음(다른 beer 툴과 동일하게 즉시 계산 — 인위적 지연 넣지 않는다, height-predictor의 카운트업 연출은 baby 카테고리 전용 패턴이며 이 툴에는 적용하지 않는다)
- 기준온도 선택은 `useLocalStorage`로 opt-in 저장 가능(체크박스, 기본값 off) — 같은 비중계를 반복 사용하는 홈브루어를 위한 편의 기능(경쟁사 Brewer's Friend가 쿠키로 기억하는 패턴 참고)

## Example 콘텐츠
Calculator Academy류 경쟁사의 "완성된 예시" 패턴을 따라, 구체적 수치 예시 1개를 계산 과정과 함께 본문에 포함한다(예: "측정값 1.052, 시료온도 75°F, 기준온도 60°F → 보정값 약 1.053").

## tools-config 항목
- `id`/`slug`: `hydrometer-temperature-correction`
- `category: 'beer'`, `disclaimerType: 'general'`, `aiOverviewResistance: 'high'`
- 키워드: `hydrometer temperature correction calculator`, `hydrometer calculator`, `specific gravity correction`, `gravity correction calculator`, `og calculator` 등 GSC 노출 검색어 반영
- `relatedToolIds: ['homebrew-recipe-calculator']` — `homebrew-recipe-calculator`의 `relatedToolIds`에도 이 툴을 상호 추가
- FAQ 예:
  - "왜 온도 보정이 필요한가요?" → 비중계 보정 원리 설명
  - "59°F와 68°F 중 어느 기준을 써야 하나요?" → 비중계 본체에 표기된 기준온도를 확인하라는 안내
  - "이 공식의 출처는 무엇인가요?" → 브루잉 업계 표준 공식임을 정직하게 서술(위 "경쟁사 리서치 요약" 참고), 허위 학술 인용 금지

## Analytics 이벤트
`Tool Open`, `Calculate`

## 금지사항
- 존재하지 않는 정밀 학술 논문을 출처로 지어내지 않는다 — "브루잉 업계 표준 공식"이라고 정직하게 서술한다.
- `homebrew-recipe-calculator`와 로직/컴포넌트를 공유하지 않는다(rule 8, 툴 격리) — 링크만 상호 연결한다.
- Brix/Plato 단위 지원은 이번 범위에 포함하지 않는다(SG만 지원) — 향후 확장 후보로 `docs/tech-debt-tracker.md`에 남길 수는 있으나 지금 구현하지 않는다.
