# Step 6: tool-baby-growth-percentile

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 작업물을 파악하라:

- `/docs/screens/baby-growth-percentile.md` (이 step의 1차 스펙)
- `/docs/ARCHITECTURE.md` (레이어 규칙, tools-config 스키마, 면책조항 시스템)
- `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 12: YMYL 콘텐츠 신중 처리)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/*`
- `src/hooks/useAnalyticsEvent.ts`, `src/hooks/useLocalStorage.ts`
- `src/app/[locale]/beer/homebrew-recipe-calculator/` (이전 step 산출물 — 페이지 구조 패턴 확인용)

## 작업

### 1. `lib/config/growthStandards.ts` (정적 데이터, 외부 API 아님)

WHO Child Growth Standards / CDC Growth Charts의 LMS 파라미터(또는 백분위 룩업 테이블)를 정적 데이터로 정의한다. 성별(남/여) × 연령(개월, 0~60) × 체중/키 기준 백분위 산출에 필요한 값을 포함한다. **출처(WHO/CDC 공식 자료명, 발행 연도)를 주석으로 명시**한다 — 임의 추정치를 사용하지 않는다.

### 2. `lib/utils/growthPercentile.ts` (순수 함수)

```ts
export type GrowthInput = { gender: 'male' | 'female'; ageMonths: number; weightKg: number; heightCm: number }
export function calculatePercentile(input: GrowthInput, standard: 'WHO' | 'CDC'): { weightPercentile: number; heightPercentile: number }
```

LMS 방법(또는 `growthStandards.ts`에 정의한 방식)으로 z-score를 구하고 백분위로 변환한다.

### 3. `components/tools/growth-percentile/GrowthPercentileTool.tsx` (Client Component)

- 성별, 나이(개월), 체중, 키 입력 + 기준표 선택(WHO/CDC, 기본값은 locale 기준 — `ko`면 WHO, `en`이면 CDC 또는 WHO 중 팀 판단, 스펙에 명시된 "지역에 따라 권장 기준이 다름"을 반영)
- 결과: 체중/키 백분위를 각각 게이지 바로 시각화 + 숫자
- 결과 카드 바로 아래 "이 결과는 참고용이며 실제 성장 평가는 소아과 전문의와 상담 필요" 문구 **항상** 노출
- 기준 출처(WHO Child Growth Standards / CDC Growth Charts) 본문에 명시
- 최근 입력한 아기 정보(나이/체중/키)는 `useLocalStorage`로 저장 가능하되, **저장 여부를 사용자에게 명시적으로 안내하는 옵트인 UI**(예: "이 정보를 브라우저에 저장할까요?" 체크박스)를 포함한다 — 민감한 아동 건강 정보이므로 기본값은 저장 안 함(opt-in)으로 한다.
- `useAnalyticsEvent`로 `tool_open`, `calculate` 전송 — 나이/체중/키 등 개인 식별 가능한 입력값은 이벤트 payload에 포함하지 않는다.

### 4. `tools-config.ts`에 항목 추가

```ts
{
  id: 'growth-percentile',
  slug: 'growth-percentile',
  category: 'baby',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, 아래 참고 */ ],
  relatedToolIds: ['sleep-schedule'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/growth-percentile.png',
  status: 'testing',
  disclaimerType: 'medical',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

FAQ에는 반드시 "백분위가 낮으면 문제가 있는 건가요?"를 포함하고, 답변은 "아니오"로 시작해 전문의 상담을 권하는 방향으로 작성한다. "WHO 기준과 CDC 기준의 차이는?" 등 1~2개 추가.

### 5. 페이지 (`src/app/[locale]/baby/growth-percentile/page.tsx`, Server Component)

콘텐츠 순서는 `tool-json-formatter` step 공통 패턴을 그대로 따른다:

```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → GrowthPercentileTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(medical)
→ RelatedTools(ToolCardGrid + getRelatedTools('growth-percentile')) → AdSlot(footer)
```

**How To Use 방향**: "1) 아기의 성별을 선택한다 2) 나이(개월)를 입력한다 3) 체중과 키를 입력한다 4) 기준표(WHO/CDC)를 선택한다 5) 백분위 결과를 확인한다".

**Example 콘텐츠**: 가상의 예시(예: "생후 6개월, 체중 7.5kg → 약 XX백분위") 1개를 결과 해석 방법과 함께 포함.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `calculatePercentile`의 단위 테스트(WHO/CDC 각각, 여러 연령대)가 통과하는지 확인한다.
3. `/baby/growth-percentile`(EN/KO)이 정상 빌드되는지 확인한다.
4. "정상"/"비정상" 등 진단성 단정 표현이 코드/콘텐츠에 없는지 확인한다(grep).
5. LocalStorage 저장이 기본값 off(opt-in)인지 확인한다.
6. 결과에 따라 `phases/1-mvp-tools/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Baby Growth Percentile Calculator 툴 완성. lib/config/growthStandards.ts(WHO/CDC 출처), lib/utils/growthPercentile.ts, components/tools/growth-percentile/, tools-config.ts에 항목 추가(disclaimerType: medical), app/[locale]/baby/growth-percentile/page.tsx. LocalStorage 저장은 opt-in."`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- 백분위 낮음/높음에 대해 "정상"·"비정상" 같은 진단성 단정 표현을 사용하지 마라 — 항상 "전문의 상담" 방향으로 안내한다.
- 출처 없이 임의의 성장 기준 데이터를 사용하지 마라 — 반드시 WHO/CDC 공식 기준표 기반이어야 한다.
- 아기의 개인 정보(나이/체중/키)를 사용자 동의 없이 LocalStorage에 자동 저장하지 마라 — opt-in 방식이어야 한다.
- 다른 툴 폴더를 import하지 마라.
