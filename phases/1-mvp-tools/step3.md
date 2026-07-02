# Step 3: tool-visa-requirement-checker

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 작업물을 파악하라:

- `/docs/screens/travel-visa-requirement-checker.md` (이 step의 1차 스펙)
- `/docs/ARCHITECTURE.md` (레이어 규칙, tools-config 스키마, 면책조항 시스템)
- `/docs/UI_GUIDE.md`
- `/BitKitTools-project-profile-v2.md` (Section 7-2: 여행 카테고리 제휴 검토 — 이 step 범위는 아니지만 맥락 파악용)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/*`
- `src/hooks/useAnalyticsEvent.ts`
- `src/app/[locale]/travel/flight-delay-compensation/` (이전 step 산출물 — 페이지 구조 패턴 확인용, 직접 import 금지)

## 작업

### 1. `lib/config/visaRequirements.ts` (정적 데이터, 외부 API 아님)

주요 출발국-목적지국 조합별 비자 요건(무비자/e-Visa/사전 비자 필요/최대 체류일수)을 정적 테이블로 정의한다. 데이터가 실시간 정부 API가 아니라 정적 스냅샷임을 나타내는 주석(최종 업데이트 날짜 등)을 포함한다.

### 2. `lib/utils/visaRequirementChecker.ts` (순수 함수)

```ts
export function checkVisaRequirement(fromCountry: string, toCountry: string): {
  requirementType: 'visa-free' | 'e-visa' | 'visa-required' | 'unknown'
  maxStayDays?: number
  note: string
}
```

데이터에 없는 국가 조합이면 `requirementType: 'unknown'`과 함께 "관할 영사관 확인 필요" 안내를 `note`에 담는다(에러 throw 금지).

### 3. `components/tools/visa-requirement-checker/VisaRequirementCheckerTool.tsx` (Client Component)

- 출발국/목적지국 선택(검색 가능한 드롭다운), 체류 목적·예정 체류일수(선택 입력)
- 결과 카드: 비자 요건 유형 배지(중립 색상 — "승인 보장" 암시 금지) + 최대 체류일수 + 안내 문구
- 하단에 "최신 비자 규정은 관할 영사관에서 재확인" 문구 상시 노출
- 여행자보험 추천 섹션: 일반적인 보장 항목 안내(특정 상품 판매/제휴 링크는 포함하지 않는다 — 범위 밖)
- **체류시간 인터랙션 보강**: 국가 선택 즉시 결과 카드가 `fade-in`(0.4s)으로 나타나게 하고, 결과 카드에 최대 체류일수를 진행도 바(예: 90일 중 얼마나 채워지는지 시각화)로 함께 보여준다. 이 툴은 정적 검토에서 드롭다운 위주라 인터랙션이 약하다고 판단되었으므로 반드시 포함한다.
- 최근 조회한 국가 조합은 `useLocalStorage` 훅(신규 생성 필요 시 `hooks/useLocalStorage.ts`에 구현, 이미 있으면 재사용)으로 저장해 재방문 시 자동 채움
- `useAnalyticsEvent`로 `tool_open`, `calculate` 전송

### 4. `tools-config.ts`에 항목 추가

```ts
{
  id: 'visa-requirement-checker',
  slug: 'visa-requirement-checker',
  category: 'travel',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, 아래 참고 */ ],
  relatedToolIds: ['flight-delay-compensation'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/visa-requirement-checker.png',
  status: 'testing',
  disclaimerType: 'legal',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

FAQ 방향: "e-Visa와 무비자의 차이는?", "비자 요건은 얼마나 자주 바뀌나요?", "여행자보험은 꼭 가입해야 하나요?" — 실제 완성 문장으로 작성.

### 5. 페이지 (`src/app/[locale]/travel/visa-requirement-checker/page.tsx`, Server Component)

콘텐츠 순서는 `tool-json-formatter` step 공통 패턴을 그대로 따른다:

```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → VisaRequirementCheckerTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(legal)
→ RelatedTools(ToolCardGrid + getRelatedTools('visa-requirement-checker')) → AdSlot(footer)
```

**How To Use 방향**: "1) 여권 발급국(출발국)을 선택한다 2) 목적지 국가를 선택한다 3) 필요시 체류 목적과 예정 일수를 입력한다 4) 비자 요건과 추천 보험 유형을 확인한다".

**Example 콘텐츠**: 실제 자주 검색되는 국가 조합 예시(예: "한국 → 미국", "한국 → 일본") 2~3개를 정적 텍스트로 포함.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `checkVisaRequirement`가 데이터에 없는 조합에 대해 에러 없이 `'unknown'`을 반환하는지 테스트로 확인한다.
3. `/travel/visa-requirement-checker`(EN/KO)가 정상 빌드되는지 확인한다.
4. "무비자 = 입국 보장"처럼 읽힐 수 있는 단정적 표현이 없는지 코드 리뷰로 확인한다.
5. 결과에 따라 `phases/1-mvp-tools/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Visa Requirement / Travel Insurance Checker 툴 완성. lib/config/visaRequirements.ts, lib/utils/visaRequirementChecker.ts, components/tools/visa-requirement-checker/, tools-config.ts에 항목 추가, app/[locale]/travel/visa-requirement-checker/page.tsx. flight-delay-compensation과 상호 relatedToolIds 연결 완료."`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- 비자 요건 데이터를 실시간 정부 API처럼 보이게 표현하지 마라. 이유: 실제로는 정적 테이블이며 최신성 한계를 사용자가 인지해야 법적 리스크가 줄어든다.
- "무비자 = 입국 보장"처럼 단정하지 마라 — 입국 심사는 최종적으로 목적지국 재량이다.
- 특정 여행자보험 상품의 판매/제휴 링크를 이 step에서 추가하지 마라. 이유: `BitKitTools-project-profile-v2.md` Section 7-2는 "검토 사항"이며 별도 논의가 필요한 범위다.
- 다른 툴 폴더를 import하지 마라.
