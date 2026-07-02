# Step 1: i18n-foundation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` (국제화(i18n) 섹션)
- `/docs/ADR.md` (ADR-007: next-intl, `localePrefix: 'as-needed'`)
- `/docs/PRD.md`
- `src/` 전체 디렉토리 구조와 `next.config.mjs`, `tsconfig.json` (Step 0 산출물 — 반드시 먼저 읽고 기존 설정과 충돌하지 않게 작업하라)

## 작업

### 1. next-intl 설치

```bash
npm install next-intl
```

### 2. Locale 라우팅 설정 (Static Export, middleware 없음)

**핵심 제약**: `next.config.mjs`에 `output: 'export'`가 설정되어 있으므로 Next.js middleware는 요청 시점에 실행되지 않는다. `middleware.ts`를 만들지 말고, next-intl의 **정적 렌더링(static rendering) 모드**로 설정하라 — locale 세그먼트는 `app/[locale]/`로 두고 `generateStaticParams`가 `['en', 'ko']`를 반환하도록 구성한다.

**요구 동작 (as-needed prefix와 동등한 결과)**:
- EN(기본 언어)은 URL에 `/ko` 같은 prefix가 없다: `/`, `/developer/json-formatter`
- KO만 prefix가 붙는다: `/ko`, `/ko/developer/json-formatter`

정확한 next-intl 설정 API(예: `routing.ts`의 `localePrefix` 옵션, `next.config.mjs`의 `createNextIntlPlugin` 연동 방식 등)는 설치된 next-intl 버전의 공식 "Static rendering with output: export" 가이드를 따르되, 위 두 가지 요구 동작(prefix 없는 EN 기본값, `/ko` prefix, middleware 미사용)을 반드시 만족해야 한다. next-intl이 output:'export'와 완전히 호환되지 않는 특정 기능(예: 요청 헤더 기반 자동 감지)이 있다면 사용하지 말고, 정적 생성 가능한 방식만 사용하라.

파일 위치 제안 (정확한 파일명/구조는 next-intl 버전에 맞게 조정 가능):
- `src/i18n/routing.ts` — locales, defaultLocale, localePrefix 정의
- `src/i18n/request.ts` — 서버 컴포넌트에서 메시지 로드
- `src/app/[locale]/layout.tsx` — `NextIntlClientProvider`로 감싸는 locale 레이아웃, `generateStaticParams` 포함, locale 파라미터가 `['en','ko']`에 없으면 `notFound()` 호출

### 3. 루트 레이아웃

`src/app/layout.tsx` — 최소 골격만 작성한다 (html/body 태그, 폰트 설정). 실제 헤더/푸터/콘텐츠는 `app/[locale]/layout.tsx`에서 렌더링한다.

### 4. 번역 메시지 파일

`src/lib/i18n/messages/en.json`, `src/lib/i18n/messages/ko.json`을 아래 네임스페이스로 생성한다. **문구는 기계 번역을 그대로 넣지 말고 자연스러운 문장으로 직접 작성하라** (CLAUDE.md 규칙 9, 얇은/저품질 콘텐츠 판정 리스크 방지):

```
common: { siteName, tagline }
nav: { home, developer, travel, beer, baby, languageSwitch }
footer: { privacyPolicy, terms, about, contact, copyright }
disclaimer: {
  general: "...",
  medical: "...",
  legal: "...",
  financial: "..."
}
```

`disclaimer.*` 문구는 `BitKitTools-project-profile-v2.md` Section 6-2의 유형별 문구 방향을 참고해 실제 사용 가능한 완성 문장으로 작성한다 (다음 step에서 만들 `DisclaimerBanner`가 이 키를 그대로 사용한다).

### 5. 공통 페이지 골격

- `src/app/[locale]/loading.tsx` — 최소 로딩 UI
- `src/app/[locale]/not-found.tsx` — 최소 404 UI

## Acceptance Criteria

```bash
npm run build   # /와 /ko 양쪽 경로가 out/ 에 정적 생성되는지 확인 (out/index.html, out/ko/index.html 등)
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `npm run build` 후 `out/` 디렉토리를 확인해 EN 경로에는 prefix가 없고 KO 경로에만 `/ko/`가 붙어 생성되는지 확인한다.
3. `middleware.ts` 파일이 존재하지 않는지 확인한다.
4. `disclaimer.*` 메시지가 en.json/ko.json 양쪽에 실제 문장으로 채워져 있는지(placeholder 문자열이 아닌지) 확인한다.
5. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "next-intl as-needed locale 라우팅(middleware 없음) 설정 완료. app/[locale]/layout.tsx, messages/en.json·ko.json(disclaimer 문구 포함) 생성."`
   - 실패/blocked 처리는 Step 0과 동일한 기준을 따른다.

## 금지사항

- `middleware.ts`를 만들지 마라. 이유: `output: 'export'`에서는 middleware가 동작하지 않는다 — 만들어도 배포 시 무시되거나 빌드 경고가 발생한다.
- KO에도 `/en/` 같은 별도 prefix를 붙이거나, 반대로 EN에도 prefix를 붙이지 마라. 이유: `BitKitTools-project-profile-v2.md` v2.1 개정 사항(as-needed 정책)과 `docs/ADR.md` ADR-007을 위반한다.
- `disclaimer.*` 메시지를 영어 원문을 한국어 자리에 그대로 복붙하거나 빈 문자열로 두지 마라. 이유: 다음 step 이후 여러 툴이 이 문구에 의존하며, 얇은 콘텐츠는 SEO/AdSense 리스크다.
- 실제 홈페이지나 툴 페이지 콘텐츠를 만들지 마라 — 이후 step 범위.
- 기존 테스트를 깨뜨리지 마라.
