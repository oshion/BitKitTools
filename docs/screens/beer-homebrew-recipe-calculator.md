# Screen: Homebrew Recipe & ABV/Dilution Calculator

## URL
`/beer/homebrew-recipe-calculator` (EN), `/ko/beer/homebrew-recipe-calculator` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → [Disclaimer(`general`)] → Related Tools.

## 목적
홈브루어가 배치 사이즈, 초기 비중(OG)/최종 비중(FG)을 입력하면 예상 도수(ABV)와 희석 시 필요한 물의 양을 계산한다.

## 입력
- 배치 사이즈 (L 또는 gal)
- 초기 비중 (Original Gravity, 예: 1.050)
- 최종 비중 (Final Gravity, 예: 1.010)
- (선택) 목표 도수 입력 시 필요한 희석 비율 역산

## 출력/로직 (`lib/utils/homebrewCalculator.ts`)
- `calculateAbv(og: number, fg: number): number` — 표준 근사식(ABV = (OG - FG) × 131.25) 사용
- `calculateDilution(currentAbv: number, currentVolume: number, targetAbv: number): { waterToAddL: number; finalVolumeL: number }`

## UI 구성
- 비중 입력 2개(OG/FG) + 배치 사이즈 → 즉시 ABV 결과 표시
- "목표 도수로 희석하기" 섹션 토글 시 추가 입력/결과 노출
- 결과: ABV(%) 큰 숫자 강조, 희석 시 "물 X L 추가 시 목표 도수 도달"

## tools-config 항목
- `category: 'beer'`, `disclaimerType: 'general'`, `aiOverviewResistance: 'high'` (자기 레시피 기반 계산이라 AI 대체 저항력 강함)
- FAQ 예: "OG/FG는 어떻게 측정하나요?", "근사식과 실제 도수가 다른 이유는?"

## 상태
- 최근 입력한 레시피 값은 `useLocalStorage`로 저장해 재방문 시 자동 채움 가능 (선택적 개인화).

## Analytics 이벤트
`Tool Open`, `Calculate`, `Copy Result`

## 금지사항
- BAC Calculator와 로직/컴포넌트를 공유하지 않는다. 이유: 컴포넌트 격리 원칙 — 도수 계산이라는 표면적 유사성이 있어도 두 툴은 독립적으로 유지한다.
