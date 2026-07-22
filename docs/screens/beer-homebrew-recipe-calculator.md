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
- `calculateAbv(og: number, fg: number, formula: 'standard' | 'high-gravity'): number`
  - `standard`(기존 유지): `ABV = (OG − FG) × 131.25` — 선형 근사식, 일반적인 도수(대략 OG 1.070 미만)에서 충분히 정확
  - **`high-gravity`(신규)**: `ABV = (76.08 × (OG − FG) / (1.775 − OG)) × (FG / 0.794)` — 고비중 맥주(barleywine, imperial stout 등, OG 1.070 이상)에서 선형 근사식보다 오차가 커지는 문제를 보정하는 공식. 출처: 홈브루잉 커뮤니티에서 널리 통용되는 비선형 보정식(정밀 유도 출처는 명확하지 않음 — 아래 "출처 표기 원칙" 참고)
  - `calculateAbv`는 `og`가 1.070 이상이면 UI에서 `high-gravity` 공식을 기본 선택으로 제안하되, 사용자가 언제든 토글로 전환할 수 있게 한다(자동 강제 전환 금지 — 사용자가 직접 측정한 값을 어떤 공식으로 계산했는지 알 수 있어야 함).
- `calculateDilution(currentAbv: number, currentVolume: number, targetAbv: number): { waterToAddL: number; finalVolumeL: number }`

### 출처 표기 원칙 (신규)
경쟁사 조사 결과 두 ABV 공식 모두 "브루잉 커뮤니티 표준"으로 널리 쓰이지만, 어느 경쟁사도 1차 학술 출처를 명확히 인용하지 못했다(정밀 유도 과정이 공개 문헌에 명확히 남아있지 않음). **거짓으로 정밀한 학술 인용을 만들지 않는다** — 대신 "선형 근사식(전통적으로 널리 쓰임)"과 "고비중 보정식(고비중 맥주에서 더 정확하다고 알려진 비선형 보정식)"이라고 정직하게 서술하고, 어느 공식을 썼는지 결과에 항상 표시한다. 이런 투명한 태도 자체가 출처를 아예 안 밝히는 경쟁사 대비 차별점이다.

## UI 구성
- 비중 입력 2개(OG/FG) + 배치 사이즈 → 즉시 ABV 결과 표시
- **공식 선택 토글**(신규): "표준(선형)" / "고비중(비선형 보정)" — OG 1.070 이상이면 고비중을 기본 제안, 결과에 어느 공식을 썼는지 작은 라벨로 항상 표시
- "목표 도수로 희석하기" 섹션 토글 시 추가 입력/결과 노출
- 결과: ABV(%) 큰 숫자 강조, 희석 시 "물 X L 추가 시 목표 도수 도달"
- **신규 툴 연결**: 비중 입력 필드 근처에 "온도 보정이 필요하신가요? → Hydrometer Temperature Correction Calculator" 링크를 추가한다(별도 신규 툴, `relatedToolIds`로도 연결)

### 디자인 방향 — 크고 깔끔하게
- ABV(%) 값을 결과 카드의 유일한 큰 초점으로(`text-5xl` 급), 공식 선택 라벨/희석 결과는 보조 정보로 작게 배치해 시각적 위계를 분명히 한다.
- 공식 토글은 버튼 그룹(세그먼트 컨트롤) 형태로 단순하게 — 드롭다운보다 클릭 한 번으로 전환되는 편이 "가볍고 빠른 도구" 인상에 맞는다.

## tools-config 항목
- `category: 'beer'`, `disclaimerType: 'general'`, `aiOverviewResistance: 'high'` (자기 레시피 기반 계산이라 AI 대체 저항력 강함)
- 키워드 보강(신규): 기존 "abv calculator", "homebrew calculator" 외에 `hydrometer`, `specific gravity`, `og fg calculator`, `original gravity final gravity` 등 GSC에서 실제 노출되고 있는 검색어를 EN 키워드 목록에 추가한다.
- FAQ 예: "OG/FG는 어떻게 측정하나요?", "근사식과 실제 도수가 다른 이유는?", **"표준 공식과 고비중 공식은 언제 다르게 써야 하나요?"(신규) → OG 1.070을 기준으로 설명, 저비중 맥주에서는 두 공식 차이가 미미하다는 점도 언급**

## 상태
- 최근 입력한 레시피 값은 `useLocalStorage`로 저장해 재방문 시 자동 채움 가능 (선택적 개인화).

## Analytics 이벤트
`Tool Open`, `Calculate`, `Copy Result`

## 금지사항
- BAC Calculator와 로직/컴포넌트를 공유하지 않는다. 이유: 컴포넌트 격리 원칙 — 도수 계산이라는 표면적 유사성이 있어도 두 툴은 독립적으로 유지한다.
