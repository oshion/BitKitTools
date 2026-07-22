# Step 0: tool-hydrometer-temperature-correction

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 기존 beer 툴의 코드 패턴을 파악하라:

- `/docs/screens/beer-hydrometer-temperature-correction.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. 보정 공식, 출처 표기 원칙, opt-in 저장, 금지사항이 전부 이 문서에 있다)
- `/docs/ARCHITECTURE.md`, `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 9 configuration-driven 툴 관리, 규칙 11 면책조항, 규칙 15 SEO 메타데이터 자동 생성)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts` (특히 파일 하단 `homebrew-recipe-calculator` 항목 — 구조 참고용, 아직 수정하지 마라. 이 항목 수정은 이후 step에서 진행한다)
- `src/lib/utils/homebrewCalculator.ts`, `src/lib/utils/homebrewCalculator.test.ts` — 순수 함수 + 테스트 작성 패턴 참고
- `src/components/tools/homebrew-recipe-calculator/HomebrewRecipeCalculatorTool.tsx` — Client Component 패턴 참고(하드코딩 영어 UI 라벨, `useReducer`/`useState`, `useAnalyticsEvent`, `useLocalStorage` opt-in 패턴, `animate-fade-in`, `text-4xl`/`text-5xl` 결과 강조, `tabular-nums`)
- `src/hooks/useLocalStorage.ts`, `src/hooks/useAnalyticsEvent.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/SchemaWebApplication.tsx`, `SchemaFaqPage.tsx`, `SchemaBreadcrumb.tsx`
- `src/app/[locale]/beer/bac-calculator/page.tsx` — Server Component 페이지 패턴을 그대로 재사용하라(`generateMetadata`의 `openGraph.images` 필드 포함, `isKo` 삼항으로 본문 한/영 분기, `getToolBySlug`/`getRelatedTools` 사용, 콘텐츠 섹션 순서)

## 작업

### 1. `lib/utils/hydrometerCorrection.ts` (순수 함수, TDD)

**먼저 테스트를 작성한 뒤 구현하라(CLAUDE.md rule 5).**

```ts
export function fahrenheitFromCelsius(celsius: number): number
export function celsiusFromFahrenheit(fahrenheit: number): number

export function correctGravity(input: {
  measuredGravity: number
  sampleTempF: number
  calibrationTempF: number
}): { correctedGravity: number; deltaFromMeasured: number }
```

- 보정 공식: `CG = MG × f(ST) / f(CT)`
- `f(T) = 1.00130346 − 0.000134722124·T + 0.00000204052596·T² − 0.00000000232820948·T³` (T는 화씨 °F 기준)
- `deltaFromMeasured = correctedGravity − measuredGravity`
- `correctedGravity`는 소수점 4자리로 반올림한다(비중계 표준 정밀도).
- `lib/utils/hydrometerCorrection.test.ts`: 시료온도=기준온도(보정 없음, delta≈0), 시료온도>기준온도(보정값이 측정값보다 커짐), 시료온도<기준온도(보정값이 측정값보다 작아짐), 59°F/68°F 두 기준온도 프리셋 조합, °C↔°F 변환 왕복 정확도를 포함해 최소 12개 이상의 테스트를 작성한다.

### 2. `components/tools/hydrometer-temperature-correction/HydrometerCorrectionTool.tsx` (Client Component)

screens 문서의 아래 항목을 전부 구현해야 한다:

- 입력: 측정된 비중(숫자 입력, 예: 1.052) → 시료 온도 → 기준온도(**59°F(15°C) / 68°F(20°C) 프리셋 버튼 2개 + 직접 입력** 모두 지원) → 단위 토글(°F/°C, 두 온도 입력 필드 모두에 공통 적용, 토글 시 이미 입력된 값을 서로 변환해서 유지)
- 결과: 보정된 비중(CG)을 카드의 유일한 큰 초점(`text-5xl font-bold text-[#f59e0b] tabular-nums`), 그 아래 작은 텍스트로 "측정값 대비 {deltaFromMeasured} 차이" 표시(부호 포함, 예: "+0.0012" 또는 "-0.0008")
- 인위적 로딩 지연 없음 — 입력 즉시 계산(다른 beer 툴과 동일, height-predictor의 카운트업 연출은 baby 카테고리 전용이므로 이 툴에는 적용하지 않는다)
- 기준온도 선택(°F 값)만 `useLocalStorage`로 opt-in 저장(체크박스, 기본값 off). 키는 `hydrometer-temperature-correction:calibration-temp`처럼 이 툴 전용 네임스페이스를 쓴다.
- `useAnalyticsEvent`로 `tool_open`, `calculate` 전송.
- 공식 출처 문구를 결과 카드 하단에 명시: "브루잉 업계에서 널리 통용되는 표준 보정식입니다" 수준으로 정직하게 서술하고, 존재하지 않는 정밀 학술 논문을 인용하지 마라(screens 문서 "경쟁사 리서치 요약" 참고).

### 3. `tools-config.ts`에 항목 추가

```ts
{
  id: 'hydrometer-temperature-correction',
  slug: 'hydrometer-temperature-correction',
  category: 'beer',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: {
    en: ['hydrometer temperature correction calculator', 'hydrometer calculator', 'specific gravity correction', 'gravity correction calculator', 'og calculator', ...],
    ko: [...],
  },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, screens 문서 "tools-config 항목" 참고 */ ],
  relatedToolIds: ['homebrew-recipe-calculator'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/default-en.png',
  status: 'testing',
  disclaimerType: 'general',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

`homebrew-recipe-calculator`의 `relatedToolIds`는 이 step에서 건드리지 마라 — step3(homebrew-recipe-calculator-enhancements)에서 상호 링크를 추가한다. 지금은 이 새 항목의 `relatedToolIds`에만 `'homebrew-recipe-calculator'`를 넣어둔다(`getRelatedTools`는 `Array.find` 기반이라 상대편이 아직 링크를 안 걸어도 에러 없이 동작한다).

### 4. 페이지 (`src/app/[locale]/beer/hydrometer-temperature-correction/page.tsx`, Server Component)

`bac-calculator/page.tsx` 패턴을 그대로 따른다. `generateMetadata`의 `openGraph`에 반드시 `images: [{ url: \`${SITE_URL}/og/default-${safeLocale}.png\`, width: 1200, height: 630 }]`를 포함하라.

콘텐츠 순서:
```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → HydrometerCorrectionTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(general)
→ RelatedTools(ToolCardGrid + getRelatedTools('hydrometer-temperature-correction')) → AdSlot(footer)
```

**Example 콘텐츠**: screens 문서의 예시("측정값 1.052, 시료온도 75°F, 기준온도 60°F → 보정값 약 1.053")를 계산 과정과 함께 포함한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `correctGravity`의 단위 테스트(시료온도=기준온도, 초과/미만, 59°F/68°F 프리셋, °C↔°F 왕복)가 통과하는지 확인한다.
3. `/beer/hydrometer-temperature-correction`(EN/KO)이 정상 빌드되는지 확인하고, 빌드 결과물에서 `<meta property="og:image">`가 `/og/default-{en,ko}.png`를 가리키는지 확인한다.
4. 결과 화면이나 FAQ 어디에도 존재하지 않는 정밀 학술 논문 인용이 없는지 확인한다("브루잉 업계 표준 공식"처럼 정직한 서술인지).
5. 기준온도 저장이 기본값 off(opt-in)인지, 저장 키가 이 툴 전용 네임스페이스를 쓰는지 확인한다.
6. Brix/Plato 단위 관련 UI가 추가되지 않았는지 확인한다(이번 범위 아님).
7. 결과에 따라 `phases/4-beer-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(생성/수정 파일 목록, disclaimerType, 핵심 결정)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 존재하지 않는 정밀 학술 논문을 출처로 지어내지 마라 — "브루잉 업계 표준 공식"이라고 정직하게 서술한다.
- `homebrew-recipe-calculator`와 로직/컴포넌트를 공유하지 마라(rule 8, 툴 격리) — 데이터/링크는 `relatedToolIds`로만 연결한다.
- `homebrew-recipe-calculator`의 기존 `relatedToolIds` 배열을 이 step에서 건드리지 마라(step3에서 처리).
- Brix/Plato 단위 지원을 이번 범위에 포함하지 마라(SG만 지원).
- `page.tsx`의 `openGraph`에 `images` 필드를 빠뜨리지 마라.
- 인위적 계산 지연(로딩 애니메이션)을 넣지 마라 — 이 툴은 즉시 계산 패턴을 따른다.
- 다른 툴 폴더를 import하지 마라(rule 8).
- 기존 테스트를 깨뜨리지 마라.
