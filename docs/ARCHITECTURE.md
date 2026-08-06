# Architecture

## 전제 조건

이 프로젝트는 **Next.js Static Export**(`output: 'export'`)로 빌드되어 AWS EC2 + Nginx에서 정적 파일로 서빙된다.
서버가 없으므로 `app/api/` 라우트 핸들러, 세션 인증, SSR/ISR, middleware 기반 언어 감지는 사용하지 않는다.

---

## 디렉토리 구조

```
src/
├── app/
│   ├── [locale]/                     ← next-intl 동적 세그먼트, as-needed prefix (en=기본, ko만 prefix)
│   │   ├── layout.tsx                 ← 헤더/푸터/광고 슬롯/CMP 스크립트 포함 공통 레이아웃
│   │   ├── page.tsx                   ← 홈 (카테고리별 카드 리스트, tools-config 기반)
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   ├── {category}/                ← developer | travel | beer | baby
│   │   │   ├── page.tsx               ← 카테고리 목록 페이지
│   │   │   └── {tool-slug}/
│   │   │       └── page.tsx           ← 개별 툴 페이지 (Server Component, generateMetadata로 SEO/Schema.org 생성)
│   │   ├── privacy-policy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   ├── layout.tsx                     ← 루트 레이아웃 (next-intl provider, 폰트)
│   ├── sitemap.ts                     ← sitemap.xml 자동 생성 (locale × tool 전체 URL)
│   ├── robots.ts
│   └── global-error.tsx               ← 루트 레이아웃 에러 ('use client')
├── components/
│   ├── ui/
│   │   ├── AdSlot.tsx                 ← 광고 플레이스홀더 (min-height 고정)
│   │   ├── DisclaimerBanner.tsx       ← disclaimerType별 면책 문구 공통 컴포넌트
│   │   └── ...버튼/카드/입력 등 공통 UI
│   ├── layout/                        ← 헤더, 푸터, 네비게이션 (tools-config 기반 동적 렌더링)
│   ├── seo/
│   │   ├── SchemaWebApplication.tsx   ← JSON-LD (WebApplication)
│   │   ├── SchemaFaqPage.tsx          ← JSON-LD (FAQPage)
│   │   └── SchemaBreadcrumb.tsx       ← JSON-LD (BreadcrumbList)
│   └── tools/
│       └── {tool-slug}/               ← 툴별 완전 독립 Client Component. 다른 tool 폴더 import 금지
├── hooks/                             ← useLocalStorage, useAnalyticsEvent 등 커스텀 훅
├── lib/
│   ├── config/
│   │   └── tools-config.ts            ← 전체 툴의 유일한 메타데이터 소스 (스키마는 아래 참고)
│   ├── api/                           ← (선택, 예외) 외부 공개 API 캡슐화. MVP 8종은 사용하지 않음
│   ├── i18n/                          ← next-intl 설정 + `messages/en.json`, `messages/ko.json`
│   └── utils/                         ← 툴별 순수 계산 로직 (예: calculateBac, calculatePercentile)
├── store/                             ← Zustand — 사이트 전역 UI 상태 전용 (다크모드 등). 툴 데이터 저장 금지
└── types/                             ← 타입 정의

public/
└── ads.txt                            ← 도메인 루트에 고정 배치 (locale 라우팅과 무관하게 항상 `/ads.txt`)
```

---

## `tools-config.ts` 스키마

`lib/config/tools-config.ts`가 홈/카테고리/사이트맵/RSS/관련 Tool/검색/SEO 메타데이터의 유일한 소스다.

```ts
export type DisclaimerType = 'none' | 'general' | 'medical' | 'financial' | 'legal'
export type AiOverviewResistance = 'high' | 'medium' | 'low'
export type ToolStatus = 'testing' | 'validated' | 'underperforming'
export type SchemaType = 'WebApplication'

export type AdSlotConfig = {
  position: 'header' | 'result' | 'mid-content' | 'above-faq' | 'footer'
  minHeightPx: number
}

export type ToolConfig = {
  id: string
  slug: string
  category: 'developer' | 'travel' | 'beer' | 'baby'
  title: { en: string; ko: string }
  description: { en: string; ko: string }
  keywords: { en: string[]; ko: string[] }
  schemaType: SchemaType
  faq: Array<{ question: { en: string; ko: string }; answer: { en: string; ko: string } }>
  relatedToolIds: string[]
  adSlots: AdSlotConfig[]
  ogImage: string
  status: ToolStatus
  disclaimerType: DisclaimerType
  aiOverviewResistance: AiOverviewResistance
  addedAt: string        // ISO date — "Recently Added" 정적 정렬용
  popular: boolean       // GA4 데이터 기반 수동 태깅 — "Popular Tools" 정적 표시용
}
```

**원칙:**
- `status`/`popular`/`addedAt`은 **런타임에 자동 계산되지 않는다.** GA4/GSC 월간 리뷰(profile v2 Section 11) 결과를 사람이 수동으로 반영하는 정적 필드다. Static Export는 서버가 없어 실시간 랭킹 계산이 불가능하기 때문.
- 새 툴 추가 = 이 배열에 항목 하나 + `components/tools/{slug}/` 폴더 하나. 그 외 홈/카테고리/사이트맵/RSS 코드는 수정하지 않는다.

---

## 데이터 흐름

```
Page (Server Component, [locale]/{category}/{tool-slug}/page.tsx)
  ↓ tools-config[slug] 조회 → generateMetadata (title/description/canonical/hreflang/OG/Schema.org)
  ↓ 렌더링
components/tools/{tool-slug}/*.tsx (Client Component)
  ↓ 사용자 입력
lib/utils/{tool-slug}.ts            ← 순수 계산 함수. fetch 없음
  ↓ 결과
화면에 즉시 렌더링 (서버 왕복 없음) + disclaimerType이 none이 아니면 <DisclaimerBanner> 렌더링
```

**예외 흐름 (실시간 외부 데이터가 반드시 필요한 극소수 툴, MVP 8종에는 해당 없음):**

```
components/tools/{tool-slug}/*.tsx (Client Component)
  ↓ 호출
lib/api/{도메인}.ts                  ← 공개 API(API 키 불필요) fetch 캡슐화, try/catch 필수
  ↓
외부 공개 API (client-side 직접 호출)
```

---

## 레이어 규칙

```
[Page (app/[locale]/...)]
    ↓ 호출 가능
[components/tools/{slug}/]   ← 해당 슬러그 폴더 내부에서만 서로 참조. 다른 slug 폴더 import 금지
[components/seo/]            ← Schema.org JSON-LD 렌더링 전용
[hooks/]                     ← 로컬 상태/이벤트, LocalStorage, analytics 이벤트 전송
[lib/utils/]                 ← 순수 계산 함수 (사이드이펙트 없음, fetch 금지)
[lib/config/]                ← tools-config 정적 데이터
[types/]                     ← 타입 정의
    ↓ 예외적으로만 호출 (실시간 데이터 필요 툴에 한함)
[lib/api/]                   ← 외부 공개 API fetch 캡슐화
```

**금지 사항:**
- `app/api/` 라우트 핸들러를 새로 만들지 않는다 (Static Export와 호환 불가).
- `components/tools/{slug-a}/`에서 `components/tools/{slug-b}/`를 import하지 않는다 — 컴포넌트 격리 원칙 위반.
- `store/`(Zustand)에 특정 툴의 계산 결과나 입력값을 저장하지 않는다.
- `lib/utils/`에서 `fetch`를 호출하지 않는다 — 순수 함수로 유지한다.
- `tools-config.ts`의 `title`/`description`/`faq`를 언어 간 기계 번역 그대로 복붙하지 않는다 — 검수된 자연스러운 문장이어야 한다 (profile v2 Section 3).

---

## 상태 관리

- **툴 내부 상태**: `useState` / `useReducer` — 각 툴 컴포넌트 내부에서만 유효
- **툴 입력값 영속화(선택)**: `hooks/useLocalStorage.ts` — 최근 사용 Tool/즐겨찾기/마지막 입력값. **개인정보처리방침에 고지 필수** (profile v2 Section 2)
- **사이트 전역 UI 상태**: Zustand — 다크모드 토글, 현재 locale 표시 등 툴과 무관한 값만
- **동의 상태(CMP)**: 서드파티 CMP 스크립트가 자체 관리 (Zustand로 미러링하지 않음)

**Zustand 사용 기준(엄격):** 여러 툴/레이아웃 컴포넌트가 공유하는 **사이트 차원** UI 상태만. 특정 툴의 계산 입력값/결과는 절대 넣지 않는다.

---

## 인증

없음.

---

## 국제화 (i18n)

- **라이브러리**: next-intl, **`localePrefix: 'as-needed'`**
- **URL 구조**: EN(기본) `/{category}/{tool-slug}` (prefix 없음), KO `/ko/{category}/{tool-slug}`
- **번역 리소스**: `lib/i18n/messages/en.json`, `lib/i18n/messages/ko.json`
- **SEO**: `generateMetadata`로 locale별 title/description 설정, `alternates.languages`로 hreflang + `x-default`(EN) 명시, canonical URL 자동 생성

---

## SEO / Schema.org

| 페이지 유형 | Schema | 컴포넌트 |
|---|---|---|
| 툴 페이지 | `WebApplication` | `components/seo/SchemaWebApplication.tsx` |
| FAQ 섹션 | `FAQPage` | `components/seo/SchemaFaqPage.tsx` |
| 전 페이지 탐색 경로 | `BreadcrumbList` | `components/seo/SchemaBreadcrumb.tsx` |

- `sitemap.xml`(`app/sitemap.ts`), `robots.txt`(`app/robots.ts`), `rss.xml`(빌드 타임 스크립트, `scripts/generate-rss.ts` — `tools-config.ts`의 `addedAt` 기준 최신순)은 전부 `tools-config.ts`에서 자동 생성한다.
- `ads.txt`는 locale 라우팅과 무관하게 `public/ads.txt`로 고정 배치해 항상 `도메인루트/ads.txt`로 서빙되게 한다.

---

## 면책조항(Disclaimer) 시스템

- `components/ui/DisclaimerBanner.tsx`는 `disclaimerType` prop(`medical`/`legal`/`financial`/`general`)에 따라 정해진 문구를 렌더링하는 **유일한** 면책 문구 컴포넌트다. 툴 컴포넌트에 문구를 직접 하드코딩하지 않는다.
- 문구 원본(EN/KO)은 `lib/i18n/messages/{locale}.json`의 `disclaimer.*` 네임스페이스에 둔다.
- **BAC Calculator 전용 추가 규칙**: 표준 `DisclaimerBanner` 외에 상시 노출 경고 배너, 통과/합격 암시 표현 금지 등 강화 규칙이 있다 (profile v2 Section 13-5). 이 규칙은 config로 끌 수 없도록 `components/tools/bac-calculator/` 내부에 고정 렌더링한다.

---

## 로딩 / 에러 처리

| 상황 | 처리 방식 |
|------|-----------|
| 페이지 전환 로딩 | `app/[locale]/loading.tsx` |
| 컴포넌트 단위 로딩 | `<Suspense fallback={...}>` |
| 예외 툴의 외부 fetch 실패 | 해당 툴 컴포넌트 내부에서 try/catch로 잡고 재시도 UI 표시 |
| 루트 레이아웃 에러 | `app/global-error.tsx` ('use client') |
| 404 | `app/[locale]/not-found.tsx` + `notFound()` 함수 |

---

## 외부 데이터 통신 규칙 (예외 케이스 전용)

MVP 8종 툴에는 해당 사항 없음.

- **프로토콜**: 공개 REST API (API 키 불필요, CORS 허용된 것만 사용)
- **호출 위치**: `lib/api/{도메인}.ts`에서 브라우저 직접 fetch
- **에러 처리**: 반드시 try/catch, 실패 시 해당 툴 UI 내에서 에러 상태 표시
- **금지**: API 키가 필요한 서비스는 사용하지 않는다

---

## 광고 / CLS 방지

- 모든 광고 삽입 지점은 `components/ui/AdSlot.tsx`를 통해서만 렌더링한다.
- 슬롯 위치 5곳: Header 아래 / Tool 결과 아래 / 본문 중간 / FAQ 위 / Footer 위 — 각각 `tools-config.ts`의 `adSlots`에서 `minHeightPx`를 읽어 고정 스켈레톤을 렌더링한다.
- 광고 스크립트는 Lazy Load로 삽입한다 (Core Web Vitals 저하 금지).

---

## Analytics

- GA4 + Google Search Console + Microsoft Clarity 스니펫을 루트 레이아웃에 CMP 동의 상태와 연동해 삽입한다 (동의 전에는 비개인화/미로딩).
- 커스텀 이벤트: `Tool Open`, `Calculate`, `Copy Result`, `Share` — `hooks/useAnalyticsEvent.ts`로 통일해 발행한다.

---

## ESLint 규칙 (기계적 강제)

### 필수 패키지

```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import
```

### `eslint.config.mjs` 설정

```js
{
  rules: {
    // 1. tools/{slug} 간 상호 import 금지 (컴포넌트 격리)
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['**/components/tools/*/*'],
          message: '다른 tool 폴더를 직접 import 금지. 공통 로직은 components/ui/ 또는 lib/utils/로 추출하라.',
        },
        // 2. lib/utils/에서 lib/api/ import 금지 (순수 함수 유지)
        {
          group: ['**/lib/api/*'],
          message: 'lib/utils/는 순수 함수여야 한다. 외부 fetch가 필요하면 컴포넌트에서 lib/api/를 직접 호출하라.',
        },
      ],
    }],

    // 3. any 타입 사용 금지
    '@typescript-eslint/no-explicit-any': 'error',

    // 4. 미사용 변수 금지
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
```

### 검증 커맨드

```bash
npm run lint
npm run lint --fix
```

### 각 규칙의 의도

| 규칙 | 막는 것 | 이유 |
|------|---------|------|
| `no-restricted-imports` (tools/*) | 툴 간 직접 import | 툴은 완전히 독립적이어야 새 툴 추가가 결합도 없이 가능하다 |
| `no-restricted-imports` (lib/api) | `lib/utils/`에서 fetch 호출 | 계산 로직은 순수해야 테스트가 쉽고, 외부 API 의존을 명시적으로 격리할 수 있다 |
| `no-explicit-any` | `any` 타입 | 타입 안전성 붕괴의 시작점 |
| `no-unused-vars` | 선언만 하고 안 쓰는 변수 | 불필요한 코드 누적 방지 |

---

## CI/CD 파이프라인

`.github/workflows/` 아래 4개 워크플로우가 서로 다른 트리거로 독립적으로 동작한다.

### 1. 배포 (`deploy.yml`)

**트리거**: `master`에 push (단 `data/**`, `phases/**`, `*.md`만 바뀐 커밋은 `paths-ignore`로 제외 — 데이터/문서 전용 커밋이 매번 불필요한 재배포를 유발하지 않도록).

```
master에 실제 코드 변경 push
  → npm run build
  → EC2로 rsync 배포 (-rlvz --delete, 속성 보존 안 함)
  → IndexNow에 변경 URL 알림 (notify-indexnow.ts)
  → GSC Sitemaps API로 sitemap 재제출 (notify-gsc-reindex.ts)
```

### 2. 코드 변경이 master로 들어가는 경로 — harness + PR 게이트

harness(`scripts/execute.py`)로 작업한 코드는 직접 master에 커밋되지 않고 PR을 거친다:

```
execute.py로 phase 실행 (feat-{phase} 브랜치에서 step별 작업)
  → 모든 step 완료 후 자동으로 push + `gh pr create`로 PR 생성 (master 대상)
  → PR 오픈 → test-gate.yml 트리거
  → lint / test / build / 깨진 링크 체커(scripts/check-broken-links.ts) / Lighthouse CI(정보성, 대표 5페이지)
  → 통과 시 `gh pr merge --auto --merge`로 건 auto-merge가 자동 병합 (사람 승인 불필요)
  → master 업데이트 → 위 1번(deploy.yml) 트리거
```

`master`에는 branch protection이 걸려 있어(`test-gate.yml`의 `test` job이 필수 상태 체크), 이 체크를 통과하지 못한 변경은 병합될 수 없다. `test-gate.yml`은 `pull_request` 이벤트에서만 트리거되므로, **PR을 거치지 않은 직접 push는 구조적으로 이 체크를 절대 받을 수 없어 차단된다**(관리자 권한으로 우회하지 않는 한).

### 3. 데이터 전용 봇 — 매일/매주 자동 실행 (`collect-data.yml`, `weekly-report.yml`)

코드가 아니라 `data/` 아래 JSON/MD 파일만 다루는 별개 흐름:

- **`collect-data.yml`** (매일 03:00 UTC): GA4/GSC/Clarity 수집 → raw→processed 가공 → GSC 색인 상태 체크 → `data/raw`, `data/processed`, `data/indexing-status.json` 커밋
- **`weekly-report.yml`** (매주 월요일 00:00 UTC): 운영 사이트 Lighthouse 감사 → Claude Sonnet으로 주간 리포트 생성 → 트래픽 정체 감지 시 전략 재검토 → Slack 발송 → `data/reports`, `data/history.md`, `data/processed/trend.json` 등 커밋

이 둘은 `data/**`만 건드리므로 1번(`deploy.yml`)을 트리거하지 않는다.

**이 두 봇은 PR을 거치지 않고 `GH_BOT_PAT`(저장소 관리자 소유 PAT, GitHub Secret)로 master에 직접 커밋한다** — branch protection을 의도적으로 우회하는 유일한 경로다. 이유와 트레이드오프는 [ADR.md](ADR.md) ADR-016 참고.

### 저장소 설정 (재현용)

- Settings → General → Pull Requests → **Allow auto-merge** 체크됨
- Settings → Branches → `master` 규칙: **Require status checks to pass before merging** → `test` 체크 필수 지정 (Require branches to be up to date는 미체크)
- `gh` CLI가 harness 실행 환경(로컬 PC)에 설치·인증되어 있어야 `execute.py`가 PR 생성/auto-merge를 걸 수 있음 (`gh auth status`로 확인)

---

## next.config 핵심 설정

```js
// next.config.mjs
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
}
export default nextConfig
```
