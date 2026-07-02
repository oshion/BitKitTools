# Screen: 홈 (Home)

## URL
`/` (EN, 기본 — prefix 없음), `/ko` (KO)

## 목적
전체 카테고리 4개와 8개 툴을 한눈에 보여주고, 사용자가 원하는 툴로 즉시 진입하게 한다. SEO 진입점(가장 많은 백링크/북마크가 걸리는 페이지)이므로 카테고리·툴 이름이 시맨틱 마크업으로 노출되어야 한다.

## 데이터 소스
`lib/config/tools-config.ts` — 하드코딩 금지. 카테고리 4개(`developer`, `travel`, `beer`, `baby`) × 툴 2개씩을 이 설정에서 읽어 렌더링한다. `popular: true`인 툴은 "Popular Tools" 섹션에, `addedAt` 최신순 상위 항목은 "Recently Added" 섹션에 별도 노출한다(둘 다 수동 큐레이션 값, 실시간 랭킹 아님).

## UI 구성
1. `<h1>` 서비스 소개 한 줄 (예: "Free calculators for developers, travelers, beer lovers & parents")
2. Popular Tools 섹션 (선택적, `popular: true` 항목만)
3. 카테고리 섹션 4개, 각 섹션은 `<h2>` 카테고리명 + 툴 카드 2개
   - 카드: 툴 이름, 한 줄 설명, 클릭 시 `/{category}/{tool-slug}` (EN) 또는 `/ko/{category}/{tool-slug}` (KO)로 이동
4. Recently Added 섹션 (선택적)
5. 카드 그리드 사이/하단에 `AdSlot` (`mid-content`, `min-h-[280px]`) 1~2개 배치
6. 헤더: 로고, 언어 전환(EN/KO), 카테고리 네비게이션 (전부 tools-config 기반)
7. 푸터: 카테고리 전체 링크 + 법적 페이지 링크(`/privacy-policy`, `/terms`, `/about`, `/contact`) + 저작권

## 상태
- 전역 상태 없음. `tools-config.ts`를 Server Component에서 직접 읽어 정적 렌더링.

## SEO
- `title`: "BitKitTools — Free Calculators for Developers, Travelers, Beer Lovers & Parents" (en/ko 각각 검수된 번역, 기계 번역 그대로 게시 금지)
- `description`: 대표 툴 3~4개를 언급하는 요약
- `alternates.languages`로 en(x-default)/ko hreflang 명시
- `BreadcrumbList` Schema는 홈에서는 생략(루트이므로), 하위 페이지부터 적용
- 각 카드 링크는 `<a>` 실제 앵커(크롤러가 읽을 수 있어야 함)

## 금지사항
- 카테고리/툴 목록을 페이지 컴포넌트에 직접 배열로 하드코딩하지 않는다. 반드시 `tools-config.ts` 경유.
- "Popular"/"Recently Added"를 클라이언트에서 실시간 계산하지 않는다 — `tools-config.ts`의 정적 `popular`/`addedAt` 필드만 사용한다(Static Export 제약).
