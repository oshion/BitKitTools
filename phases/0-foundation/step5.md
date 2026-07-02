# Step 5: home-and-seo

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/screens/home.md` (이 step의 1차 스펙)
- `/docs/ARCHITECTURE.md` (SEO/Schema.org, 국제화 섹션)
- `/docs/PRD.md`
- `src/lib/config/tools-config.ts` (Step 2 산출물)
- `src/components/layout/*`, `src/components/ui/ToolCard*`, `src/components/ui/AdSlot.tsx` (Step 3, 4 산출물)

## 작업

### 1. 홈 페이지 (`src/app/[locale]/page.tsx`)

`docs/screens/home.md`의 "UI 구성" 섹션을 그대로 구현한다:
1. `<h1>` 서비스 소개
2. Popular Tools 섹션 — `getPopularTools()`가 빈 배열이면 섹션 자체를 렌더링하지 않는다
3. 카테고리 4개 섹션 (`TOOL_CATEGORIES` 순회, 각각 `getToolsByCategory(category)` → `ToolCardGrid`)
4. Recently Added 섹션 — `getRecentTools(4)`가 빈 배열이면 렌더링하지 않는다
5. `<AdSlot position="mid-content" minHeightPx={280} />` 1~2개
6. `Header`/`Footer` (레이아웃에서 이미 포함되어 있다면 중복 배치하지 않는다)

`tools-config.ts`가 현재 빈 배열이므로 카테고리 섹션들이 "아직 준비 중" 같은 빈 상태 문구를 보여줘도 된다 — `1-mvp-tools` task가 진행되며 항목이 채워지면 자동으로 카드가 나타나야 한다(이 페이지 코드를 다시 수정할 필요 없이).

### 2. `generateMetadata`

`docs/ARCHITECTURE.md`의 국제화/SEO 섹션대로 title/description/`alternates.languages`(en=x-default, ko) 설정.

### 3. `src/app/sitemap.ts`

`MetadataRoute.Sitemap` 반환. `tools-config.ts`의 `toolsConfig`를 순회해 locale × slug 조합 URL을 생성한다(현재는 빈 배열이므로 홈 + 카테고리 4개 + 법적 페이지 URL만 생성되어도 된다 — 툴이 추가되면 자동으로 늘어나야 한다).

### 4. `src/app/robots.ts`

기본 robots 규칙 + `sitemap.xml` 위치 명시.

### 5. `scripts/generate-rss.ts`

빌드 타임 스크립트. `tools-config.ts`의 `toolsConfig`를 `addedAt` 내림차순으로 정렬해 RSS 2.0 XML을 `public/rss.xml`(또는 `out/rss.xml`로 빌드 후 복사)로 생성한다. `package.json`의 `build` 스크립트에서 `next build` 이후 실행되도록 연결한다(`"build": "next build && tsx scripts/generate-rss.ts"` 형태 — 정확한 실행 방식은 재량).

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run build` 후 `out/sitemap.xml`, `out/robots.txt`, `out/rss.xml`(또는 `public/rss.xml`이 빌드에 포함되는지)이 생성되는지 확인한다.
3. `tools-config.ts`가 빈 배열인 상태에서 홈 페이지가 에러 없이 렌더링되는지 확인한다.
4. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "홈 페이지(app/[locale]/page.tsx), sitemap.ts, robots.ts, scripts/generate-rss.ts 생성 완료. tools-config 데이터 기반 동적 렌더링, 빈 배열 상태에서도 정상 동작."`
   - 실패/blocked 처리는 Step 0과 동일한 기준을 따른다.

## 금지사항

- 카테고리/툴 목록을 홈 페이지 컴포넌트에 배열로 하드코딩하지 마라 — 반드시 `tools-config.ts` 경유 (`docs/screens/home.md` 금지사항, CLAUDE.md 규칙 9).
- "Popular"/"Recently Added"를 클라이언트에서 실시간으로 계산하지 마라 — `tools-config.ts`의 정적 `popular`/`addedAt` 필드만 사용한다.
- `sitemap.ts`/`rss.xml` 생성 로직을 툴 개수에 맞춰 수동으로 나열하지 마라 — 반드시 `toolsConfig` 배열을 순회하는 방식으로 작성해 툴이 추가될 때 자동으로 반영되게 하라.
