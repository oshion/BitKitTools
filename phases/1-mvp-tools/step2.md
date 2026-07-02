# Step 2: tool-flight-delay-compensation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 작업물을 파악하라:

- `/docs/screens/travel-flight-delay-compensation.md` (이 step의 1차 스펙)
- `/docs/ARCHITECTURE.md` (레이어 규칙, tools-config 스키마, 면책조항 시스템)
- `/docs/UI_GUIDE.md`
- `/docs/ADR.md` (ADR-011: 면책조항 공통 컴포넌트)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/*`
- `src/hooks/useAnalyticsEvent.ts`
- `src/app/[locale]/developer/password-generator/` (이전 step 산출물 — 페이지 구조 패턴 확인용, 직접 import 금지)

## 작업

### 1. `lib/config/flightCompensationRules.ts` (정적 데이터, 외부 API 아님)

EU261 및 미국 DOT 기준 보상 규정을 정적 테이블로 정의한다. 거리 구간(1500km 이하 / 1500~3500km / 3500km 초과)별 보상액 범위, 지연 시간 임계값, 불가항력(기상 등) 예외 규정을 포함한다. 출처(EU261 원문, DOT 규정)를 주석으로 명시한다.

### 2. `lib/utils/flightDelayCompensation.ts` (순수 함수)

```ts
export type FlightDelayInput = {
  regulation: 'EU261' | 'US_DOT'
  distanceCategory: 'short' | 'medium' | 'long'
  delayHours: number
  reason: 'airline-fault' | 'force-majeure'
}
export function estimateCompensation(input: FlightDelayInput): {
  amountRange: { min: number; max: number }
  currency: string
  eligible: boolean
  reason: string
}
```

`flightCompensationRules.ts`를 참조해 계산한다. `reason: 'force-majeure'`인 경우 `eligible: false`에 가깝게(또는 낮은 보상 범위) 처리하고 `reason` 필드에 이유를 명시한다.

### 3. `components/tools/flight-delay-compensation/FlightDelayCompensationTool.tsx` (Client Component)

- 단계형 입력 폼: 규정 선택 → 거리 구간 선택 → 지연 시간(슬라이더) → 지연 사유 선택
- 결과: 예상 보상 범위를 큰 숫자로 표시, 바로 아래 "실제 청구 가능 여부는 항공사 확인 필요" 문구를 항상 노출
- 지연 사유가 불가항력이면 결과 카드 톤을 중립/경고로 전환 — **"보상 지급 확정" 같은 단정적 표시나 초록색 "확정" 배지를 사용하지 않는다**
- `useAnalyticsEvent`로 `tool_open`, `calculate`, `share` 전송

### 4. `tools-config.ts`에 항목 추가

```ts
{
  id: 'flight-delay-compensation',
  slug: 'flight-delay-compensation',
  category: 'travel',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, 아래 참고 */ ],
  relatedToolIds: ['visa-requirement-checker'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/flight-delay-compensation.png',
  status: 'testing',
  disclaimerType: 'legal',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

FAQ 방향: "EU261이 적용되는 조건은?", "지연 사유가 기상이면 보상받을 수 없나요?", "미국 항공편은 어떤 규정이 적용되나요?" — 실제 완성 문장으로 작성.

### 5. 페이지 (`src/app/[locale]/travel/flight-delay-compensation/page.tsx`, Server Component)

`generateMetadata`로 SEO 메타데이터 생성. 콘텐츠 순서는 `tool-json-formatter` step에서 정한 공통 패턴을 그대로 따른다:

```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → FlightDelayCompensationTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(legal)
→ RelatedTools(ToolCardGrid + getRelatedTools('flight-delay-compensation')) → AdSlot(footer)
```

`DisclaimerBanner disclaimerType="legal"` 문구는 messages 파일의 `disclaimer.legal`을 사용하되, 이 화면에서는 그 위/아래에 "실제 보상 여부는 항공사 및 관할 규정을 반드시 확인하시기 바랍니다" 취지가 전달되는지 확인한다(`docs/screens/travel-flight-delay-compensation.md` 참고).

**How To Use 방향**: "1) 적용받을 규정(EU261/미국 DOT)을 선택한다 2) 비행 거리 구간을 선택한다 3) 지연 시간을 입력한다 4) 지연 사유를 선택한다 5) 예상 보상 범위를 확인한다" — 실제 문장으로.

**Example 콘텐츠**: EU261 실제 사례 기반 예시 1~2개(예: "3200km 노선에서 4시간 지연, 항공사 귀책 시 예상 보상 범위") 포함.

**규정 출처**: `flightCompensationRules.ts`의 출처(EU261 원문, DOT 규정)를 이 화면 본문에도 명시한다(Description 또는 How To Use 하단).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `estimateCompensation`의 단위 테스트(불가항력 케이스, 항공사 귀책 케이스 각각)가 통과하는지 확인한다.
3. `/travel/flight-delay-compensation`(EN/KO)이 정상 빌드되는지 확인한다.
4. 결과 화면에 "지급 확정" 등 단정적 표현이나 초록색 확정 배지가 없는지 코드 리뷰로 확인한다.
5. 결과에 따라 `phases/1-mvp-tools/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Flight Delay Compensation Calculator 툴 완성. lib/config/flightCompensationRules.ts, lib/utils/flightDelayCompensation.ts, components/tools/flight-delay-compensation/, tools-config.ts에 항목 추가(disclaimerType: legal), app/[locale]/travel/flight-delay-compensation/page.tsx."`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- "보상 지급 확정" 같은 단정적 문구나 승인을 암시하는 색상/아이콘을 사용하지 마라. 이유: 실제 지급 여부는 항공사/기관 판단 사항이며 법적 리스크가 있다(`docs/screens/travel-flight-delay-compensation.md` 금지사항).
- 규정 데이터를 실시간 API처럼 보이게 표현하지 마라 — 정적 테이블 기반임을 사용자가 인지할 수 있어야 한다.
- 다른 툴 폴더를 import하지 마라 — 컴포넌트 격리 원칙.
