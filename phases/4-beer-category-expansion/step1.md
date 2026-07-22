# Step 1: tool-standard-drinks-calculator

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 기존 beer 툴의 코드 패턴을 파악하라:

- `/docs/screens/beer-standard-drinks-calculator.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. **"disclaimerType 결정 근거"와 "tools-config 항목" 섹션의 확정된 Disclaimer 문구를 특히 꼼꼼히 읽어라** — 이 문구는 2026-07-21 사용자가 직접 확정한 것으로, 임의로 축약하거나 순화하면 안 된다)
- `/docs/screens/beer-bac-calculator.md` (이 툴과 목적이 다르다는 점을 FAQ에서 명확히 구분해야 하므로 함께 읽어라)
- `/docs/ARCHITECTURE.md`, `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 11 면책조항 필수 검토 — 이 툴은 `disclaimerType: 'medical'`이다, 규칙 12 YMYL 콘텐츠 신중 처리)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts` (파일 하단 `bac-calculator` 항목 구조 참고용 — 아직 수정하지 마라. `bac-calculator` 수정은 step2에서 진행한다)
- `src/lib/utils/bacCalculator.ts`, `src/lib/utils/bacCalculator.test.ts` — 순수 함수 + 테스트 패턴, 특히 술 종류 프리셋(`DRINK_PRESETS`) 개념 참고
- `src/components/tools/bac-calculator/BacCalculatorTool.tsx` — 음주 항목 프리셋 선택 UI 패턴(`DRINK_PRESETS`, preset 선택 시 ABV/용량 자동 채움) 재사용 가능한 UI 패턴으로 참고하되, **컴포넌트 자체나 `DRINK_PRESETS` 상수를 import하지 마라** — 이 툴 전용으로 새로 만든다(rule 8, 툴 격리)
- `src/components/ui/DisclaimerBanner.tsx` — `medical` 타입 스타일(`border-amber-900/50 bg-amber-950/20 text-amber-200`) 확인
- `src/hooks/useAnalyticsEvent.ts`
- `src/components/ui/AdSlot.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/SchemaWebApplication.tsx`, `SchemaFaqPage.tsx`, `SchemaBreadcrumb.tsx`
- `src/app/[locale]/beer/bac-calculator/page.tsx` — Server Component 페이지 패턴을 그대로 재사용하라

## 작업

### 1. `lib/utils/standardDrinksCalculator.ts` (순수 함수, TDD)

**먼저 테스트를 작성한 뒤 구현하라(CLAUDE.md rule 5).**

```ts
export type DrinkStandard = 'us' | 'uk' | 'au-sg' | 'canada'

export const GRAMS_PER_STANDARD_DRINK: Record<DrinkStandard, number>
// us: 14, uk: 8, 'au-sg': 10, canada: 13.45

export function calculateStandardDrinks(input: {
  volumeMl: number
  abvPercent: number
  standard: DrinkStandard
}): { pureAlcoholGrams: number; standardDrinks: number; caloriesKcal: number }
```

- 순수 알코올량(g) = `volumeMl × (abvPercent / 100) × 0.789`(에탄올 밀도 g/mL)
- 표준잔 수 = `pureAlcoholGrams / GRAMS_PER_STANDARD_DRINK[standard]`
- 칼로리(kcal) = `pureAlcoholGrams × 7`(알코올 1g당 약 7kcal, 참고용 근사치)
- 반환값은 소수점 2자리로 반올림한다.
- `lib/utils/standardDrinksCalculator.test.ts`: 4개 국가 기준(`us`/`uk`/`au-sg`/`canada`) 각각에 대한 정상 케이스, 0 용량/0 도수 경계값, 칼로리 계산 검증을 포함해 최소 12개 이상의 테스트를 작성한다.

### 2. `components/tools/standard-drinks-calculator/StandardDrinksCalculatorTool.tsx` (Client Component)

screens 문서의 아래 항목을 전부 구현해야 한다:

- 입력: 음료 종류(맥주/와인/증류주/직접입력 프리셋 — 선택 시 ABV% 자동 채움. `bac-calculator`의 `DRINK_PRESETS`와 유사한 개념이지만 이 컴포넌트 안에 독립적으로 새로 정의한다, import 금지) → 용량(mL/fl oz 토글) → 도수(ABV%, 프리셋 선택 시 자동 채움 또는 직접 입력) → **국가/정의 선택**(미국 14g / 영국 8g / 호주·싱가포르 10g / 캐나다 13.45g 드롭다운 또는 버튼그룹, 기본값은 locale 기준 — EN/KO 모두 미국 14g을 기본값으로 하되 KO는 "국내 공식 표준잔 정의 없음, 미국 기준 14g을 기본값으로 사용" 라벨을 명시)
- 결과: **표준잔 수가 유일한 큰 초점**(`text-5xl font-bold text-[#f59e0b] tabular-nums`), 그 아래 순수 알코올량(g)과 칼로리를 보조 정보로 작게 표시
- **주간 권장량 참고 문구**(선택적 콘텐츠, 결과 아래 작은 안내 텍스트): 선택한 국가 기준의 공식 주간 권장 상한(예: 영국 14 units/week, 미국 남성 14/여성 7 drinks per week 등 — 정확한 수치는 각국 보건당국 공개 가이드라인 기준으로 구현 시 확인)을 인용하고, "이 값은 일반 가이드라인이며 개인 건강 상태에 따라 다르다"는 문구를 반드시 동반한다.
- `bac-calculator`로 이어지는 링크("혈중알코올농도가 궁금하다면 BAC Calculator") 배치 — 단순 링크(`<a href>` 또는 Next `Link`)만, import는 하지 않는다.
- `useAnalyticsEvent`로 `tool_open`, `calculate` 전송.

### 3. `tools-config.ts`에 항목 추가

**Disclaimer 문구는 아래 확정 문구를 그대로 사용한다(screens 문서에서 사용자가 직접 확정, 임의 축약 금지):**

> "본 계산 결과는 의학적 조언이나 진단이 아니며, 순수 알코올 함량을 환산한 참고용 근사치입니다. 실제 건강에 미치는 영향은 체질, 건강 상태, 복용 중인 약물 등에 따라 다를 수 있습니다. 임신 중이거나 간질환 등 건강상 이유로 음주에 주의가 필요한 경우, 또는 음주 관련 건강 판단이 필요한 경우 반드시 의료 전문가와 상담하시기 바랍니다. 본 도구는 음주를 권장하거나 특정 음주량을 권고하지 않습니다."

이 문구를 `src/lib/i18n/messages/ko.json`/`en.json`의 `disclaimer.medical` 공통 키(다른 medical 툴과 공유하는 일반 문구)와 별개로, 이 툴 페이지 본문에 **추가 문단**으로 노출한다(공통 `<DisclaimerBanner disclaimerType="medical" />`는 그대로 두고, 그 위나 아래에 이 툴 전용 문단을 별도로 렌더링). 영어 번역은 위 한국어 확정 문구의 의미를 그대로 담아 직접 작성한다(임신/간질환/약물/전문가 상담/권고하지 않음 5개 요소 모두 포함 필수).

```ts
{
  id: 'standard-drinks-calculator',
  slug: 'standard-drinks-calculator',
  category: 'beer',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, screens 문서 "tools-config 항목" 참고 — bac-calculator와의 차이를 명확히 구분하는 FAQ 필수 포함 */ ],
  relatedToolIds: ['bac-calculator'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/default-en.png',
  status: 'testing',
  disclaimerType: 'medical',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

`bac-calculator`의 기존 `relatedToolIds`는 이 step에서 건드리지 마라 — step2(bac-calculator-enhancements)에서 상호 링크를 추가한다.

### 4. 페이지 (`src/app/[locale]/beer/standard-drinks-calculator/page.tsx`, Server Component)

`bac-calculator/page.tsx` 패턴을 그대로 따른다. `generateMetadata`의 `openGraph`에 반드시 `images: [{ url: \`${SITE_URL}/og/default-${safeLocale}.png\`, width: 1200, height: 630 }]`를 포함하라.

콘텐츠 순서:
```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → StandardDrinksCalculatorTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → 이 툴 전용 Disclaimer 문단(위 "확정 문구") + DisclaimerBanner(medical)
→ RelatedTools(ToolCardGrid + getRelatedTools('standard-drinks-calculator')) → AdSlot(footer)
```

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `calculateStandardDrinks`의 단위 테스트(4개 국가 기준, 경계값, 칼로리)가 통과하는지 확인한다.
3. `/beer/standard-drinks-calculator`(EN/KO)가 정상 빌드되는지 확인하고, `<meta property="og:image">`가 `/og/default-{en,ko}.png`를 가리키는지 확인한다.
4. 페이지 본문 어디에도 "운전 가능", "안전 음주량" 등 판단성 표현이 없는지 grep으로 확인한다.
5. 확정된 Disclaimer 문구의 5개 요소(진단 아님/근사치/체질별 차이/임신·간질환 등 상담 필요/음주 권고 안 함)가 EN/KO 페이지 본문에 모두 포함되어 있는지 직접 확인한다.
6. 여러 국가 기준이 병존한다는 점이 명확히 보이는지(특정 국가 기준을 "정답"처럼 단정하지 않는지) 확인한다.
7. `bacCalculator.ts`/`BacCalculatorTool.tsx`를 import하지 않았는지 확인한다.
8. 결과에 따라 `phases/4-beer-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(생성/수정 파일 목록, disclaimerType, 핵심 결정)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- "운전 가능", "안전 음주량" 등 판단성 표현을 어디에도 쓰지 마라 — 이 툴은 BAC/운전과 아예 무관한 순수 환산 도구다.
- 특정 국가의 권장량을 "정답"처럼 단정하지 마라 — 여러 국가 기준이 병존한다는 점을 항상 함께 보여준다.
- 확정된 Disclaimer 문구의 5개 요소(진단 아님/근사치/체질별 차이/임신·간질환 등 상담 필요/음주 권고 안 함) 중 하나라도 누락하거나 임의로 순화하지 마라 — 사용자가 2026-07-21 직접 확정한 문구다.
- `bac-calculator`와 로직/컴포넌트를 공유하지 마라(rule 8, 툴 격리) — `DRINK_PRESETS` 등 상수도 새로 정의하고 import하지 않는다.
- `bac-calculator`의 기존 `relatedToolIds` 배열을 이 step에서 건드리지 마라(step2에서 처리).
- `page.tsx`의 `openGraph`에 `images` 필드를 빠뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).
- 기존 테스트를 깨뜨리지 마라.
