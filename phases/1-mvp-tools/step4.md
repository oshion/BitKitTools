# Step 4: tool-bac-calculator

## ⚠️ 이 step은 다른 툴 step과 다르다 — 법적/안전 리스크 최우선

BAC(혈중알코올농도) Calculator는 음주운전 판단 근거로 오인될 수 있는 YMYL 툴이다. 아래 안전장치는 **선택이 아니라 필수**이며, 표준 `DisclaimerBanner` 컴포넌트만으로는 부족하다. 이 규칙을 생략하거나 완화하면 이 step은 실패로 간주한다.

## 읽어야 할 파일

먼저 아래 파일들을 반드시 전부 읽어라:

- `/docs/screens/beer-bac-calculator.md` (이 step의 1차 스펙 — 특히 "⚠️ 법적 리스크" 및 "UI 구성 (필수 안전장치)" 섹션)
- `/docs/ADR.md` ADR-014 (BAC 전용 안전장치를 config로 끌 수 없게 하드코딩하는 이유)
- `/BitKitTools-project-profile-v2.md` Section 13-5 (BAC Calculator 강화된 안전장치 UX 규칙 원문)
- `/docs/ARCHITECTURE.md` (면책조항 시스템 섹션 — 이 툴이 왜 예외인지)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/*`
- `src/hooks/useAnalyticsEvent.ts`
- `src/app/[locale]/travel/visa-requirement-checker/` (이전 step 산출물 — 페이지 구조 패턴 확인용)

## 작업

### 1. `lib/utils/bacCalculator.ts` (순수 함수)

```ts
export type BacInput = {
  gender: 'male' | 'female'
  weightKg: number
  drinks: Array<{ abvPercent: number; volumeMl: number }>
  hoursElapsed: number
}
export function calculateBac(input: BacInput): { bacPercent: number; isEstimateOnly: true }
```

Widmark 공식(`BAC = 알코올 섭취량(g) / (체중(g) × r) - 분해율 × 경과시간`, r은 성별별 계수)을 사용한다. **반환 타입에 `isEstimateOnly: true`를 리터럴 타입으로 고정하라** — 이는 실수로 이 값을 지워 컴포넌트가 단정적 UI를 그리게 되는 것을 타입 레벨에서 막기 위한 의도적 설계다. 이 필드를 optional로 바꾸거나 제거하지 마라.

### 2. `components/tools/bac-calculator/BacCalculatorTool.tsx` (Client Component)

입력: 성별, 체중(kg/lb 전환), 음주 항목 추가(술 종류 프리셋 선택 시 ABV 자동 채움 + 용량 mL), 경과 시간.

**아래 5가지 UI 규칙은 전부 필수이며 하나라도 빠지면 이 step은 미완료로 간주한다:**

1. **상시 노출 경고 배너** — 페이지 최상단 고정 또는 결과 바로 위에 다음 문구를 **닫기 버튼 없이** 표시한다: "이 결과는 운전 가능 여부를 판단하는 근거로 사용할 수 없습니다. 음주 후에는 절대 운전하지 마세요." 이 배너는 별도 컴포넌트(`BacSafetyWarning.tsx`, 이 폴더 내부)로 구현하고 `components/ui/DisclaimerBanner.tsx`를 사용하지 않는다(그 컴포넌트는 표준 문구용이며 이 안전장치는 config로 끌 수 없이 항상 렌더링되어야 하기 때문).
2. 결과는 **숫자(%)만 중립적으로 표시**한다. 배경색·아이콘으로 "안전"·"위험"·"운전 가능" 등급을 암시하지 않는다. **초록색, 체크 아이콘, 신호등 UI를 이 컴포넌트 어디에도 사용하지 마라.**
3. 계산된 BAC 수치와 무관하게 경고 배너 문구는 항상 동일하게 노출한다 — 수치가 낮다고 경고를 약화하거나 숨기지 않는다. 조건부 렌더링(`{bac < threshold && ...}`) 같은 패턴으로 경고를 표시/숨김 처리하지 마라.
4. 표준 `<DisclaimerBanner disclaimerType="medical" />`도 함께 렌더링한다(1번의 전용 경고 배너와는 별개, 추가로). 이 컴포넌트가 로드하는 `disclaimer.medical` 메시지 옆에 계산식 출처(Widmark formula)를 본문에 명시한다.
5. 위 1~4는 `tools-config.ts`의 `disclaimerType` 값이나 다른 어떤 config 값과도 무관하게 이 컴포넌트에 고정 렌더링한다 — props로 끌 수 있게 만들지 마라.

`useAnalyticsEvent`로 `tool_open`, `calculate` 전송 — 성별/체중/음주량 등 개인 식별 가능한 입력값은 이벤트 payload에 포함하지 않는다. 입력값은 LocalStorage에 저장하지 않는다.

### 3. `tools-config.ts`에 항목 추가

```ts
{
  id: 'bac-calculator',
  slug: 'bac-calculator',
  category: 'beer',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, 아래 참고 */ ],
  relatedToolIds: ['homebrew-recipe-calculator'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/bac-calculator.png',
  status: 'testing',
  disclaimerType: 'medical',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

FAQ에는 **반드시** 아래 질문을 포함한다(그대로 사용하거나 자연스럽게 다듬어서): "BAC 계산기로 운전해도 되는지 알 수 있나요?" — 답변은 "아니오, 알 수 없습니다"로 시작해 이유(개인차, 측정 오차, 법적 기준의 복잡성)를 설명한다. 그 외 "Widmark 공식이란?" 등 1~2개 추가.

### 4. 페이지 (`src/app/[locale]/beer/bac-calculator/page.tsx`, Server Component)

콘텐츠 순서는 `tool-json-formatter` step 공통 패턴을 따르되, 안전 배너가 최우선으로 배치되어야 한다:

```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ BacSafetyWarning (닫기 불가, 최상단 고정 또는 Tool 바로 위)
→ AdSlot(header) → BacCalculatorTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(medical)
→ RelatedTools(ToolCardGrid + getRelatedTools('bac-calculator')) → AdSlot(footer)
```

**How To Use 방향**: "1) 성별과 체중을 입력한다 2) 마신 술의 종류와 양을 추가한다 3) 마시기 시작한 후 경과 시간을 입력한다 4) 예상 BAC 수치를 확인한다 — 단, 이 수치로 운전 가능 여부를 판단하지 않는다"를 실제 문장으로.

**Example 콘텐츠**: 계산 예시 1개(가상의 체중/음주량/경과시간 조합) + 결과 해석 시 반드시 전문가 상담·안전 원칙을 함께 안내하는 문단.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차 (일반 절차 + 안전장치 전용 검증)

1. 위 AC 커맨드를 실행한다.
2. `calculateBac`의 단위 테스트가 통과하고, 반환 타입에 `isEstimateOnly: true`가 실제로 포함되는지 확인한다.
3. **안전장치 체크리스트(전부 통과해야 완료 처리 가능)**:
   - [ ] 경고 배너에 닫기/숨기기 버튼이 없다
   - [ ] "안전", "운전 가능", "OK" 등 통과를 암시하는 텍스트가 코드 어디에도 없다 (grep으로 확인)
   - [ ] 초록색(`green-`, `#22c55e` 등) 클래스나 체크 아이콘이 이 컴포넌트에 없다 (grep으로 확인)
   - [ ] 경고 배너 렌더링이 BAC 수치에 따른 조건문 안에 있지 않다 — 항상 렌더링되는지 코드로 확인
   - [ ] `tools-config.ts`의 `disclaimerType`을 다른 값으로 바꿔도 안전 배너가 계속 보이는지(하드코딩 여부) 확인
4. `/beer/bac-calculator`(EN/KO)가 정상 빌드되는지 확인한다.
5. 결과에 따라 `phases/1-mvp-tools/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "BAC Calculator 툴 완성 (ADR-014 강화 안전장치 전부 적용: 상시 경고 배너 BacSafetyWarning, 중립적 수치 표시, 통과 암시 표현/색상 없음). lib/utils/bacCalculator.ts, components/tools/bac-calculator/, tools-config.ts에 항목 추가(disclaimerType: medical), app/[locale]/beer/bac-calculator/page.tsx."`
   - 위 안전장치 체크리스트를 하나라도 통과하지 못하면 절대 `completed`로 표시하지 마라 — 수정 후 재검증하거나, 3회 시도 후에도 해결 못하면 `"status": "error"`로 표시하고 구체적으로 어떤 체크리스트 항목이 실패했는지 `error_message`에 남겨라.

## 금지사항

- "운전 가능", "안전", "OK" 등 통과/합격을 암시하는 어떤 표현·색상(특히 초록색)·아이콘(체크마크, 신호등)도 사용하지 마라.
- 경고 배너를 닫거나 숨기는 UI(X 버튼, "다시 보지 않기" 등)를 제공하지 마라.
- 계산 결과값(BAC 수치)에 따라 경고 문구의 강도를 조절하거나 조건부로 숨기지 마라 — 항상 동일하게 노출한다.
- 안전 배너(`BacSafetyWarning`)를 `tools-config.ts`의 필드로 켜고 끌 수 있게 만들지 마라 — 컴포넌트에 고정한다(ADR-014).
- `isEstimateOnly` 필드를 optional로 바꾸거나 반환 타입에서 제거하지 마라.
- 다른 툴 폴더를 import하지 마라.
