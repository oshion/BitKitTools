# Step 0: tool-baby-height-predictor

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 작업물을 파악하라:

- `/docs/screens/baby-height-predictor.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. 계산 공식/출처, 애니메이션, 성장 요인 체크리스트, 공유 기능, 금지사항이 전부 이 문서에 있다)
- `/docs/ARCHITECTURE.md` (레이어 규칙, tools-config 스키마, 면책조항 시스템)
- `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 11, 12: 면책조항 필수 검토, YMYL 콘텐츠 신중 처리)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/*`
- `src/hooks/useAnalyticsEvent.ts`, `src/hooks/useLocalStorage.ts`
- `src/app/globals.css` (`animate-fade-in` keyframe — 재사용할 것, 새로 만들지 마라)
- `src/app/[locale]/baby/growth-percentile/` 및 `src/app/[locale]/baby/sleep-schedule/`의 `page.tsx`, 해당 `components/tools/growth-percentile/GrowthPercentileTool.tsx`, `components/tools/sleep-schedule/SleepScheduleTool.tsx` (opt-in LocalStorage 패턴, `handleShare` 공유 패턴, 페이지 구조 패턴을 그대로 재사용하기 위해 반드시 읽어라)
- `src/app/[locale]/baby/growth-percentile/page.tsx`의 `generateMetadata` 안 `openGraph` 블록에서 **`images: [{ url: \`${SITE_URL}/og/default-${safeLocale}.png\`, width: 1200, height: 630 }]`** 필드를 확인하라 — 이번 세션에 사이트 전역으로 추가된 컨벤션이다. 새로 만드는 `page.tsx`의 `openGraph`에도 동일하게 이 필드를 포함해야 한다(누락하면 카카오톡 등 링크 공유 시 썸네일이 빠진다).

## 작업

### 1. `lib/utils/heightPredictor.ts` (순수 함수)

```ts
export type Sex = 'male' | 'female'
export type HeightPredictionInput = { sex: Sex; motherHeightCm: number; fatherHeightCm: number }
export type HeightPredictionResult = { predictedHeightCm: number; rangeLowCm: number; rangeHighCm: number }

export function calculateMidParentalHeight(input: HeightPredictionInput): HeightPredictionResult
```

- 공식(Mid-Parental Height method, Tanner JM, Goldstein H, Whitehouse RH, *Archives of Disease in Childhood*, 1970):
  - 남아: `(motherHeightCm + fatherHeightCm + 13) / 2`
  - 여아: `(motherHeightCm + fatherHeightCm - 13) / 2`
  - `rangeLowCm = predictedHeightCm - 8.5`, `rangeHighCm = predictedHeightCm + 8.5`
- 단위 변환 헬퍼도 같은 파일 또는 `lib/utils/unitConversion.ts`에 구현: `cmToFeetInches(cm: number): { feet: number; inches: number }`, `feetInchesToCm(feet: number, inches: number): number`.
- `lib/utils/heightPredictor.test.ts`: 남/여 각각 정상 케이스, 경계값(부모 키가 매우 작거나 큰 경우), 단위 변환 왕복 테스트(cm→ft/in→cm이 오차범위 내로 복원되는지)를 포함해 최소 15개 이상의 테스트를 작성한다. **TDD 원칙(CLAUDE.md rule 5)에 따라 테스트를 먼저 작성한 뒤 구현하라.**

### 2. `components/tools/height-predictor/HeightPredictorTool.tsx` (Client Component)

screens 문서의 아래 항목을 전부 구현해야 한다 — 누락하면 안 된다:

- 입력: 자녀 성별(남/여), 어머니 키, 아버지 키, 단위 토글(cm / ft-in, 두 입력 필드에 공통 적용)
- **계산 버튼 클릭 → 결과 사이 최소 500~700ms 인위적 지연 + "계산 중" 상태**(스피너/펄스 애니메이션, `isCalculating` state) — 다른 MVP 툴들과 달리 이 툴만의 의도적 연출이다.
- 결과 카드는 `animate-fade-in`으로 진입(새 keyframe을 만들지 말고 `globals.css`의 기존 클래스를 그대로 사용).
- **예측 키 숫자를 0에서 최종값까지 카운트업**하는 애니메이션(이 컴포넌트 내부 함수 또는 전용 훅으로 구현, `requestAnimationFrame` 기반 400~600ms). `prefers-reduced-motion: reduce`인 사용자는 카운트업 없이 최종값을 즉시 표시한다(`window.matchMedia('(prefers-reduced-motion: reduce)')`로 감지).
- 결과 카드에 예측 키(주 단위 + 보조 단위 병기, 예: "175cm (5'9\")")와 `rangeLowCm`~`rangeHighCm` 범위를 표시.
- 결과 카드 아래 상시 노출 문구: "이는 부모 키 기반의 통계적 추정이며, 실제 성장은 영양·수면·환경 등 다양한 요인에 따라 달라질 수 있습니다. 정확한 평가는 소아과 전문의와 상담하세요."
- **성장 요인 체크리스트**: 체크박스 4개(충분한 수면 / 균형 잡힌 영양 / 규칙적인 신체활동 / 정기적인 소아과 검진), 각 항목은 아코디언으로 펼치면 1~2문장 설명 + 출처가 보인다. **cm 가산 수치는 절대 표시하지 않는다.** 신체활동 항목은 "건강한 골격 발달을 지원한다" 수준으로만 서술하고 "운동하면 키가 큰다"는 인과관계를 암시하지 마라. 체크리스트 섹션에 "참고용 체크리스트이며 실제 예측 키에는 영향을 주지 않습니다" 안내문구를 포함하라.
- **대상(나무) 애니메이션**: 체크한 항목 수(0~4개)에 따라 씨앗→새싹→묘목→나무 4단계로 변하는 작은 SVG 일러스트(초록 톤, 이 컴포넌트 내부에서 인라인 SVG로 구현). 체크 해제 시 이전 단계로 되돌아간다. **이 애니메이션의 단계는 예측 키(`predictedHeightCm`)나 범위와 절대 연동하지 않는다** — 체크 개수에만 반응하는 완전히 분리된 장식 요소다.
- **공유 버튼**: `sleep-schedule`의 `handleShare` 패턴을 그대로 재사용하되, `url`은 `window.location.href`(부모 키 입력값이나 결과를 쿼리파라미터로 인코딩하지 않는다), `text`는 예측 키와 범위를 포함(예: `` `Predicted adult height: ${predictedHeightCm}cm (${rangeLowCm}–${rangeHighCm}cm range)` ``). `navigator.share` 우선, 없으면 `navigator.clipboard.writeText`. 클릭 시 `sendEvent('share')`.
- 최근 입력한 부모 키/자녀 성별은 `useLocalStorage`로 저장 가능하되 **opt-in**(기본값 off, 저장 여부를 사용자에게 명시적으로 안내하는 체크박스) — `growth-percentile`과 동일한 정책.
- `useAnalyticsEvent`로 `tool_open`, `calculate`, `share` 전송. 부모 키 등 개인 식별 가능한 입력값은 이벤트 payload에 포함하지 않는다.

### 3. `tools-config.ts`에 항목 추가

```ts
{
  id: 'height-predictor',
  slug: 'height-predictor',
  category: 'baby',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 4개, 아래 참고 */ ],
  relatedToolIds: ['growth-percentile', 'sleep-schedule'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/height-predictor.png',
  status: 'testing',
  disclaimerType: 'medical',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

또한 `growth-percentile`과 `sleep-schedule`의 기존 `relatedToolIds` 배열에 `'height-predictor'`를 상호 추가하라(양방향 관련 툴 연결).

FAQ에는 반드시 다음을 포함한다(screens 문서 "tools-config 항목" 섹션의 표현을 실제 완성 문장으로 작성):
- "이 예측이 얼마나 정확한가요?" → Tanner et al.(1970) 출처 인용 + `±8.5cm`는 예상 성인 키의 3~97 백분위 구간을 의미한다는 점(68% 신뢰구간 아님)을 명시, 이후 연구에서 여아 `±9cm`/남아 `±10cm`로 세분화되기도 한 점 언급
- "이 계산기와 Baby Growth Percentile Calculator는 무엇이 다른가요?" → 전자는 성인 예상 키, 후자는 현재 나이 기준 백분위임을 명확히 구분
- "유전 외에 키에 영향을 주는 요인은 무엇인가요?" → 영양/수면/만성질환 등 일반 수준 설명, 진단성 표현 금지
- "체크리스트 항목을 실천하면 예측 키보다 더 클 수 있나요?" → "아니오"로 시작, 예측치를 초과하는 성장을 보장하지 않는다는 점을 명확히 설명

### 4. 페이지 (`src/app/[locale]/baby/height-predictor/page.tsx`, Server Component)

`growth-percentile`/`sleep-schedule` step들의 공통 패턴을 그대로 따르되, `generateMetadata`의 `openGraph` 블록에 **반드시** 아래 필드를 포함하라(이번 세션에 확립된 사이트 전역 컨벤션 — 읽어야 할 파일 섹션 참고):

```ts
openGraph: {
  title: `${tool.title[safeLocale]} — BitKitTools`,
  description: tool.description[safeLocale],
  url: canonical,
  siteName: 'BitKitTools',
  type: 'website',
  images: [{ url: `${SITE_URL}/og/default-${safeLocale}.png`, width: 1200, height: 630 }],
},
```

콘텐츠 순서:
```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → HeightPredictorTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(medical)
→ RelatedTools(ToolCardGrid + getRelatedTools('height-predictor')) → AdSlot(footer)
```

**How To Use 방향**: "1) 자녀의 성별을 선택한다 2) 어머니 키를 입력한다 3) 아버지 키를 입력한다 4) 필요하면 cm/ft-in 단위를 전환한다 5) 계산 버튼을 눌러 예상 성인 키를 확인한다".

**Example 콘텐츠**: 가상 예시(예: "아버지 178cm, 어머니 165cm, 아들 → 예상 키 약 178cm, 범위 약 169.5~186.5cm") 1개를 계산 과정과 함께 포함.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `calculateMidParentalHeight`의 단위 테스트(남/여, 단위 변환 포함)가 통과하는지 확인한다.
3. `/baby/height-predictor`(EN/KO)이 정상 빌드되는지 확인하고, 빌드 결과물(`out/`)에서 해당 페이지의 `<meta property="og:image">`가 `/og/default-{en,ko}.png`를 가리키는지 확인한다.
4. 성장 요인 체크리스트에 cm 가산 수치나 "운동하면 키가 큰다"는 식의 표현이 없는지 grep으로 확인한다.
5. 대상(나무) 애니메이션 단계가 `predictedHeightCm`/`rangeLowCm`/`rangeHighCm`을 참조하지 않고 체크박스 상태에만 의존하는지 코드로 확인한다.
6. 공유 URL(`window.location.href`)에 부모 키 입력값이나 계산 결과가 쿼리파라미터로 포함되지 않는지 확인한다.
7. LocalStorage 저장이 기본값 off(opt-in)인지 확인한다.
8. `growth-percentile`/`sleep-schedule`의 `relatedToolIds`에 `height-predictor`가 상호 추가됐는지 확인한다.
9. 결과에 따라 `phases/2-baby-height-predictor/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(생성/수정 파일 목록, disclaimerType, 핵심 결정)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 예측치를 확정된 성인 키처럼 단정적으로 표현하지 마라 — 항상 "예상 범위"로 표현한다.
- Mid-Parental Height 공식 출처(Tanner et al., 1970) 없이 임의의 계수를 쓰지 마라.
- `growth-percentile`과 목적을 혼동시키는 문구를 쓰지 마라(백분위 ≠ 성인 키 예측).
- 성장 요인 체크리스트에 어떤 형태로든 cm 가산 수치를 표시하지 마라 — 정성적 설명 + 출처로만 구성한다.
- "운동을 하면 키가 더 큰다"는 검증되지 않은 인과관계를 서술하지 마라.
- 대상(나무) 애니메이션 단계를 예측 키/범위 값과 연동하지 마라.
- 공유 URL에 부모 키 입력값이나 계산 결과를 쿼리 파라미터로 인코딩하지 마라.
- 아기/자녀의 개인 정보(부모 키)를 사용자 동의 없이 LocalStorage에 자동 저장하지 마라 — opt-in 방식이어야 한다.
- `page.tsx`의 `openGraph`에 `images` 필드를 빠뜨리지 마라(이번 세션에 확립된 사이트 전역 컨벤션).
- 다른 툴 폴더를 import하지 마라(rule 8).
- 기존 테스트를 깨뜨리지 마라.
