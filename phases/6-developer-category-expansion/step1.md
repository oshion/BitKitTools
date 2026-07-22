# Step 1: tool-json-to-sql

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도, 그리고 기존 developer 툴의 코드 패턴을 파악하라:

- `/docs/screens/developer-json-to-sql.md` (이 step의 1차 스펙 — 반드시 전체를 정독하라. **"핵심 로직 요구사항" 섹션의 방언별 식별자 인용 규칙/리터럴 포맷팅/배치 INSERT 규칙을 정확히 지켜야 한다 — 방언을 섞으면 안 된다.** "JSON Formatter 연동" 섹션은 이 step에서 수신 로직만 구현하고, 발신 버튼(`json-formatter` 쪽 UI)은 step2에서 추가된다)
- `/docs/screens/developer-json-formatter.md` (연동 상대 툴 — 아직 "Convert to SQL" 버튼은 없다, step2에서 추가됨. 이 step에서는 이 툴이 `sessionStorage`로 데이터를 보내줄 수 있다는 전제로 수신부만 만든다)
- `/docs/ARCHITECTURE.md`, `/docs/UI_GUIDE.md`
- `/CLAUDE.md` (CRITICAL 규칙 2 외부 API 호출 금지 — 전부 클라이언트 계산)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts` (파일에서 `json-formatter` 항목 검색 — 구조 참고용, 아직 수정하지 마라. 그 수정은 step2에서 진행한다)
- `src/lib/utils/jsonFormatter.ts` — 표준 `JSON.parse`만 사용하는 원칙(관용적 파싱 없음), 성공/실패 유니온 타입 반환 패턴 참고
- `src/components/tools/json-formatter/JsonFormatterTool.tsx` — 좌우 코드블록 레이아웃, 복사 버튼 패턴 참고(단, 이 컴포넌트를 import하지 마라 — rule 8)
- `src/hooks/useAnalyticsEvent.ts`
- `src/components/ui/AdSlot.tsx`, `DisclaimerBanner.tsx`, `ToolCardGrid.tsx`
- `src/components/seo/SchemaWebApplication.tsx`, `SchemaFaqPage.tsx`, `SchemaBreadcrumb.tsx`
- `src/app/[locale]/beer/bac-calculator/page.tsx` — Server Component 페이지 패턴을 그대로 재사용하라

## 작업

### 1. `lib/utils/jsonToSql.ts` (순수 함수, TDD)

**먼저 테스트를 작성한 뒤 구현하라(CLAUDE.md rule 5).**

```ts
export type SqlDialect = 'mssql' | 'mysql' | 'oracle' | 'postgres'
export type OutputMode = 'insert-only' | 'create-and-insert' | 'create-only'

export function convertJsonToSql(input: {
  json: unknown
  tableName: string
  dialect: SqlDialect
  outputMode: OutputMode
  batchSize?: number // undefined/1 = one INSERT per row
}): { success: true; sql: string } | { success: false; error: string }
```

핵심 로직 요구사항(screens 문서 원문 그대로, 절대 벗어나면 안 됨):

- **입력 검증**: `json`이 이미 파싱된 값이라고 가정하되(이 함수 자체는 문자열 파싱을 하지 않는다 — 컴포넌트 레벨에서 `JSON.parse`로 미리 검증), 단일 객체 또는 배열이 아니면 실패를 반환한다. 단일 객체는 1행짜리 배열로 자동 취급한다.
- **타입 추론**: `string`/`number`/`boolean`/`null`/객체/배열 → 방언별 컬럼 타입 매핑. 문자열은 길이 기반 VARCHAR, `null`은 nullable, 중첩 객체/배열은 방언별 JSON 저장 타입(PostgreSQL `JSONB`, MySQL `JSON`, Oracle `CLOB`, MSSQL `NVARCHAR(MAX)`).
- **식별자 인용 규칙(방언별, 절대 섞지 말 것)**: MySQL/MariaDB 백틱(`` ` ``), PostgreSQL/Oracle 큰따옴표(`"`), MSSQL 대괄호(`[]`).
- **리터럴 포맷팅(방언별)**: `NULL` 표기, boolean 표현(방언 표준 방식), 문자열 이스케이프(작은따옴표 이중화 등), 날짜/타임스탬프 문자열은 있는 그대로 문자열 리터럴로 넣는다(자동 날짜 변환 없음).
- **배치 INSERT**: `batchSize` 설정 시 여러 행을 하나의 `INSERT ... VALUES (...), (...), ...`로 묶는다(MSSQL/MySQL/PostgreSQL 표준 지원). **Oracle은 다중 행 VALUES 구문이 다르다** — `INSERT ALL INTO ... SELECT * FROM dual` 형태 등 Oracle에서 실제로 유효한 구문을 조사해서 정확히 구현하라(임의로 다른 방언 구문을 재사용하지 마라).
- `lib/utils/jsonToSql.test.ts`: 4개 방언 × 기본 INSERT, 4개 방언의 식별자 인용 규칙이 올바른지, 중첩 객체/배열이 JSON 컬럼으로 처리되는지, `null`/boolean/문자열 이스케이프, 배치 INSERT(특히 Oracle의 다른 구문), 단일 객체 자동 배열화, 빈 배열/유효하지 않은 입력 실패 케이스를 포함해 최소 20개 이상의 테스트를 작성한다.

### 2. `components/tools/json-to-sql/JsonToSqlTool.tsx` (Client Component)

- 입력: JSON 텍스트 영역 → 방언 선택(버튼그룹) → 테이블명(필수, 기본값 없음) → 출력모드(INSERT만/CREATE+INSERT/CREATE만) → 배치 옵션(한 줄당 1개 / 여러 행 묶기 + 배치크기, 기본 100행).
- JSON 유효성 검증은 이 컴포넌트에서 표준 `JSON.parse`로만 수행한다(관용적 파싱 시도 금지, `json-formatter`와 동일 원칙). 유효하지 않으면 에러 메시지와 함께 **"JSON Formatter에서 먼저 정리하기"** 링크를 노출한다(`/developer/json-formatter`로 이동하는 단순 링크, sessionStorage 없이).
- 결과: 생성된 SQL을 코드 블록으로(단색 monospace, 구문강조는 스코프 밖) + 복사 버튼. 코드 블록을 카드의 시각적 중심으로 크고 여유 있게(`p-6` 이상, 넉넉한 line-height) 배치한다(screens 문서 "디자인 방향" 참고 — 다른 툴의 "큰 숫자" 패턴과 다르다).
- **"클라이언트에서만 처리됩니다 — JSON이 서버로 전송되지 않습니다"** 신뢰 문구를 입력 영역 근처에 명시.
- **`json-formatter` → 이 툴 연동 수신부(신규)**: 컴포넌트 마운트 시 `sessionStorage`에서 이 두 툴 전용 네임스페이스 키(예: `json-formatter-to-sql:payload`)를 확인하고, 값이 있으면 입력창에 자동으로 채운 뒤 **즉시 해당 sessionStorage 키를 삭제한다**(재방문 시 오래된 값이 남아있지 않도록). 이 키는 `json-formatter`/`json-to-sql` 두 컴포넌트 폴더 밖의 공용 상수 파일 없이, 두 컴포넌트 각각에 동일한 문자열 리터럴로 독립 정의한다(rule 8 — 컴포넌트가 서로 import하지 않는다는 원칙을 지키되 값만 우연히 같은 문자열).
- `useAnalyticsEvent`로 `tool_open`, `calculate`, `copy_result` 전송.

### 3. `tools-config.ts`에 항목 추가

```ts
{
  id: 'json-to-sql',
  slug: 'json-to-sql',
  category: 'developer',
  title: { en: '...', ko: '...' },
  description: { en: '...', ko: '...' },
  keywords: { en: ['json to sql converter', 'json to sql insert generator', 'json to mysql', 'json to postgresql', 'json to oracle sql', 'json to mssql', ...], ko: [...] },
  schemaType: 'WebApplication',
  faq: [ /* 최소 3개, screens 문서 "tools-config 항목" 참고 */ ],
  relatedToolIds: ['json-formatter'],
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

`json-formatter`의 기존 `relatedToolIds`는 이 step에서 건드리지 마라 — step2(json-formatter-enhancements)에서 상호 링크와 "Convert to SQL" 버튼을 함께 추가한다.

### 4. 페이지 (`src/app/[locale]/developer/json-to-sql/page.tsx`, Server Component)

`bac-calculator/page.tsx` 패턴을 그대로 따른다. `generateMetadata`의 `openGraph`에 반드시 `images: [{ url: \`${SITE_URL}/og/default-${safeLocale}.png\`, width: 1200, height: 630 }]`를 포함하라.

콘텐츠 순서:
```
<h1> → SchemaBreadcrumb → SchemaWebApplication → SchemaFaqPage
→ AdSlot(header) → JsonToSqlTool → AdSlot(result)
→ Description → HowToUse → Example → AdSlot(mid-content)
→ AdSlot(above-faq) → Faq → DisclaimerBanner(none은 렌더링 안 됨)
→ RelatedTools(ToolCardGrid + getRelatedTools('json-to-sql')) → AdSlot(footer)
```

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `convertJsonToSql`의 단위 테스트(4개 방언, 식별자 인용, 배치 INSERT, Oracle 특수 구문 포함)가 통과하는지 확인한다.
3. `/developer/json-to-sql`(EN/KO)이 정상 빌드되는지, `<meta property="og:image">`가 `/og/default-{en,ko}.png`를 가리키는지 확인한다.
4. 생성된 SQL에서 방언별 식별자 인용 규칙이 섞이지 않는지(예: MySQL 결과에 큰따옴표가 섞이지 않는지) 코드/테스트로 확인한다.
5. `sessionStorage` 수신 후 즉시 키를 삭제하는지 확인한다(재사용 시 오염 방지).
6. `JsonFormatterTool.tsx`를 import하지 않았는지 확인한다.
7. 결과에 따라 `phases/6-developer-category-expansion/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약(생성 파일 목록, sessionStorage 키 이름 등 핵심 결정)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 입력된 JSON을 외부로 전송하지 마라 — 전부 클라이언트에서 처리(json-formatter와 동일 원칙).
- 방언별 식별자 인용 규칙/리터럴 포맷을 섞어 쓰지 마라 — 선택한 방언에 정확히 맞는 문법만 생성한다.
- `json-formatter`와 컴포넌트/로직을 공유하지 마라(rule 8) — 데이터 전달은 sessionStorage로만.
- 관용적(비표준) JSON 파싱을 시도하지 마라 — 유효하지 않으면 명확히 실패시키고 JSON Formatter로 안내한다.
- `json-formatter`의 기존 `relatedToolIds` 배열을 이 step에서 건드리지 마라(step2에서 처리).
- `page.tsx`의 `openGraph`에 `images` 필드를 빠뜨리지 마라.
- 다른 툴 폴더를 import하지 마라(rule 8).
- 기존 테스트를 깨뜨리지 마라.
