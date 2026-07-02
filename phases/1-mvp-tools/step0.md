# Step 0: tool-json-formatter

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 이전 task(`0-foundation`)에서 만들어진 공통 컴포넌트/유틸을 파악하라:

- `/docs/screens/developer-json-formatter.md` (이 step의 1차 스펙)
- `/docs/ARCHITECTURE.md` (레이어 규칙, tools-config 스키마, SEO/Schema.org)
- `/docs/UI_GUIDE.md`
- `src/types/tool.ts`, `src/lib/config/tools-config.ts` (헬퍼 함수 시그니처 확인)
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCard.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/SchemaWebApplication.tsx`, `SchemaFaqPage.tsx`, `SchemaBreadcrumb.tsx`
- `src/hooks/useAnalyticsEvent.ts`
- `src/app/[locale]/page.tsx` (홈이 이 카테고리/툴을 어떻게 렌더링하는지 확인)

`0-foundation`에서 만들어진 컴포넌트를 재사용하라 — 새로 만들지 마라.

## 작업

### 1. `lib/utils/jsonFormatter.ts` (순수 함수, `lib/api` import 금지)

```ts
export function formatJson(input: string, indent: 2 | 4): { success: true; output: string } | { success: false; error: string; line?: number }
export function minifyJson(input: string): { success: true; output: string } | { success: false; error: string }
```

`JSON.parse` 실패 시 에러 메시지를 그대로 노출하지 말고 사용자가 이해할 수 있는 문구로 가공하며, 가능하면 에러 위치(줄 번호)를 파싱해 포함한다.

### 2. `components/tools/json-formatter/JsonFormatterTool.tsx` (Client Component)

- 좌: 입력 텍스트 영역(붙여넣기) / 우: 결과 (모바일은 세로 스택)
- 들여쓰기 폭 선택(2/4, 기본 2), Format ↔ Minify 토글
- 에러 시 결과 영역을 붉은색(`#ef4444`) 에러 카드로 대체
- 복사 버튼(클립보드 API), 다운로드 버튼(`.json` 파일)
- **체류시간 인터랙션 보강**: 입력 중 실시간으로 "문자 수 / 줄 수" 카운터를 표시하고, Format/Minify 실행 시 결과 영역이 `fade-in`(0.4s, `docs/UI_GUIDE.md` 애니메이션 규칙)으로 나타나게 한다. 이 툴은 정적 검토에서 인터랙션 요소가 상대적으로 약하다고 판단되었으므로 반드시 포함한다.
- `useAnalyticsEvent`로 `tool_open`(마운트 시), `calculate`(Format/Minify 실행 시), `copy_result`(복사 시) 이벤트 전송
- 입력값을 LocalStorage에 저장하지 않는다 (민감한 JSON이 붙여넣어질 수 있음)

### 3. `tools-config.ts`에 항목 추가

`src/lib/config/tools-config.ts`의 `toolsConfig` 배열에 아래 항목을 추가한다:

```ts
{
  id: 'json-formatter',
  slug: 'json-formatter',
  category: 'developer',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: [...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, 실제 JSON 문법 오류 사례 기반 — 아래 참고 */ ],
  relatedToolIds: ['password-generator'],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/json-formatter.png',
  status: 'testing',
  disclaimerType: 'general',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

FAQ 3개 예시 방향(그대로 복붙하지 말고 실제 완성 문장으로 작성): "JSON이 유효하지 않다는 건 무슨 뜻인가요?", "포맷팅과 압축(minify)의 차이는?", "trailing comma(마지막 콤마) 에러는 왜 발생하나요?" — 템플릿 치환이 아니라 이 툴에 특화된 실질적 답변으로 작성한다(`BitKitTools-project-profile-v2.md` Section 9).

### 4. 페이지 (`src/app/[locale]/developer/json-formatter/page.tsx`, Server Component)

`generateMetadata`로 `tools-config.ts`의 title/description/keywords 기반 SEO 메타데이터(canonical, hreflang, OG) 생성.

**콘텐츠 순서 (모든 툴 페이지 공통 — 이후 다른 tool step들도 이 순서를 그대로 따른다):**

```
<h1>{title}</h1>
<SchemaBreadcrumb items={[Home, Developer, JSON Formatter]} />
<SchemaWebApplication tool={...} />
<SchemaFaqPage faq={...} />
<AdSlot position="header" minHeightPx={90} />
<JsonFormatterTool />                          ← Tool
<AdSlot position="result" minHeightPx={250} />
<Description />                                 ← description 필드 + 부연 설명 문단
<HowToUse />                                     ← 아래 지시 참고
<Example />                                      ← 아래 지시 참고
<AdSlot position="mid-content" minHeightPx={280} />
<AdSlot position="above-faq" minHeightPx={250} />
<Faq items={tool.faq} />
<DisclaimerBanner disclaimerType="general" />
<RelatedTools>                                   ← <ToolCardGrid tools={getRelatedTools('json-formatter')} />
<AdSlot position="footer" minHeightPx={90} />
```

**How To Use 콘텐츠 방향** (템플릿 문구 금지, 이 툴 고유의 UI 용어를 사용한 실제 단계형 문장으로 작성):
1. JSON 원문을 왼쪽 입력 영역에 붙여넣는다
2. 들여쓰기 폭(2/4 spaces)을 선택한다
3. Format 또는 Minify 버튼을 클릭한다
4. 결과를 복사하거나 `.json` 파일로 다운로드한다
문법 오류 발생 시 어떻게 보이는지(줄 번호 표시)도 설명에 포함한다.

**Example 콘텐츠**: 실제 유효한 JSON 샘플 1개와 흔한 오류가 있는 JSON 샘플(예: trailing comma, 따옴표 누락) 1~2개를 코드 블록으로 포함해 Format 전/후를 보여준다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `lib/utils/jsonFormatter.ts`의 단위 테스트(정상 JSON, 문법 오류 JSON 각각)가 통과하는지 확인한다.
3. `/developer/json-formatter`(EN), `/ko/developer/json-formatter`(KO)가 각각 정상 빌드되는지 확인한다.
4. 페이지에 5개 `AdSlot` 전부, `DisclaimerBanner`, `RelatedTools` 섹션이 실제로 렌더링되는지 확인한다.
5. `docs/tech-debt-tracker.md`를 확인해 이 툴과 관련된 알려진 이슈가 없는지 참고한다.
6. 결과에 따라 `phases/1-mvp-tools/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "JSON Formatter/Validator 툴 완성. lib/utils/jsonFormatter.ts, components/tools/json-formatter/, tools-config.ts에 항목 추가(id: json-formatter), app/[locale]/developer/json-formatter/page.tsx. relatedToolIds에 password-generator 포함(다음 step에서 실제 연결됨)."`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 입력된 JSON을 외부로 전송(fetch)하지 마라. 이유: 전부 클라이언트에서 처리해야 하며, 민감한 데이터가 붙여넣어질 수 있다(`docs/screens/developer-json-formatter.md` 금지사항).
- `components/tools/password-generator/` 등 다른 툴 폴더를 import하지 마라. 이유: 컴포넌트/툴 격리 원칙(CLAUDE.md 규칙 8), ESLint `no-restricted-imports` 규칙으로도 강제된다.
- `lib/utils/jsonFormatter.ts`에서 `fetch`를 호출하지 마라 — 순수 함수로 유지한다.
- How To Use/FAQ/Example을 다른 툴과 동일한 문구로 복붙하지 마라. 이유: 얇은 콘텐츠(thin content)는 AdSense 심사 반려 및 SEO 순위 하락으로 이어진다(`BitKitTools-project-profile-v2.md` Section 9).
- `AdSlot` 5개 중 일부를 생략하지 마라 — 광고수익 극대화가 이 프로젝트의 핵심 목표다.
