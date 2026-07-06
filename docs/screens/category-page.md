# Screen: Category Listing Page

## 배경
`docs/ARCHITECTURE.md`의 디렉토리 구조에 `app/[locale]/{category}/page.tsx`("카테고리 목록 페이지")가 스펙으로 명시돼 있었으나, MVP 8종 툴을 만드는 동안 이 화면 자체의 스펙 파일이 없어 실제로 구현되지 않았다. 그 결과 상단 Nav의 카테고리 링크(Developer/Travel/Beer/Baby)가 전부 존재하지 않는 라우트를 가리켜 클릭 시 깨졌다.

## URL
- `/{category}` (EN), `/ko/{category}` (KO) — `category` ∈ `developer | travel | beer | baby` (4개 리터럴 디렉토리, `[category]` 동적 세그먼트 아님 — 기존 8개 툴 페이지와 동일하게 카테고리별 실제 폴더 하위에 `page.tsx`를 둔다)

## 목적
해당 카테고리에 속한 툴 목록을 보여주는 허브 페이지. 홈페이지의 카테고리별 섹션과 동일한 데이터(`getToolsByCategory`)를 사용하지만 한 카테고리에 집중된 전용 URL/SEO 메타데이터를 갖는다.

## 입력
없음 (정적 목록 페이지)

## 출력/로직
- `getToolsByCategory(category)` (`lib/config/tools-config.ts`, 기존 함수 재사용)로 해당 카테고리의 툴 목록을 가져와 `ToolCardGrid`로 렌더링
- 툴이 비어 있으면(현재는 없음, 향후 카테고리 추가 대비) `categoryPage.comingSoon` 메시지 표시

## UI 구성
- H1: 카테고리명(`nav.{category}` 번역 키 재사용, 홈페이지와 동일 라벨)
- 카테고리 설명 1~2문장 (`categoryPage.description.{category}`, 신규 메시지 키)
- `ToolCardGrid` — 홈페이지와 동일 컴포넌트
- Header/Footer 광고 슬롯 2곳
- `SchemaBreadcrumb` (Home → 카테고리)

## tools-config 항목
해당 없음 — 이 페이지는 개별 툴이 아니라 카테고리 허브이므로 `tools-config.ts`에 항목을 추가하지 않는다.

## 메타데이터
- title: `{카테고리명} — BitKitTools`
- description: `categoryPage.description.{category}`
- canonical: EN은 `/{category}`, KO는 `/ko/{category}` (기존 8개 툴 페이지와 동일한 `localeHref`/canonical 패턴)

## 상태
서버 컴포넌트, 클라이언트 상태 없음.

## Analytics 이벤트
없음 (목록 페이지는 계산/복사 동작이 없으므로 Tool Open 등 이벤트 대상 아님)

## 금지사항
- `[category]` 동적 세그먼트로 리팩터링하지 않는다 — 기존 8개 툴 페이지가 리터럴 카테고리 폴더 구조라 일관성이 깨짐.
- 개별 툴 페이지의 FAQ/Disclaimer/Schema(WebApplication, FAQPage) 섹션을 넣지 않는다 — 이 페이지는 목록 허브이지 개별 툴이 아님.

---

# 부수 발견: 루트 레이아웃 에러 안전망 누락

카테고리 페이지가 없어서 `/en/developer` 같은 라우트가 404가 나야 했는데, 실제로는 "Missing `<html>` and `<body>` tags in the root layout" 런타임 에러가 떴다. 원인은 `app/[locale]/not-found.tsx`(존재함, html/body 있음)까지 도달하지 못하고 Next.js가 자체 내장 404를 **루트 레이아웃**(`app/layout.tsx`, html/body 없음 — `[locale]/layout.tsx`만 html/body를 제공하는 이 프로젝트의 의도된 구조) 아래에서 렌더링해버리기 때문이었다. `app/[locale]/developer/nonexistent-tool` 같은 완전히 다른 미매칭 경로에서도 동일하게 재현되므로, 카테고리 페이지 4개를 채워도 "진짜 존재하지 않는 경로"에 대해서는 여전히 크래시가 난다.

- `app/not-found.tsx` (루트, html/body 자체 포함) 신규 추가 — 이 파일이 없으면 루트 레이아웃 아래에서 미매칭 경로가 Next 기본 404로 폴백되며 크래시.
- `app/global-error.tsx` (ARCHITECTURE.md에 스펙되어 있었으나 누락) 신규 추가 — 루트 레이아웃 자체에서 예외가 발생하는 경우의 안전망. 이번 버그의 직접 원인은 아니지만 스펙에 있던 누락 파일이라 함께 채운다.
