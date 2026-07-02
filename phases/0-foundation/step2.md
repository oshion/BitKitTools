# Step 2: tools-config-schema

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` (CRITICAL 규칙 9번: Configuration-driven 툴 관리)
- `/docs/ARCHITECTURE.md` (`tools-config.ts` 스키마 섹션 — 이 step의 핵심 근거)
- `/docs/PRD.md` (MVP 8개 툴 표 — 어떤 값이 최종적으로 채워질지 파악)
- `/docs/ADR.md` (ADR-009)
- `src/i18n/`, `src/lib/i18n/messages/*.json`, `src/app/[locale]/layout.tsx` (Step 1 산출물)

## 작업

### 1. 타입 정의 (`src/types/tool.ts`)

`docs/ARCHITECTURE.md`의 `tools-config.ts` 스키마 섹션에 정의된 타입을 그대로 옮긴다:

```ts
export type DisclaimerType = 'none' | 'general' | 'medical' | 'financial' | 'legal'
export type AiOverviewResistance = 'high' | 'medium' | 'low'
export type ToolStatus = 'testing' | 'validated' | 'underperforming'
export type SchemaType = 'WebApplication'
export type ToolCategory = 'developer' | 'travel' | 'beer' | 'baby'

export type AdSlotConfig = {
  position: 'header' | 'result' | 'mid-content' | 'above-faq' | 'footer'
  minHeightPx: number
}

export type LocalizedText = { en: string; ko: string }

export type ToolFaqItem = {
  question: LocalizedText
  answer: LocalizedText
}

export type ToolConfig = {
  id: string
  slug: string
  category: ToolCategory
  title: LocalizedText
  description: LocalizedText
  keywords: { en: string[]; ko: string[] }
  schemaType: SchemaType
  faq: ToolFaqItem[]
  relatedToolIds: string[]
  adSlots: AdSlotConfig[]
  ogImage: string
  status: ToolStatus
  disclaimerType: DisclaimerType
  aiOverviewResistance: AiOverviewResistance
  addedAt: string
  popular: boolean
}
```

`any` 사용 금지. 값이 없을 수 있는 필드는 옵셔널(`?`)이 아니라 명시적으로 필요한 필드만 정의한다(스키마상 전부 필수 — 위 그대로).

### 2. `src/lib/config/tools-config.ts`

```ts
export const toolsConfig: ToolConfig[] = []

export function getToolBySlug(category: ToolCategory, slug: string): ToolConfig | undefined
export function getToolsByCategory(category: ToolCategory): ToolConfig[]
export function getPopularTools(): ToolConfig[]
export function getRecentTools(limit: number): ToolConfig[]  // addedAt 내림차순 정렬 후 limit개 반환
export function getRelatedTools(toolId: string): ToolConfig[]  // 해당 툴의 relatedToolIds를 실제 ToolConfig[]로 변환. 존재하지 않는 id는 조용히 건너뛴다(에러 throw 금지)
export const TOOL_CATEGORIES: ToolCategory[]  // ['developer', 'travel', 'beer', 'baby']
```

배열이 비어 있는 현재 상태에서도 위 함수들은 에러 없이 빈 배열/`undefined`를 반환해야 한다 — 이후 `1-mvp-tools` task의 각 tool step이 이 배열에 항목을 하나씩 추가하면, 홈/카테고리/관련 툴 UI가 자동으로 채워지는 구조다(재작업 없이).

### 3. 단위 테스트 (`src/lib/config/tools-config.test.ts`)

- `toolsConfig`가 빈 배열인 현재 상태에서 `getToolsByCategory('developer')`가 빈 배열을 반환하는지
- `getRelatedTools('nonexistent-id')`가 에러 없이 빈 배열을 반환하는지
- `getRecentTools(3)`이 3개 이하를 반환하며 `addedAt` 내림차순인지 (테스트용 목 데이터를 테스트 파일 내부에서만 임시로 사용 — `tools-config.ts` 자체는 건드리지 않는다)

## Acceptance Criteria

```bash
npm run build
npm run lint
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/types/tool.ts`에 `any` 타입이 없는지 확인한다.
3. `src/lib/config/tools-config.ts`의 헬퍼 함수들이 빈 배열 상태에서도 안전하게 동작하는지 테스트로 확인한다.
4. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "ToolConfig 등 타입 정의(src/types/tool.ts) 및 lib/config/tools-config.ts 헬퍼 함수(getToolBySlug/getToolsByCategory/getPopularTools/getRecentTools/getRelatedTools) 완료. toolsConfig는 빈 배열."`
   - 실패/blocked 처리는 Step 0과 동일한 기준을 따른다.

## 금지사항

- MVP 8개 툴의 실제 메타데이터(title/description/faq/adSlots 등)를 이 step에서 채우지 마라. 이유: 각 툴은 `1-mvp-tools` task에서 자기 완결적으로 자신의 config 항목을 추가해야 컴포넌트/툴 격리 원칙(CLAUDE.md 규칙 8)에 맞는다 — 이 step은 스키마(타입)와 헬퍼 함수만 담당한다.
- `getRelatedTools`나 다른 헬퍼 함수에서 존재하지 않는 id에 대해 에러를 throw하지 마라. 이유: 툴이 하나씩 순차적으로 추가되는 개발 과정에서, 아직 추가되지 않은 관련 툴 id를 참조해도 페이지가 깨지면 안 된다.
- `any` 타입을 사용하지 마라.
