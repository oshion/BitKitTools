# Step 5: tool-homebrew-recipe-calculator

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 작업물을 파악하라:

- `/docs/screens/beer-homebrew-recipe-calculator.md` (이 step의 1차 스펙)
- `/docs/ARCHITECTURE.md` (레이어 규칙, tools-config 스키마)
- `/docs/UI_GUIDE.md`
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/*`
- `src/hooks/useAnalyticsEvent.ts`, `src/hooks/useLocalStorage.ts` (Step 3에서 생성되었을 수 있음 — 있으면 재사용, 없으면 이 step에서 최소 구현)
- `src/app/[locale]/beer/bac-calculator/` (이전 step 산출물 — 페이지 구조 패턴 확인용, **컴포넌트는 절대 import하지 마라**, 아래 금지사항 참고)

## 작업

### 1. `lib/utils/homebrewCalculator.ts` (순수 함수)

```ts
export function calculateAbv(og: number, fg: number): number
export function calculateDilution(currentAbv: number, currentVolumeL: number, targetAbv: number): { waterToAddL: number; finalVolumeL: number }
```

`calculateAbv`는 표준 근사식 `ABV = (OG - FG) × 131.25`를 사용한다.

### 2. `components/tools/homebrew-recipe-calculator/HomebrewRecipeCalculatorTool.tsx` (Client Component)

- 배치 사이즈(L/gal), 초기 비중(OG), 최종 비중(FG) 입력 → 즉시 ABV 결과 표시
- "목표 도수로 희석하기" 섹션 토글 시 추가 입력(목표 ABV)/결과(필요한 물의 양) 노출
- 결과: ABV(%) 큰 숫자 강조, 희석 시 "물 X L 추가 시 목표 도수 도달" 문구
- 최근 입력한 레시피 값은 `useLocalStorage`로 저장해 재방문 시 자동 채움
- `useAnalyticsEvent`로 `tool_open`, `calculate`, `copy_result` 전송

### 3. `tools-config.ts`에 항목 추가

```ts
{
  id: 'homebrew-recipe-calculator',
  slug: 'homebrew-recipe-calculator',
  category: 'beer',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, 아래 참고 */ ],
  relatedToolIds: ['bac-calculator'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/homebrew-recipe-calculator.png',
  status: 'testing',
  disclaimerType: 'general',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

FAQ 방향: "OG/FG는 어떻게 측정하나요?", "근사식과 실제 도수가 다른 이유는?", "희석하면 맛도 옅어지나요?" — 실제 완성 문장으로.

### 4. 페이지 (`src/app/[locale]/beer/homebrew-recipe-calculator/page.tsx`, Server Component)

콘텐츠 순서는 `tool-json-formatter` step 공통 패턴을 그대로 따른다:

```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → HomebrewRecipeCalculatorTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(general)
→ RelatedTools(ToolCardGrid + getRelatedTools('homebrew-recipe-calculator')) → AdSlot(footer)
```

**How To Use 방향**: "1) 배치 사이즈를 입력한다 2) 초기 비중(OG)을 입력한다 3) 최종 비중(FG)을 입력한다 4) ABV 결과를 확인한다 5) 필요시 목표 도수로 희석했을 때 필요한 물의 양을 계산한다".

**Example 콘텐츠**: 일반적인 홈브루 맥주 레시피 예시(OG 1.050, FG 1.010 등) 1~2개를 실제 계산 결과와 함께 코드/표로 포함.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `calculateAbv`, `calculateDilution`의 단위 테스트가 통과하는지 확인한다.
3. `/beer/homebrew-recipe-calculator`(EN/KO)가 정상 빌드되는지 확인한다.
4. `bac-calculator`와 컴포넌트/로직을 전혀 공유하지 않는지 확인한다(import 여부 grep).
5. 결과에 따라 `phases/1-mvp-tools/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Homebrew Recipe & ABV/Dilution Calculator 툴 완성. lib/utils/homebrewCalculator.ts, components/tools/homebrew-recipe-calculator/, tools-config.ts에 항목 추가, app/[locale]/beer/homebrew-recipe-calculator/page.tsx. bac-calculator와 상호 relatedToolIds 연결 완료."`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- `components/tools/bac-calculator/`의 어떤 컴포넌트나 로직도 import/재사용하지 마라. 이유: 도수 계산이라는 표면적 유사성이 있어도 컴포넌트 격리 원칙상 두 툴은 완전히 독립적으로 유지해야 한다(`docs/screens/beer-homebrew-recipe-calculator.md` 금지사항).
- 다른 툴 폴더를 import하지 마라.
- How To Use/FAQ/Example을 다른 툴과 동일한 문구로 복붙하지 마라.
