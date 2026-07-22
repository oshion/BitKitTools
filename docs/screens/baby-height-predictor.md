# Screen: Child Height Predictor

## URL
`/baby/height-predictor` (EN), `/ko/baby/height-predictor` (KO)

## 공통 콘텐츠 구조
Title → Tool → Description → How To Use → Example → FAQ → Disclaimer(`medical`) → Related Tools.

## 목적
부모(어머니/아버지)의 키와 자녀의 성별을 입력하면 Mid-Parental Height(중간부모키) 공식을 사용해 자녀가 성인이 되었을 때의 예상 키를 계산해 보여준다.

## 입력
- 자녀 성별 (남/여 — 공식이 성별로 분리됨)
- 어머니 키
- 아버지 키
- 단위 토글: cm / ft-in (두 입력 필드 모두에 적용되는 전역 토글)

## 출력/로직 (`lib/utils/heightPredictor.ts`)
- `calculateMidParentalHeight(input: { sex: 'male' | 'female'; motherHeightCm: number; fatherHeightCm: number }): { predictedHeightCm: number; rangeLowCm: number; rangeHighCm: number }`
- 공식 (Mid-Parental Height method):
  - 남아: `(motherHeightCm + fatherHeightCm + 13) / 2`
  - 여아: `(motherHeightCm + fatherHeightCm - 13) / 2`
  - 오차범위: `±8.5cm`
- **출처**: Tanner JM, Goldstein H, Whitehouse RH. "Standards for children's height at ages 2–9 years allowing for heights of parents." *Archives of Disease in Childhood*, 1970. — 소아내분비학에서 표준으로 인용되는 원 논문. `±8.5cm` 범위는 예상 성인 키의 **3~97 백분위 구간**에 해당한다는 것이 원 논문의 정의이며(68% 신뢰구간이 아님), 이후 연구에서 여아 `±9cm`/남아 `±10cm` 등으로 세분화하기도 했다는 점을 FAQ에서 함께 언급해 신뢰도를 높인다.
- 본문/FAQ에 위 출처를 명시적으로 인용한다(WHO/CDC를 인용하는 `growth-percentile`과 동일한 수준의 출처 명시 원칙 적용).
- 단위 변환 유틸: `cmToFeetInches(cm: number): { feet: number; inches: number }`, `feetInchesToCm(feet: number, inches: number): number` — `lib/utils/unitConversion.ts`에 위치 (다른 툴에서도 재사용 가능하면 공용, 아니면 `heightPredictor.ts` 내부에 둔다)

## UI 구성
- 입력 폼: 성별 선택(토글/라디오) → 어머니 키 입력 → 아버지 키 입력 → 단위 토글(cm / ft-in)
- 결과 카드: 예측 키를 주 단위 + 보조 단위 병기(예: "175cm (5'9\")") + `rangeLowCm`~`rangeHighCm` 범위를 함께 표시
- 결과 카드 바로 아래 상시 노출 문구: "이는 부모 키 기반의 통계적 추정이며, 실제 성장은 영양·수면·환경 등 다양한 요인에 따라 달라질 수 있습니다. 정확한 평가는 소아과 전문의와 상담하세요."
- 공식 출처(Tanner, Goldstein & Whitehouse, 1970, *Archives of Disease in Childhood*) 본문에 명시

### 계산/결과 애니메이션 (체류시간·재미 목적)
- 버튼 클릭 → 결과 노출 사이에 실제 계산은 즉시 끝나지만, **최소 500~700ms의 인위적 지연**을 두고 그 사이 "계산 중" 상태를 보여준다(예: 버튼 내부에 스피너 또는 펄스 애니메이션, `isCalculating` state로 제어). 다른 툴들은 계산이 순간적이라 이 상태가 없었지만, 이 툴은 재미 요소로 의도적으로 추가한다.
- 결과 카드는 기존 `animate-fade-in`(globals.css, 0.4s ease-out)으로 진입.
- 예측 키 숫자는 **0에서 최종값까지 카운트업**하는 애니메이션을 적용한다(예: `requestAnimationFrame` 기반 400~600ms 이징, 소수점 없이 정수 cm 단위로 증가). 최종 프레임에서 ft-in 보조 표기와 범위(`rangeLowCm`~`rangeHighCm`)가 함께 나타난다.
- 카운트업 로직은 이 툴 전용 훅(`useCountUp` 또는 컴포넌트 내부 함수)으로 구현하고, 다른 툴 폴더에서 import하지 않는다(rule 8, 툴 격리).
- `prefers-reduced-motion: reduce` 사용자는 카운트업 없이 최종값을 즉시 표시한다(접근성).

### 성장 요인 체크리스트 (정성적, 숫자 가산 없음)
결과 카드 아래에 "우리 아이가 유전적 잠재치에 가깝게 자라도록 돕는 요인" 섹션을 둔다. **반드시 정성적 정보만 제공하며, 특정 행동이 몇 cm를 더해준다는 식의 수치를 절대 표시하지 않는다** — Mid-Parental Height 공식 자체가 이미 유전적 잠재치의 추정이고, "환경 최적화로 예측치를 초과해 더 자란다"는 정밀 가산 효과는 소아내분비학에서 검증된 바 없다(금지사항 참고).

- UI: 체크박스 4개 항목(누르면 상태만 토글되는 순수 UI 인터랙션, 서버/LocalStorage 저장 없음, 계산 결과에 어떤 영향도 주지 않음). 항목을 펼치면(아코디언) 한두 문장 설명 + 출처가 나타난다.
- 항목과 출처:
  1. **충분한 수면** — 성장호르몬(GH)의 상당 부분이 깊은 수면(서파수면) 중 분비되며, 수면장애가 있는 아동에서 저신장 유병률이 더 높다는 연구가 있다. (출처: 소아 수면장애-저신장 관련 연구, PMC)
  2. **균형 잡힌 영양** — 단백질·칼슘·비타민D·아연 등은 뼈 성장과 IGF-1(성장 관련 호르몬) 작용에 관여하며, 에너지·단백질 섭취가 부족하면 IGF-1 감소가 관찰된다. (출처: 미국 아동 대상 영양 적정성-신장 백분위 연구, PMC)
  3. **규칙적인 신체활동** — 연령에 맞는 신체활동은 골격계 발달과 전신 대사에 도움이 된다. **"운동을 하면 키가 더 큰다"는 인과관계는 검증되지 않았으므로 절대 그렇게 서술하지 않는다** — "건강한 골격 발달을 지원한다" 수준으로만 표현한다.
  4. **정기적인 소아과 검진** — 성장호르몬 결핍, 갑상선 기능저하, 셀리악병 등 미진단 상태는 성장을 저해할 수 있다. 정기 검진으로 조기 발견·관리하면 유전적 잠재치에 가깝게 도달하는 데 도움이 된다는 것이 소아내분비학의 일반적 견해다.
- 체크리스트는 위에서부터 항목이 순서대로 있으며, 언어별(EN/KO) 문장은 최종 구현 시 자연스럽게 번역한다.

### 대상(성장) 애니메이션 — 체크리스트 연동, 예측 키와는 무관
체크리스트를 재미 요소로 강화하기 위해, 체크한 항목 수에 따라 작은 새싹→나무 일러스트(SVG, 초록색 톤)가 단계적으로 자라는 장식용 애니메이션을 추가한다(예: 0개 체크=씨앗, 1~2개=새싹, 3개=묘목, 4개=작은 나무).
- **이 애니메이션은 순수 장식/게임화 요소이며, 예측된 cm 수치나 결과 카드의 키 값과는 완전히 분리되어 있어야 한다.** 나무가 자라는 것이 "아이가 더 클 것"을 의미하는 것으로 오인되지 않도록, 체크리스트 섹션 제목 근처에 작은 안내문구("참고용 체크리스트이며 실제 예측 키에는 영향을 주지 않습니다")를 추가한다.
- 체크 해제 시 나무도 이전 단계로 되돌아간다(순수 인터랙션, 진행 상태 저장 없음).

## 공유 기능 (Web Share API)
`sleep-schedule` 툴(`SleepScheduleTool.tsx`)에 이미 구현된 패턴을 그대로 재사용한다:
```ts
function handleShare() {
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({
      title: 'Child Height Predictor',
      text: `Predicted adult height: ${predictedHeightCm}cm (${rangeLowCm}–${rangeHighCm}cm range)`,
      url: window.location.href,
    }).catch(() => {/* user cancelled */})
  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).catch(() => {/* ignore */})
  }
  sendEvent('share')
}
```
- 공유되는 `url`은 **툴 페이지 자체**(`window.location.href`)이며, 부모 키 입력값이나 예측 결과를 쿼리 파라미터 등으로 URL에 인코딩하지 않는다 — 친구가 링크를 열면 빈 입력 폼이 나오고 직접 계산해야 한다(개인정보 노출 방지, `sleep-schedule`과 동일 원칙).
- 공유 `text`에는 예측 키와 범위를 포함한다(개인 식별 정보가 아니므로 `sleep-schedule`이 나이/기상시각을 포함하는 것과 동일 수준으로 허용).
- 결과 카드 내 "Share" 텍스트 버튼으로 노출, 클릭 시 `share` 이벤트 전송.

## tools-config 항목
- `id`/`slug`: `height-predictor`
- `category: 'baby'`, `disclaimerType: 'medical'`, `aiOverviewResistance: 'high'`
- Disclaimer 문구: "본 예측은 부모 키 기반 통계적 추정이며 실제 의학적 평가가 아닙니다. 정확한 성장 평가는 소아과 전문의와 상담이 필요합니다." + Mid-Parental Height 공식 출처 명시
- 키워드 자기잠식 확인: `growth-percentile`은 "현재 나이 기준 WHO/CDC 백분위", `height-predictor`는 "성인이 되었을 때의 예상 키" — 목적이 명확히 달라 자기잠식 위험 낮음. FAQ에서 두 툴의 차이를 명시적으로 설명한다.
- FAQ 예:
  - "이 예측이 얼마나 정확한가요?" → 출처(Tanner et al., 1970) 인용 + ±8.5cm 범위는 예상 성인 키의 3~97 백분위 구간을 의미한다는 점, 이후 연구에서 여아 ±9cm/남아 ±10cm로 세분화되기도 한 점을 언급해 통계적 추정일 뿐 확정치가 아님을 설명
  - "이 계산기와 Baby Growth Percentile Calculator는 무엇이 다른가요?" → 전자는 성인 예상 키, 후자는 현재 나이 기준 백분위임을 명확히 구분(자기잠식 방지 목적)
  - "유전 외에 키에 영향을 주는 요인은 무엇인가요?" → 영양, 수면, 만성질환, 환경 요인 등을 일반적 수준으로 설명, 진단성 표현 금지
  - "체크리스트 항목을 실천하면 예측 키보다 더 클 수 있나요?" → "아니오"로 시작 — 체크리스트는 유전적 잠재치에 가깝게 도달하도록 돕는 일반적 건강 요인 정보이며, 예측치를 초과하는 성장을 보장하지 않는다는 점을 명확히 설명

## 상태
- 최근 입력한 부모 키/자녀 성별은 `useLocalStorage`로 저장 가능(재방문 시 자동 채움) — 저장 여부를 사용자에게 명시적으로 안내(옵트인 권장), `growth-percentile`과 동일한 정책.

## Analytics 이벤트
`Tool Open`, `Calculate`, `Share`

## 향후 확장 후보: Khamis-Roche 정밀 모드 (별도 스코프, 이번 작업에 포함하지 않음)
경쟁사 리서치 결과, 상위 경쟁사 대부분이 Mid-Parental Height를 보조 방식으로 두고 **Khamis-Roche 방법(Khamis HJ, Roche AF, 1994, *Pediatrics* — Fels Longitudinal Study 기반)을 기본으로 쓰고 있어** 업계 표준이 되어 있다. 다만 이 방법은 Mid-Parental Height처럼 깔끔한 단일 공식이 아니라 **연령(6개월 단위)×성별별로 다른 회귀계수를 쓰는 테이블 기반 방법**이라 `growthStandards.ts`(WHO/CDC LMS 파라미터)급의 데이터 소싱 작업이 별도로 필요하다. **이번 beer/travel/developer 확장 작업과 같은 묶음으로 진행하지 않는다** — 별도 논의와 별도 harness phase로 다룰 것을 권장한다.

진행하게 될 경우 반영할 내용:
- 추가 입력: 자녀 현재 나이(만 4~17.5세 범위, 그 미만은 "이 방법은 지원 범위 밖" 안내), 현재 키, 현재 체중
- 결과: 기존 Mid-Parental Height 결과와 나란히 "정밀 모드(Khamis-Roche)" 결과를 함께 보여주는 방식 추천 — 두 방법 중 하나로 대체하지 않고 비교 제공(Mid-Parental Height는 이미 출처가 명확하고 검증된 기존 기능이므로 유지)
- 회귀계수 테이블은 **원 논문(Khamis & Roche, 1994, Pediatrics 94(4):504-507) 또는 이를 충실히 재현한 신뢰 가능한 2차 출처에서 직접 확인**해야 하며, 이 문서를 포함해 지금까지 어떤 문서에도 실제 계수를 임의로 만들어 넣지 않았다 — 향후 진행 시 정확한 데이터 확보가 선행 조건이다.
- 오차범위(SE)는 Mid-Parental Height의 고정 `±8.5cm`와 달리 방법·연령·성별에 따라 다른 값을 쓴다(경쟁사 InfantChart가 남아 `±5.6cm`/여아 `±4.3cm`로 제시 — 이 수치도 원 출처 재확인 필요).
- 사춘기 단계(Tanner stage) 기반 예측은 검색 수요는 있으나 민감한 의료 입력(신체 발달 단계 자가 판정)이라 이번 확장 범위에서 제외한다.

## 금지사항
- 예측치를 확정된 성인 키처럼 단정적으로 표현하지 않는다 — 항상 "예상 범위"로 표현하고 통계적 추정임을 명시한다.
- Mid-Parental Height 공식 출처 없이 임의의 계수를 사용하지 않는다.
- `growth-percentile`과 목적을 혼동시키는 문구를 쓰지 않는다 (백분위 ≠ 성인 키 예측).
- **성장 요인 체크리스트 항목에 어떤 형태로든 cm 가산 수치를 표시하지 않는다** — "충분한 수면을 취하면 +2cm" 같은 정량 표현은 절대 금지. 항목은 항상 정성적 설명 + 출처로만 구성한다.
- "운동을 하면 키가 더 큰다"는 식의 검증되지 않은 인과관계를 서술하지 않는다 — 신체활동은 "건강한 골격 발달 지원" 수준으로만 표현한다.
- 대상(나무) 애니메이션의 성장 단계를 예측 키(`predictedHeightCm`)나 범위 값과 연동하지 않는다 — 체크리스트 체크 개수에만 반응하는 완전히 분리된 장식 요소여야 한다.
- 공유 URL에 부모 키 입력값이나 계산 결과를 쿼리 파라미터로 인코딩하지 않는다 — 공유 링크는 항상 툴 페이지 자체를 가리킨다.
