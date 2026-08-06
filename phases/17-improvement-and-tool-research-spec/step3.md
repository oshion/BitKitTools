# Step 3: tool-research-and-category-spec

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`
- `/bitkittools-ai-automation-roadmap.md`의 "Phase 4" 섹션 4번·5번 항목 — **특히 4번 항목의 "근거는 GSC 쿼리 데이터로 한정" 노트를 반드시 읽어라.** 이 phase는 Google Trends 등 외부 트렌드 스크래핑을 쓰지 않기로 확정했다(2026-08 세션) — 이미 수집 중인 GSC 쿼리 데이터만으로 후보를 판단한다.
- `/src/lib/config/tools-config.ts`, `/src/types/tool.ts`(`ToolConfig`, `ToolCategory` — 현재 4개 카테고리 값)
- `/scripts/process-analytics.ts`의 `ProcessedQuery`
- 이전 step 산출물: `/scripts/lib/proposalTracking.ts`
- `/scripts/lib/classifyIntent.ts` — 기존에 이미 "규칙 기반 우선 + AI는 애매한 경우만 배치로" 패턴이 구현돼 있다. 이번 스텝의 SGE 위험 분류도 동일한 구조(규칙 사전 필터 → 애매한 것만 배치 1회 AI 호출)로 만들어라 — 새로운 패턴을 발명하지 마라.

## 배경 — 이 스텝이 판단해야 할 두 가지 신호

1. **신규 tool 후보**: 우리 사이트에 노출은 되지만(=GSC에 데이터가 있지만) 기존 tool의 keywords/title 어디에도 매칭되지 않는 쿼리 — "우리가 다루지 않는 세부 의도"의 신호
2. **신규 카테고리 후보**: 1의 쿼리들 중 기존 4개 카테고리(개발자/맥주/여행/육아) 어디에도 자연스럽게 속하지 않는 것들이 **2주 연속** 나타나는 경우

둘 다 "한 주치 데이터만으로 판단하지 않는다"는 원칙 때문에, 이 스텝은 자체 롤링 이력 파일(`data/processed/unmatched-query-history.json`)을 별도로 만든다 — `top-pages-history.json`과 같은 패턴이지만 페이지가 아니라 "매칭 안 되는 쿼리 텍스트"를 기록한다는 점이 다르다.

## 작업

### 1. `data/reference/sge-risk-patterns.json` (정적 데이터)

```json
{
  "source": "AI Overview(SGE)가 직접 답을 보여줘 클릭이 거의 발생하지 않는 것으로 알려진 검색 의도 패턴 — 공식 통계가 아닌 SEO 커뮤니티에서 통상적으로 언급되는 경향. 정확도가 검증된 수치는 아니다.",
  "collectedAt": "2026-08-06",
  "zeroClickPatterns": ["unit convert", "단위 변환", "hex to decimal", "진법 변환", "base64 decode", "base64 디코드", "hash decode", "해시 디코드", "what is", "이란", "definition"],
  "interactionNeededPatterns": ["upload", "업로드", "compare files", "파일 비교", "batch", "일괄", "download", "다운로드"]
}
```
목록은 시작점이며 완결된 목록이 아님을 `source`에 명시하라.

### 2. `scripts/lib/unmatchedQueryHistory.ts` (`topPagesHistory.ts`와 동일 패턴)

```typescript
export interface WeeklyUnmatchedQueriesPoint {
  weekStart: string
  queries: string[]  // 이번 주 매칭 안 된 쿼리 텍스트 목록(노출 최소치 이상만)
}
export interface UnmatchedQueryHistory { weeks: WeeklyUnmatchedQueriesPoint[] }

export function readUnmatchedQueryHistory(filePath?: string): UnmatchedQueryHistory
export function writeUnmatchedQueryHistory(history: UnmatchedQueryHistory, filePath?: string): void
export function appendUnmatchedQueriesPoint(history: UnmatchedQueryHistory, point: WeeklyUnmatchedQueriesPoint): UnmatchedQueryHistory  // 같은 weekStart면 교체, 최대 12주
/** 최근 minConsecutiveWeeks(기본 2)주 연속으로 등장한 쿼리만 반환 */
export function findRecurringQueries(history: UnmatchedQueryHistory, minConsecutiveWeeks?: number): string[]
```

### 3. `scripts/lib/toolResearchMatching.ts`

```typescript
import type { ToolConfig } from '../../src/types/tool'

export interface UnmatchedQuery {
  query: string
  impressions: number
}

/**
 * toolsConfig의 모든 tool의 keywords.en/keywords.ko/title.en/title.ko를 토큰화해
 * 하나의 집합으로 만들고, 이 집합과 겹치지 않는(정확한 알고리즘은 구현 시 판단 —
 * 단순 부분 문자열 포함 검사로 시작해도 된다) 쿼리만 "매칭 안 됨"으로 분류한다.
 * minImpressions(기본 10) 미만인 쿼리는 애초에 제외한다.
 */
export function findUnmatchedQueries(
  queries: ProcessedQuery[],
  tools: ToolConfig[],
  minImpressions?: number
): UnmatchedQuery[]

export interface SgeRiskPatterns {
  zeroClickPatterns: string[]
  interactionNeededPatterns: string[]
}

/** 규칙 목록으로 1차 분류. 어느 목록에도 안 걸리면 'unknown' — 이건 다음 함수가 배치로 AI에 묻는다. */
export function classifySgeRiskByRules(query: string, patterns: SgeRiskPatterns): 'low' | 'high' | 'unknown'
```

### 4. `scripts/generate-tool-research-spec.ts`

```typescript
export interface ToolResearchCandidate {
  query: string
  impressions: number
  evidence: string
}

/**
 * findUnmatchedQueries + unmatchedQueryHistory 기록/조회 + findRecurringQueries로
 * "2주 연속 매칭 안 된 쿼리" 목록을 얻고, classifySgeRiskByRules로 1차 분류한다.
 * 'high'(zero-click 위험)는 후보에서 제외. 'unknown'은 배치로 한 번에 AI에 묻는다
 * (classifyIntent.ts의 배치 호출 패턴 재사용 — 쿼리 하나당 API 호출 금지).
 * 최종 'low' 위험 후보만 proposalTracking으로 중복 체크 후 상위
 * MAX_TOOL_RESEARCH_SPECS_PER_WEEK(2)개로 제한한다.
 */
export async function selectToolResearchCandidates(
  recurringQueries: string[],
  latestUnmatched: UnmatchedQuery[],
  patterns: SgeRiskPatterns,
  proposals: ProposalLog,
  asOf: Date,
  apiKey: string
): Promise<{ candidates: ToolResearchCandidate[]; reminders: string[] }>

/** docs/screens/{화면명}.md와 동일 구조의 spec 텍스트를 생성한다(실제 파일 생성 없음). */
export async function generateToolResearchSpec(
  candidate: ToolResearchCandidate,
  historyMd: string,
  apiKey: string
): Promise<string>

export interface NewCategoryCandidate {
  queries: string[]   // recurringQueries 중 신규 tool spec으로 이미 소화되지 않은 것들
  evidence: string
}

/**
 * recurringQueries에서 이번 주 selectToolResearchCandidates가 채택하지 않은 나머지를
 * 모아 하나의 후보로 만든다(정교한 군집화는 하지 않는다 — 쿼리 목록을 그대로 AI에
 * 전달해 "이게 하나의 카테고리로 묶일 만큼 응집력 있는가"까지 AI가 판단하게 한다).
 * proposalTracking 중복 체크 적용(target은 쿼리 목록을 정렬해 이어붙인 문자열 등
 * 결정론적으로 만든 키를 사용하라).
 */
export function selectNewCategoryCandidate(
  recurringQueries: string[],
  consumedByToolResearch: string[],
  proposals: ProposalLog,
  asOf: Date
): NewCategoryCandidate | null

/**
 * AI가 "카테고리로 제안할 근거가 부족하다"고 판단하면 null을 반환할 수 있게
 * 프롬프트에서 명시적으로 허용하라 — 매주 억지로 카테고리를 만들어내면 안 된다.
 * 응답 형식에 "제안 없음"을 나타내는 명확한 신호(예: 구분자 안에 "NONE")를 두고 파싱하라.
 */
export async function generateNewCategorySpec(
  candidate: NewCategoryCandidate,
  historyMd: string,
  apiKey: string
): Promise<string | null>
```

## Acceptance Criteria

```bash
npm run lint
npm test
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 단위 테스트 최소 케이스:
   - `findUnmatchedQueries`가 기존 tool 키워드와 매칭되는 쿼리를 정확히 제외하는지
   - `findRecurringQueries`가 1주만 나타난 쿼리는 제외하고 2주 연속만 반환하는지
   - `classifySgeRiskByRules`가 세 카테고리(low/high/unknown)를 정확히 분류하는지
   - `selectNewCategoryCandidate`가 recurringQueries가 비어있으면 `null`을 반환하는지
3. `generateNewCategorySpec`이 "제안 없음" 응답을 `null`로 정확히 파싱하는지 파싱 로직만 분리해 테스트한다.
4. 결과에 따라 `phases/17-improvement-and-tool-research-spec/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- Google Trends, 자동완성, People Also Ask 등 외부 스크래핑을 어떤 형태로도 추가하지 마라 — 이 phase는 GSC 데이터로 한정하기로 확정됐다.
- 쿼리 하나당 개별 AI 호출을 만들지 마라 — 애매한 쿼리는 반드시 배치로 한 번에 묻는다.
- `sge-risk-patterns.json`의 목록을 마치 검증된 통계인 것처럼 서술하지 마라.
- 신규 카테고리 제안을 매주 강제로 생성하지 마라 — 근거 부족 시 `null`을 반환할 수 있어야 한다.
- 기존 테스트를 깨뜨리지 마라.
