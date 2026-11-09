# Step 0: fun-category

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/fun-category.md` (이 step의 1차 스펙 — "변경 지점" 표와 "수용 기준")
- `/docs/screens/category-page.md` (카테고리 페이지 공통 구조)
- `/docs/ARCHITECTURE.md`, `/docs/UI_GUIDE.md`
- `src/types/tool.ts` (`ToolCategory` 유니온)
- `src/lib/config/tools-config.ts` (`TOOL_CATEGORIES`, `getToolsByCategory`) 와 `src/lib/config/tools-config.test.ts`
- `src/lib/i18n/messages/en.json`, `src/lib/i18n/messages/ko.json` (`nav`, `categoryPage.description` 네임스페이스)
- `src/app/[locale]/developer/page.tsx`, `src/app/[locale]/baby/page.tsx` (카테고리 페이지 패턴 — 이 파일 구조를 그대로 따른다)
- `src/components/layout/Nav.tsx`, `src/components/layout/Nav.test.tsx` (현재 "renders links for all 4 categories" 테스트가 있다)
- `src/components/layout/Footer.tsx`, `src/app/[locale]/page.tsx`(홈), `src/app/sitemap.ts` — 모두 `TOOL_CATEGORIES`를 순회하는지 확인만 한다

## 작업

이 phase는 5번째 카테고리 `fun`(표시명 EN "Fun" / KO "재미")을 만들고 그 첫 콘텐츠로 치이카와 성격 테스트를 추가한다. **이 step은 카테고리 신설만 한다** — 툴은 다음 step들에서 추가한다.

TDD(CLAUDE.md 규칙 5): 아래 테스트를 먼저 수정/추가하고 실패를 확인한 뒤 구현하라.

1. `src/types/tool.ts`: `ToolCategory`에 `'fun'`을 추가한다.
2. `src/lib/config/tools-config.ts`: `TOOL_CATEGORIES`의 **마지막**에 `'fun'`을 추가한다 (`['developer', 'travel', 'beer', 'baby', 'fun']`).
3. `src/lib/i18n/messages/en.json` / `ko.json`:
   - `nav.fun`: `"Fun"` / `"재미"`
   - `categoryPage.description.fun`:
     - EN: `Light, fun personality tests and quizzes — answer a few questions and share your result. For entertainment only, not a diagnosis.`
     - KO: `가볍게 즐기는 성격 테스트와 퀴즈 — 몇 가지 질문에 답하고 결과를 친구에게 공유해 보세요. 재미를 위한 콘텐츠이며 진단이 아닙니다.`
   - 다른 카테고리에 있는 키가 있다면(예: 홈 카테고리 섹션용 키) `fun`에도 같은 형태로 채운다. 모든 카테고리 키 집합이 EN/KO에서 같아야 한다.
4. `src/app/[locale]/fun/page.tsx`: `developer/page.tsx`와 같은 구조(`CATEGORY = 'fun'`, `generateStaticParams`, `generateMetadata` — title `{nav.fun} — BitKitTools`, canonical/hreflang/OG 동일 패턴, H1, `SchemaBreadcrumb`, 설명, `ToolCardGrid`의 `emptyMessage={tCategory('comingSoon')}`, 아티클 섹션). 아직 fun 툴이 없으므로 이 step 시점에는 "준비 중" 문구가 표시되는 것이 정상이다.
5. `ToolCategory`를 키로 쓰는 맵/스위치(`Record<ToolCategory, …>`, 카테고리별 아이콘·색상 등)가 있으면 `fun` 항목을 추가한다. 카테고리 강조색이 필요하면 UI_GUIDE의 색 규칙을 따르고 보라/인디고 계열은 쓰지 않는다. `npx tsc --noEmit`이 누락을 알려준다.
6. 테스트:
   - `Nav.test.tsx`의 카테고리 개수 테스트를 5개(`fun` 포함)로 갱신한다.
   - `tools-config.test.ts`에 `TOOL_CATEGORIES`가 `fun`을 마지막에 포함한다는 테스트를 추가한다.
   - EN/KO 메시지 모두에 `nav.fun`, `categoryPage.description.fun`이 비어 있지 않게 존재한다는 테스트를 추가한다(기존 메시지 테스트 파일이 있으면 거기에 추가).

## Acceptance Criteria

```bash
npm run lint && npm test && npm run build
test -f out/fun/index.html && test -f out/ko/fun/index.html
grep -q "Fun — BitKitTools" out/fun/index.html
grep -q "재미 — BitKitTools" out/ko/fun/index.html
grep -q "/fun/" out/sitemap.xml
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `out/index.html`(홈), 아무 툴 페이지 1개의 Nav/Footer에 `/fun/` 링크가 생겼는지 확인한다(`grep -c 'href="/fun/"'`).
3. 기존 4개 카테고리 페이지(`out/{developer,travel,beer,baby}/index.html`)가 그대로 생성되는지 확인한다.
4. 아키텍처 체크리스트:
   - ARCHITECTURE.md 디렉토리 구조를 따르는가? (`app/`에는 페이지만)
   - CLAUDE.md 규칙 9(카테고리 목록 하드코딩 금지 — `TOOL_CATEGORIES` 단일 소스)를 지켰는가?
5. 결과에 따라 `phases/18-fun-chiikawa-personality-test/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약 (수정한 파일, 추가한 메시지 키 포함)"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- Nav/Footer/홈/사이트맵에 `fun`을 직접 하드코딩하지 마라. 이유: 모두 `TOOL_CATEGORIES`를 순회하므로 거기에 추가하면 자동 노출된다(CLAUDE.md 규칙 9). 순회하지 않는 곳을 발견하면 하드코딩 대신 `TOOL_CATEGORIES`를 쓰도록 고친다.
- 동적 `[category]` 라우트로 바꾸지 마라. 이유: 기존 카테고리는 모두 리터럴 디렉토리이고 스펙도 `app/[locale]/fun/page.tsx`로 정했다.
- 이 step에서 치이카와 테스트 관련 파일(데이터·컴포넌트·tools-config 항목)을 만들지 마라. 이유: 이후 step의 범위다.
- `public/rss.xml`을 커밋하지 마라. 이유: 빌드할 때마다 재생성되는 파일이라 변경분이 생겨도 의미가 없다 — `git checkout -- public/rss.xml`로 되돌린다.
- 기존 테스트를 깨뜨리지 마라.
