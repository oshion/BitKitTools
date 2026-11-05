# Screen: Developer Article (첫 아티클: AI 바이브코딩 하네스 프레임워크)

## 배경
지금까지 사이트의 모든 콘텐츠는 툴(`tools-config.ts`)이었다. 툴이 아닌 **설명형 아티클**을 처음 추가한다. 첫 아티클은 AI 바이브코딩용 하네스 프레임워크 개념과, 운영자가 만든 오픈소스 [harness_framework_poor](https://github.com/oshion/harness_framework_poor)를 소개한다. BitKitTools 자체가 하네스(`phases/`, `scripts/execute.py`, `/harness`)로 만들어졌으므로 실제 사용 경험을 근거로 쓴다(E-E-A-T).

2026-11-05 사용자와 확정한 결정:
- 이 세션에서 바로 구현(harness 미사용)
- EN + KO 둘 다 (hreflang 연결)
- SEO/GEO 문구는 **검색 의도 맞춤형** — 키워드 남발은 Google 스팸 정책 위반·AdSense '가치 낮은 콘텐츠' 위험이 있어 하지 않는다

## URL
- `/developer/articles/{slug}` (EN), `/ko/developer/articles/{slug}` (KO)
- 첫 slug: `ai-vibe-coding-harness-framework`
- `app/[locale]/developer/articles/[slug]/page.tsx` — `generateStaticParams`로 developer 카테고리 아티클 × locale만 생성(Static Export)

## 데이터 구조 (Configuration-driven, 툴과 같은 원칙)
- 메타데이터: `lib/config/articles-config.ts` 단일 파일 (`types/article.ts`의 `ArticleConfig`)
  - `id`, `slug`, `category`, `title`, `description`, `keywords`, `publishedAt`, `updatedAt`, `readingMinutes`, `faq`, `relatedToolIds`, `externalLinks`
- 본문: `components/articles/{slug}/ArticleBody.tsx` (서버 컴포넌트, locale별 JSX) + `components/articles/index.ts` 레지스트리(slug → 본문 컴포넌트)
- 새 아티클 추가 = 본문 컴포넌트 1개 + 레지스트리 1줄 + `articles-config.ts` 항목 1개

## 노출
- developer 카테고리 페이지: 툴 그리드 아래 "Articles / 아티클" 섹션(`ArticleCardList`)
- 사이트맵: EN/KO 아티클 URL (hreflang alternates) → `notify-indexnow.ts`가 사이트맵을 읽으므로 IndexNow도 자동
- 홈·RSS: 이번 범위 아님

## UI 구성
- H1 → 게시일·읽는 시간 → "한 줄 요약" 박스(정의문, AI 답변 인용 대상) → 본문 섹션(h2) → 저장소 CTA 링크 → FAQ → 관련 도구
- 타이포·간격은 툴 페이지와 동일(`max-w-6xl`, h2 `text-2xl font-semibold`, 본문 `text-base`) — 본문·FAQ도 별도 폭 제한 없이 페이지 전체 폭(`max-w-6xl`) 사용 (2026-11-05 사용자 요청)
- 외부 링크는 `target="_blank" rel="noopener"`
- 광고·ToolStage 없음(툴 아님)

## 메타데이터 / 구조화 데이터
- `generateMetadata`로 `articles-config.ts`에서 title/description/keywords/canonical/hreflang/OG(`type: article`, publishedTime) 생성 — 하드코딩 금지
- JSON-LD: `TechArticle`(headline, description, datePublished, dateModified, inLanguage, author/publisher = BitKitTools, `about` = SoftwareSourceCode(codeRepository)), `FAQPage`, `BreadcrumbList`(Home → Developer → 아티클)

## 콘텐츠 원칙 (GEO)
- 첫 문단에 "하네스란 무엇인가"를 한 문장으로 정의(인용 가능한 문장)
- 원본 [jha0313/harness_framework](https://github.com/jha0313/harness_framework)를 명시하고, poor 버전은 그 위에 추가한 것임을 정확히 쓴다(저장소 README와 일치)
- 저장소 README에 없는 기능·수치를 지어내지 않는다
- `--dangerously-skip-permissions` 위험, 구독 사용량 기준(API 종량제와 무관)을 고지

## disclaimerType
`none` — 의료·법률·재무 성격 아님

## 상태 / Analytics
서버 컴포넌트, 클라이언트 상태 없음. 툴 이벤트 대상 아님.
