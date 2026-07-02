# Step 1: tool-password-generator

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 작업물을 파악하라:

- `/docs/screens/developer-password-generator.md` (이 step의 1차 스펙)
- `/docs/ARCHITECTURE.md` (레이어 규칙, tools-config 스키마)
- `/docs/UI_GUIDE.md`
- `src/types/tool.ts`, `src/lib/config/tools-config.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/*`
- `src/hooks/useAnalyticsEvent.ts`
- `src/app/[locale]/developer/json-formatter/` 전체 (이전 step 산출물 — 페이지 구조·콘텐츠 순서 패턴을 그대로 따르되, 컴포넌트를 직접 import하지는 마라)

`0-foundation`과 이전 tool step에서 만들어진 공통 컴포넌트를 재사용하라. 새로 만들지 마라.

## 작업

### 1. `lib/utils/passwordGenerator.ts` (순수 함수, `lib/api` import 금지)

```ts
export type PasswordOptions = {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeAmbiguous: boolean
}
export function generatePassword(options: PasswordOptions): string
export function estimatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong'
```

`generatePassword`는 **반드시 `crypto.getRandomValues` 기반 CSPRNG를 사용한다.** `Math.random()` 사용 절대 금지 — 예측 가능한 비밀번호는 보안 취약점이다.

### 2. `components/tools/password-generator/PasswordGeneratorTool.tsx` (Client Component)

- 길이 슬라이더(8~64, 기본 16), 문자 조합 체크박스 4개, "유사 문자 제외" 옵션
- 생성된 비밀번호를 큰 모노스페이스 텍스트로 표시 + 복사 버튼
- 강도 게이지를 진행도 바 애니메이션으로 표시 (`docs/UI_GUIDE.md` 애니메이션 규칙)
- 옵션 변경 시 즉시 재생성
- `useAnalyticsEvent`로 `tool_open`, `calculate`(재생성 시), `copy_result` 전송 — **생성된 비밀번호 값 자체는 이벤트 payload에 절대 포함하지 않는다**
- 비밀번호 값은 LocalStorage/analytics 어디에도 저장하지 않는다

### 3. `tools-config.ts`에 항목 추가

```ts
{
  id: 'password-generator',
  slug: 'password-generator',
  category: 'developer',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, 아래 참고 */ ],
  relatedToolIds: ['json-formatter'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/password-generator.png',
  status: 'testing',
  disclaimerType: 'general',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

FAQ 방향(실제 완성 문장으로 직접 작성): "생성된 비밀번호는 서버에 저장되나요? (아니오, 브라우저에서만 생성되며 어디에도 전송되지 않습니다)", "안전한 비밀번호 길이는 얼마인가요?", "유사 문자 제외 옵션은 언제 쓰나요?".

### 4. 페이지 (`src/app/[locale]/developer/password-generator/page.tsx`, Server Component)

`generateMetadata`로 SEO 메타데이터 생성. **콘텐츠 순서는 `tool-json-formatter` step에서 정한 공통 패턴을 그대로 따른다**:

```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → PasswordGeneratorTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(general)
→ RelatedTools(ToolCardGrid + getRelatedTools('password-generator')) → AdSlot(footer)
```

**How To Use 방향**: "1) 원하는 비밀번호 길이를 슬라이더로 조정한다 2) 포함할 문자 조합(대/소문자, 숫자, 특수문자)을 선택한다 3) 필요시 유사 문자 제외를 켠다 4) 생성된 비밀번호를 복사한다" — 실제 문장으로 작성.

**Example 콘텐츠**: 길이별(8자/16자/32자) 강도 차이를 표로 보여주는 정적 콘텐츠 포함(SEO/체류시간 목적).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `generatePassword`가 `crypto.getRandomValues`를 사용하는지 코드로 확인한다(`Math.random` 미사용).
3. `/developer/password-generator`(EN/KO)가 정상 빌드되는지 확인한다.
4. 5개 `AdSlot`, `DisclaimerBanner`, `RelatedTools` 섹션이 렌더링되는지 확인한다.
5. `json-formatter`의 `relatedToolIds`에 있던 `password-generator`가 이제 실제로 연결되어 `json-formatter` 페이지의 Related Tools에도 이 툴이 나타나는지 확인한다.
6. 결과에 따라 `phases/1-mvp-tools/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Password Generator 툴 완성. lib/utils/passwordGenerator.ts(crypto.getRandomValues 사용), components/tools/password-generator/, tools-config.ts에 항목 추가(id: password-generator), app/[locale]/developer/password-generator/page.tsx."`
   - 실패/blocked 처리는 이전 step과 동일한 기준을 따른다.

## 금지사항

- `Math.random()`으로 비밀번호를 생성하지 마라. 이유: 예측 가능성으로 인한 보안 취약점 — 반드시 `crypto.getRandomValues` 사용.
- 생성된 비밀번호 값을 로깅, analytics payload, LocalStorage 등 어떤 형태로도 저장/전송하지 마라.
- `components/tools/json-formatter/` 등 다른 툴 폴더를 import하지 마라 — 컴포넌트 격리 원칙.
- How To Use/FAQ/Example을 `json-formatter`와 동일한 문구로 복붙하지 마라.
