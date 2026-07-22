# Step 0: tool-jwt-decoder

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 기존 developer 툴의 코드 패턴을 파악하라:

- `/docs/screens/developer-jwt-decoder.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. 서명 검증을 하지 않는다는 스코프 제한, 클레임 설명 로직, 신뢰 문구, 금지사항이 전부 이 문서에 있다)
- `/docs/ARCHITECTURE.md`, `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 2 외부 API 호출 원칙 금지 — 이 툴은 전부 클라이언트 계산, 규칙 4 환경변수 보안과 무관하지만 토큰을 저장하지 않는다는 원칙은 규칙 4의 정신과 같다)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts` (파일에서 `json-formatter` 항목 검색 — 구조 참고용, 아직 수정하지 마라. 그 수정은 step2에서 진행한다)
- `src/lib/utils/jsonFormatter.ts`, `src/lib/utils/jsonFormatter.test.ts` — 순수 함수(성공/실패 유니온 타입 반환) + 테스트 패턴 참고
- `src/components/tools/json-formatter/JsonFormatterTool.tsx` — 좌우 코드블록 레이아웃, 복사 버튼 패턴 참고(단, 이 컴포넌트를 import하지 마라 — rule 8)
- `src/hooks/useAnalyticsEvent.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/SchemaWebApplication.tsx`, `SchemaFaqPage.tsx`, `SchemaBreadcrumb.tsx`
- `src/app/[locale]/beer/bac-calculator/page.tsx` — Server Component 페이지 패턴을 그대로 재사용하라(`generateMetadata`의 `openGraph.images` 필드 포함)

## 작업

### 1. `lib/utils/jwtDecoder.ts` (순수 함수, TDD)

**먼저 테스트를 작성한 뒤 구현하라(CLAUDE.md rule 5).**

```ts
export type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string // base64url 그대로, 검증하지 않음
}

export function decodeJwt(token: string): { success: true; decoded: DecodedJwt } | { success: false; error: string }

export type ClaimExplanation = { key: string; value: unknown; explanation: string }

export function explainStandardClaims(payload: Record<string, unknown>, locale: 'en' | 'ko'): ClaimExplanation[]
```

- `decodeJwt`: 토큰을 `.`으로 분리해 정확히 3개 세그먼트인지 확인 → header/payload를 base64url 디코딩 후 `JSON.parse` → 실패 시 어느 단계에서 실패했는지 구분되는 에러 메시지 반환("점 3개로 구분되지 않음" / "base64url 디코딩 실패" / "JSON 파싱 실패"). **서명을 검증하지 않는다** — signature 세그먼트는 그대로 문자열로 반환한다.
- `explainStandardClaims`: `exp`/`iat`/`nbf`(유닉스 타임스탬프 → 로컬 날짜/시간 문자열 변환), `iss`/`aud`/`sub`/`jti`가 payload에 존재하면 각각 사람이 읽을 수 있는 설명을 생성한다. `exp`가 있으면 설명에 "만료 시각 지남" 또는 "만료까지 남은 기간"을 포함하되, **"서명 검증됨"류 표현은 절대 쓰지 않는다** — 이건 단순 시간 비교일 뿐이다.
- `lib/utils/jwtDecoder.test.ts`: 유효한 토큰 디코딩, 점 개수가 3개가 아닌 경우, base64url 디코딩 실패, JSON 파싱 실패, `exp` 만료/미만료 각각의 클레임 설명, 표준 클레임이 없는 payload 등을 포함해 최소 12개 이상의 테스트를 작성한다.

### 2. `components/tools/jwt-decoder/JwtDecoderTool.tsx` (Client Component)

- 입력: JWT 토큰 붙여넣기(단일 입력에 가깝게 디자인하되 긴 토큰이 잘리지 않게 자동 줄바꿈 표시). 입력 필드 바로 아래 **"토큰은 브라우저를 벗어나지 않습니다"** 신뢰 문구(jwt.ms 스타일 간결한 문구).
- 결과: Header JSON / Payload JSON을 각각 코드 블록으로(데스크톱은 나란히, 모바일은 세로) + 그 아래 "클레임 설명" 표(클레임명/값/설명, `explainStandardClaims` 결과 — 촘촘한 표보다 여백 있는 리스트 형태).
- `exp` 클레임이 있으면 "만료 시각 지남" 또는 "만료까지 N일 남음" 배지를 눈에 띄게 표시하되, 반드시 서명 검증이 아님을 함께 라벨링한다.
- 유효하지 않은 토큰 입력 시 명확한 에러 메시지(어느 단계에서 실패했는지).
- **컴포넌트 로컬 `useState`만 사용한다. 토큰 값을 LocalStorage/sessionStorage 어디에도 저장하지 마라** — `json-formatter`보다 더 엄격한 원칙(인증 토큰은 특히 민감).
- `useAnalyticsEvent`로 `tool_open`, `calculate`(디코딩 실행 시) 전송 — **토큰 값 자체를 이벤트 payload에 절대 포함하지 마라.**

### 3. `tools-config.ts`에 항목 추가

```ts
{
  id: 'jwt-decoder',
  slug: 'jwt-decoder',
  category: 'developer',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: ['jwt decoder', 'jwt token decoder', 'decode jwt online', 'jwt claims viewer', ...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, screens 문서 "tools-config 항목" 참고 */ ],
  relatedToolIds: [],
  adSlots: [
    { position: 'header', minHeightPx: 90 },
    { position: 'result', minHeightPx: 250 },
    { position: 'mid-content', minHeightPx: 280 },
    { position: 'above-faq', minHeightPx: 250 },
    { position: 'footer', minHeightPx: 90 },
  ],
  ogImage: '/og/default-en.png',
  status: 'testing',
  disclaimerType: 'none',
  aiOverviewResistance: 'high',
  addedAt: '<오늘 날짜 ISO 형식>',
  popular: false,
}
```

`relatedToolIds`는 빈 배열로 시작한다 — `json-to-sql`은 이 툴과 목적이 무관하므로 연결하지 않는다(둘 다 developer 카테고리지만 사용 맥락이 다르다).

### 4. 페이지 (`src/app/[locale]/developer/jwt-decoder/page.tsx`, Server Component)

`bac-calculator/page.tsx` 패턴을 그대로 따른다. `generateMetadata`의 `openGraph`에 반드시 `images: [{ url: \`${SITE_URL}/og/default-${safeLocale}.png\`, width: 1200, height: 630 }]`를 포함하라.

콘텐츠 순서:
```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → JwtDecoderTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(none은 렌더링 안 됨 — 컴포넌트가 null 반환하는 기존 동작 그대로 둔다)
→ RelatedTools 섹션은 `getRelatedTools('jwt-decoder')`가 빈 배열을 반환하면 생략(기존 조건부 렌더링 패턴 그대로) → AdSlot(footer)
```

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `decodeJwt`/`explainStandardClaims`의 단위 테스트가 통과하는지 확인한다.
3. `/developer/jwt-decoder`(EN/KO)가 정상 빌드되는지, `<meta property="og:image">`가 `/og/default-{en,ko}.png`를 가리키는지 확인한다.
4. 코드 전체에서 "서명이 유효합니다/무효합니다" 같은 서명 검증 관련 문구가 전혀 없는지 grep으로 확인한다.
5. `JwtDecoderTool.tsx`에 `localStorage`/`sessionStorage` 호출이 전혀 없는지 grep으로 확인한다.
6. `useAnalyticsEvent` 호출부에서 토큰 원문이 이벤트 payload에 포함되지 않는지 코드로 확인한다.
7. 결과에 따라 `phases/6-developer-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(생성 파일 목록, disclaimerType, 핵심 결정)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 입력된 토큰을 외부로 전송하지 마라 — 전부 클라이언트에서 처리.
- **서명 검증 기능을 이번 스코프에 포함하지 마라** — "서명이 유효합니다/무효합니다" 같은 문구를 절대 표시하지 않는다(만료 시각 비교와 혼동 금지).
- 토큰 값을 LocalStorage/sessionStorage에 저장하지 마라(json-formatter보다 더 엄격 — 인증 토큰은 특히 민감).
- `json-formatter`/`json-to-sql`과 컴포넌트/로직을 공유하지 마라(rule 8).
- 기존 테스트를 깨뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).
