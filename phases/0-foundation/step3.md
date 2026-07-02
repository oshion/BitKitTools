# Step 3: shared-components

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (CRITICAL 규칙 8, 9, 14)
- `/docs/ARCHITECTURE.md` (컴포넌트 디렉토리 구조, 면책조항 시스템, SEO/Schema.org, 광고/CLS 방지 섹션)
- `/docs/UI_GUIDE.md` (색상, 컴포넌트, 광고 슬롯 규격, DisclaimerBanner 스타일 섹션 — 전부)
- `/docs/ADR.md` (ADR-011, ADR-012)
- `src/types/tool.ts`, `src/lib/config/tools-config.ts` (Step 2 산출물)
- `src/lib/i18n/messages/en.json`, `ko.json`의 `disclaimer.*`, `nav.*`, `footer.*` (Step 1 산출물)

이 step은 이후 모든 화면(홈, 8개 툴, 법적 페이지)이 재사용할 공통 컴포넌트를 만든다. 여기서 만드는 인터페이스가 이후 step들의 계약이 되므로 신중하게 설계하라.

## 작업

### 1. `components/ui/AdSlot.tsx`

```ts
type AdSlotProps = {
  position: AdSlotConfig['position']
  minHeightPx: number
}
```

`docs/UI_GUIDE.md`의 광고 슬롯 규격(위치별 min-height, 스켈레톤 스타일 `bg-neutral-900 border border-dashed border-neutral-800`)대로 플레이스홀더를 렌더링한다. **이 step에서는 실제 광고 스크립트를 연동하지 않는다** — 다음 step(`analytics-cmp-integration`)이 이 컴포넌트를 확장한다.

### 2. `components/ui/DisclaimerBanner.tsx`

```ts
type DisclaimerBannerProps = {
  disclaimerType: DisclaimerType
}
```

`disclaimerType`이 `'none'`이면 아무것도 렌더링하지 않는다. 그 외에는 `next-intl`의 `useTranslations('disclaimer')`로 해당 타입의 문구를 로드해 렌더링한다. `docs/UI_GUIDE.md`의 면책조항 배너 스타일(공통 베이스 + medical/legal/financial 톤)을 적용한다.

**주의**: BAC Calculator 전용 강화 경고 배너는 이 컴포넌트의 책임이 아니다 — `1-mvp-tools` task의 `tool-bac-calculator` step에서 별도 컴포넌트로 고정 구현한다(ADR-014). 이 컴포넌트를 그 용도로 확장하지 마라.

### 3. `components/seo/` — Schema.org JSON-LD 컴포넌트

```ts
// SchemaWebApplication.tsx
type SchemaWebApplicationProps = { tool: ToolConfig; locale: 'en' | 'ko'; url: string }

// SchemaFaqPage.tsx
type SchemaFaqPageProps = { faq: ToolFaqItem[]; locale: 'en' | 'ko' }

// SchemaBreadcrumb.tsx
type SchemaBreadcrumbProps = { items: Array<{ name: string; url: string }> }
```

각각 `<script type="application/ld+json">`으로 해당 Schema.org 타입의 JSON-LD를 렌더링한다.

### 4. `components/ui/ToolCard.tsx`, `components/ui/ToolCardGrid.tsx`

홈의 카테고리/Popular/Recently Added 섹션과, 모든 툴 페이지 하단의 "Related Tools" 섹션에서 공통으로 재사용할 컴포넌트다 (`docs/PRD.md` 핵심기능 1, `BitKitTools-project-profile-v2.md` Section 5-4).

```ts
// ToolCard.tsx
type ToolCardProps = { tool: ToolConfig; locale: 'en' | 'ko' }

// ToolCardGrid.tsx
type ToolCardGridProps = { tools: ToolConfig[]; locale: 'en' | 'ko'; emptyMessage?: string }
```

`tools`가 빈 배열이면 `emptyMessage`(옵션, 기본값 없으면 아무것도 렌더링 안 함)를 보여준다 — `tools-config.ts`가 아직 비어 있는 현재 상태에서도 홈 페이지가 깨지지 않아야 한다.

### 5. `components/layout/Header.tsx`, `Footer.tsx`, `Nav.tsx`

- `Nav.tsx`: `TOOL_CATEGORIES`(4개)를 순회해 카테고리 네비게이션 렌더링. 언어 전환(EN/KO) 링크 포함 — 현재 경로를 유지한 채 locale만 바꿔야 한다(as-needed prefix 규칙 반영: EN은 prefix 제거, KO는 `/ko` 추가).
- `Footer.tsx`: 카테고리 링크 + 법적 페이지 링크(`/privacy-policy`, `/terms`, `/about`, `/contact` — 아직 페이지가 없어도 링크는 미리 만들어둔다, Step 6에서 실제 페이지 생성) + 저작권.
- `Header.tsx`: 로고 + `Nav` 포함.

`docs/UI_GUIDE.md`의 레이아웃(max-w-5xl, 좌측 정렬)과 타이포그래피를 적용한다.

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 각 컴포넌트에 대한 렌더링 스모크 테스트(React Testing Library)를 작성했는지 확인한다:
   - `AdSlot`이 `minHeightPx`를 인라인 스타일 또는 클래스로 반영하는지
   - `DisclaimerBanner`가 `disclaimerType='none'`일 때 아무것도 렌더링하지 않는지, 그 외 타입일 때 해당 문구를 렌더링하는지
   - `ToolCardGrid`가 빈 배열일 때 크래시 없이 렌더링되는지
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "AdSlot/DisclaimerBanner/SEO Schema 컴포넌트(WebApplication/FAQPage/Breadcrumb)/ToolCard/ToolCardGrid/Header/Footer/Nav 생성 완료. 전부 tools-config 기반, 빈 배열 상태에서도 안전하게 렌더링됨."`
   - 실패/blocked 처리는 Step 0과 동일한 기준을 따른다.

## 금지사항

- `AdSlot`에 실제 광고 스크립트(`adsbygoogle` 등)를 삽입하지 마라. 이유: 그건 다음 step(`analytics-cmp-integration`)의 책임이며, 이 step은 레이아웃/플레이스홀더까지만 담당한다.
- `DisclaimerBanner`의 문구를 컴포넌트 코드에 하드코딩하지 마라. 이유: 반드시 `messages/{locale}.json`의 `disclaimer.*`에서 로드해야 법규 변경 시 한 곳만 고치면 된다(ADR-011).
- `components/tools/` 폴더나 실제 툴 컴포넌트를 만들지 마라. 이유: `1-mvp-tools` task의 범위다.
- `Header`/`Footer`/`Nav`에 카테고리·툴 목록을 하드코딩하지 마라 — 반드시 `tools-config.ts`(`TOOL_CATEGORIES`, `getToolsByCategory`)를 경유한다.
