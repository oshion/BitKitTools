# Architecture Decision Records

## 철학
무관리(서버리스) 최우선. 광고 수익 극대화를 위한 SEO/AI Overview 대응/속도 최적화. 컴포넌트 격리로 툴 추가 비용을 최소화하되, YMYL/법적 리스크는 구조적으로 강제한다.

---

### ADR-001: Next.js 16 App Router + Static Export 채택
**결정**: App Router를 사용하되 `output: 'export'`로 완전 정적 HTML/CSS/JS를 빌드한다. SSR/ISR/`app/api/` 라우트 핸들러/middleware는 사용하지 않는다.
**이유**: 서버 비용·운영 부담 없이 AWS EC2 + Nginx로 정적 파일만 서빙하면 되고, 모든 계산 로직이 클라이언트에서 완결되는 마이크로 툴 특성과 맞는다.
**트레이드오프**: 서버 사이드 secret 보관, 동적 OG 이미지 생성, ISR, 요청 시점 언어 감지(middleware)를 포기한다. 실시간 데이터가 필요한 툴은 클라이언트 직접 fetch(ADR-006)로 제한적으로만 대응한다.

---

### ADR-002: Tailwind CSS 채택
**결정**: CSS Modules, styled-components 대신 Tailwind CSS 사용
**이유**: 빠른 UI 개발, 정적 빌드 시 미사용 클래스 제거로 번들 최소화 → Core Web Vitals(LCP) 유리
**트레이드오프**: 클래스명이 길어질 수 있음

---

### ADR-003: Jest + React Testing Library 채택
**결정**: Vitest 대신 Jest + React Testing Library 사용
**이유**: Next.js 프로젝트에 잘 맞는 검증된 조합. `lib/utils/`의 순수 계산 함수(BAC, percentile 등) 단위 테스트에 충분
**트레이드오프**: Vitest 대비 ESM 설정이 복잡할 수 있음

---

### ADR-004: Zustand 범위를 사이트 전역 UI 상태로 제한
**결정**: Zustand는 다크모드 토글 등 **툴과 무관한 사이트 차원 UI 상태**에만 사용한다. 툴별 계산 입력값/결과, CMP 동의 상태는 저장하지 않는다.
**이유**: 각 툴은 완전히 독립된 컴포넌트여야 하며(PRD), 전역 상태에 툴 데이터가 섞이면 결합도가 올라가 새 툴 추가 비용이 커진다.
**트레이드오프**: 툴 간 상태 재사용이 필요해지면 별도로 논의해야 한다.

---

### ADR-005: 인증/세션 없음
**결정**: 로그인, 회원가입, 세션 기반 인증을 만들지 않는다.
**이유**: "즉시 쓰고 나가는 마이크로 툴" 정체성상 로그인 장벽이 이탈률을 높여 광고 수익 목표와 상충한다. 백엔드/DB가 없어 세션을 저장할 곳도 없다.
**트레이드오프**: 사용자별 데이터 동기화(여러 기기 간)는 지원하지 않는다. LocalStorage(ADR-008)로 기기 단위까지만 대응한다.

---

### ADR-006: 외부 API는 예외적으로 클라이언트 직접 fetch (API 키 불필요한 공개 API만)
**결정**: `app/api/` 라우트 핸들러 대신, 실시간 외부 데이터가 반드시 필요한 예외 툴에 한해 `lib/api/`에서 브라우저가 직접 공개 API를 fetch한다.
**이유**: Static Export는 서버가 없어 라우트 핸들러가 배포 환경에서 동작하지 않는다. API 키가 필요없는 공개 API만 허용해 시크릿 노출 위험을 원천 차단한다.
**트레이드오프**: API 키가 필요한 서비스는 사용할 수 없다. MVP 8종 툴(JSON Formatter, Password Generator, Flight Delay Compensation, Visa Checker, BAC Calculator, Homebrew Calculator, Baby Growth/Sleep Calculator)은 전부 정적 규정/공식 기반 계산이라 이 예외 자체가 필요 없다.

---

### ADR-007: next-intl 채택, `localePrefix: 'as-needed'`
**결정**: next-intl로 다국어를 구현하되, 기본 언어(EN)는 URL prefix 없이, 한국어만 `/ko/` prefix를 붙인다.
**이유**: Static Export는 middleware 기반 요청 시점 언어 감지가 불가능해 "루트 접속 시 서버가 언어를 판단해 리다이렉트"하는 방식을 쓸 수 없다. as-needed 방식은 EN을 고정 기본값으로 정적 생성해 크롤러/직접 URL 접근 모두 언어 깜빡임 없이 즉시 응답한다. 영어권 트래픽이 주력이므로 EN을 prefix 없는 기본값으로 두는 것이 SEO에도 유리하다.
**트레이드오프**: "always prefix" 방식 대비 URL 구조가 언어마다 비대칭적이다(EN만 예외). hreflang/x-default 설정을 정확히 해야 검색엔진이 EN=기본, KO=대안으로 올바르게 인식한다.

---

### ADR-008: LocalStorage 기반 데이터 저장 (백엔드 DB 없음)
**결정**: 최근 사용 Tool, 즐겨찾기, 마지막 입력값 등은 백엔드 DB 대신 브라우저 LocalStorage에 저장한다.
**이유**: 서버 비용 최소화 원칙에 부합. 마이크로 툴의 개인화 요구 수준에는 LocalStorage로 충분하다.
**트레이드오프**: 브라우저/기기 간 동기화 불가. LocalStorage 사용도 개인정보처리방침 고지 대상이다(profile v2 Section 2).

---

### ADR-009: Configuration-driven 툴 관리, 확장 스키마 (`lib/config/tools-config.ts`)
**결정**: 툴 메타데이터를 `id/slug/category/title/description/keywords/schemaType/faq/relatedToolIds/adSlots/ogImage/status/disclaimerType/aiOverviewResistance/addedAt/popular` 스키마의 단일 파일로 관리한다. `status`/`popular`는 GA4/GSC 월간 리뷰 결과를 사람이 수동 반영하는 정적 필드다.
**이유**: 홈/카테고리/사이트맵/RSS/관련 Tool/SEO 메타데이터/광고 슬롯/면책조항까지 전부 이 데이터 하나로 동적 생성해야 새 툴 추가가 "컴포넌트+설정 한 줄"로 끝난다(PRD 확장성 요구사항). AI Overview 대응 전략(profile v2 Section 5-3) 실행을 위해 `aiOverviewResistance` 필드로 신규 툴 우선순위를 코드 차원에서 추적한다.
**트레이드오프**: 설정 스키마가 무거워져 신규 필드 추가 시 전체 config 타입을 함께 갱신해야 한다. "인기/최근" 표시가 실시간 랭킹이 아닌 수동 큐레이션이라는 한계가 있다 — Static Export 특성상 불가피한 트레이드오프.

---

### ADR-010: AWS EC2 + Nginx 배포
**결정**: AWS EC2 인스턴스에 Nginx로 정적 파일(`out/`)을 직접 서빙한다.
**이유**: 프로젝트 요건에 명시된 배포 방식. Static Export 산출물이 순수 정적 파일이라 별도 Node 런타임 없이 Nginx만으로 충분하다.
**트레이드오프**: Vercel의 자동 CDN/이미지 최적화/프리뷰 배포 등은 직접 구성해야 한다.

---

### ADR-011: 면책조항(Disclaimer)을 공통 컴포넌트로 강제
**결정**: `medical`/`legal`/`financial` 성격의 모든 툴은 공통 `components/ui/DisclaimerBanner.tsx`를 통해서만 면책 문구를 노출한다. 툴 컴포넌트에 문구를 직접 하드코딩하지 않는다.
**이유**: 법규/문구가 바뀔 때 컴포넌트 하나만 수정하면 전체 툴에 일괄 반영된다. `disclaimerType`이 config에 있어 신규 툴 추가 시 이 검토를 빠뜨릴 수 없게 강제한다(profile v2 Section 6-2, 신규 툴 추가 시 매번 반복되는 체크 항목).
**트레이드오프**: BAC Calculator처럼 표준 문구를 넘어서는 예외적 UX 규칙(profile v2 Section 13-5)은 공통 컴포넌트만으로 부족해 툴 컴포넌트 내부에 별도 고정 로직을 추가해야 한다 — 이는 의도적 예외로 문서화한다.

---

### ADR-012: Schema.org 구조화 데이터를 전용 컴포넌트로 분리
**결정**: `components/seo/` 하위에 `SchemaWebApplication`, `SchemaFaqPage`, `SchemaBreadcrumb` 컴포넌트를 두고, 각 툴 페이지에서 `tools-config.ts` 데이터를 props로 넘겨 JSON-LD를 렌더링한다.
**이유**: AI Overview 인용 확률과 인용 시 클릭률을 높이는 통제 가능한 유일한 요소이므로(profile v2 Section 5-3) 모든 툴 페이지에 빠짐없이 적용되어야 한다. 전용 컴포넌트로 분리하면 페이지 코드에서 실수로 빠뜨릴 위험이 줄어든다.
**트레이드오프**: 툴마다 FAQ 콘텐츠를 config에 구조화해서 채워야 하므로 콘텐츠 작성 비용이 늘어난다(템플릿 치환 금지 원칙과 결합).

---

### ADR-013: CMP(쿠키 동의)는 무료 서드파티 스크립트로 구현
**결정**: 자체 구현 대신 무료 서드파티 CMP(예: CookieYes 무료 티어)를 `<script>` 삽입 방식으로 연동해 Google Consent Mode v2를 적용한다.
**이유**: GDPR 등 법규가 바뀔 때 벤더가 업데이트를 배포하므로 직접 유지보수 부담이 없다. Static Export 환경에서는 서버 사이드 연동이 필요 없는 스크립트 삽입형 벤더가 구조적으로 잘 맞는다.
**트레이드오프**: 서드파티 스크립트가 추가되어 초기 로드 성능(Core Web Vitals)에 소폭 영향을 줄 수 있다 — Lazy Load 및 동의 배너 렌더링 우선순위 조정으로 완화한다.

---

### ADR-014: BAC Calculator 전용 안전장치를 config로 끌 수 없게 하드코딩
**결정**: BAC Calculator는 표준 `DisclaimerBanner` 외에 상시 노출 경고 배너, "안전/운전 가능" 암시 표현 금지 등을 `components/tools/bac-calculator/` 내부에 고정 로직으로 구현하고, `tools-config.ts`의 `disclaimerType` 값과 무관하게 항상 적용한다.
**이유**: 음주운전 판단으로 오인될 경우 일반 medical disclaimer 수준을 넘어서는 실질적 법적/안전 리스크가 있다(하네스 재세팅 논의에서 확정, profile v2 Section 13-5). 설정 값 하나로 끌 수 있으면 실수로 비활성화될 위험이 있어 의도적으로 컴포넌트에 고정한다.
**트레이드오프**: 다른 툴과 달리 "config만 바꾸면 끝"이라는 컴포넌트 격리 원칙(ADR-011)의 예외가 된다 — YMYL 안전 문제이므로 일관성보다 안전을 우선한 의도적 예외.
