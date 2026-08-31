/**
 * generate-tool-research-spec.ts
 *
 * Module (not a standalone CLI script — no main()) for identifying new tool
 * candidates from unmatched GSC queries and generating spec text via the
 * Anthropic API.
 *
 * Orchestration is handled by the weekly-report integration (step 5).
 *
 * Design:
 *   1. selectToolResearchCandidates — async function that filters recurring
 *      unmatched queries by SGE risk (rules first, AI batch for unknowns),
 *      applies proposal tracking to skip already-pending candidates, and
 *      returns the top MAX_TOOL_RESEARCH_SPECS_PER_WEEK candidates.
 *   2. generateToolResearchSpec — async function that calls the Anthropic API
 *      and returns the generated spec text for one candidate.
 *   3. selectNewCategoryCandidate — pure function that checks whether the
 *      recurring queries not consumed by tool research suggest a new category.
 *   4. generateNewCategorySpec — async function that asks the AI to assess
 *      whether a new category is warranted; returns null when the AI says
 *      there is not enough evidence ("NONE" sentinel in the response).
 *
 * Rules:
 *   - NEVER call the API once per query — always batch.
 *   - The SGE risk AI call is fire-and-forget soft-fail: any error results in
 *     'high' (exclude) to avoid proposing zero-click tool candidates.
 *   - The new-category AI call is allowed to return null — do not force a
 *     category proposal on every run.
 */

import type { ProposalLog } from './lib/proposalTracking'
import { findPendingProposal, findRejectedProposal, weeksPending } from './lib/proposalTracking'
import type { UnmatchedQuery, SgeRiskPatterns } from './lib/toolResearchMatching'
import { classifySgeRiskByRules } from './lib/toolResearchMatching'
import { extractAnthropicText, isTruncated } from './lib/anthropicResponse'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum number of tool research specs generated per weekly run. */
export const MAX_TOOL_RESEARCH_SPECS_PER_WEEK = 2

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'

/**
 * Sentinel returned by the AI when it decides a new category is not warranted.
 * The spec text produced by generateNewCategorySpec will be parsed for this
 * sentinel before returning to the caller.
 */
const NEW_CATEGORY_NONE_SENTINEL = 'NONE'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToolResearchCandidate {
  /** The recurring unmatched query that triggered this candidate */
  query: string
  /** Total impressions for this query (summed across pages/countries/devices) */
  impressions: number
  /** Human-readable evidence string — used verbatim in the spec body and prompt */
  evidence: string
}

export interface NewCategoryCandidate {
  /** Recurring queries not consumed by tool research that may signal a new category */
  queries: string[]
  /** Human-readable evidence string */
  evidence: string
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Batch-classifies queries whose rule-based SGE risk is 'unknown'.
 * Sends all queries in a single API call. Fails soft to 'high' on any error —
 * this is intentionally conservative: if we can't classify a query, we exclude
 * it from tool research rather than proposing a potentially zero-click tool.
 *
 * Returns a Map<query, 'low' | 'high'>.
 */
async function classifyUnknownSgeRisks(
  queries: string[],
  apiKey: string
): Promise<Map<string, 'low' | 'high'>> {
  if (queries.length === 0) {
    return new Map()
  }

  const numbered = queries.map((q, i) => `${i + 1}. ${q}`).join('\n')

  const prompt = `You are an SEO analyst assessing whether search queries could be answered directly by Google's AI Overview (zero-click risk), or whether they require interactive tools that AI cannot replace.

Classify each query below as either:
- low  (the query requires an interactive tool — AI Overview cannot fully replace it; the query is a good candidate for a new calculator/utility)
- high (AI Overview can directly answer this query with a text snippet, so adding a tool page would get very few clicks)

Queries:
${numbered}

Respond with ONLY a JSON object mapping each query string (exactly as given) to its classification ("low" or "high"). No explanation, no markdown, no extra text — just the JSON object.
Example format: {"query text here": "low", "another query": "high"}`

  let rawText: string
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '(unreadable)')
      console.error(
        `[generate-tool-research-spec] SGE risk API error ${response.status}: ${errorText}`
      )
      return buildHighRiskMap(queries)
    }

    const json = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
    rawText = extractAnthropicText(json)
  } catch (err) {
    console.error('[generate-tool-research-spec] Network error classifying SGE risks:', err)
    return buildHighRiskMap(queries)
  }

  const match = rawText.match(/\{[\s\S]*\}/)
  if (!match) {
    console.error(
      '[generate-tool-research-spec] Could not find JSON in SGE risk response:',
      rawText
    )
    return buildHighRiskMap(queries)
  }

  let parsed: Record<string, string>
  try {
    parsed = JSON.parse(match[0]) as Record<string, string>
  } catch (err) {
    console.error('[generate-tool-research-spec] Failed to parse SGE risk JSON:', err)
    return buildHighRiskMap(queries)
  }

  const result = new Map<string, 'low' | 'high'>()
  for (const query of queries) {
    const raw = parsed[query]
    if (raw === 'low' || raw === 'high') {
      result.set(query, raw)
    } else {
      // Unknown value → conservative exclusion
      result.set(query, 'high')
    }
  }
  return result
}

function buildHighRiskMap(queries: string[]): Map<string, 'high'> {
  const map = new Map<string, 'high'>()
  for (const q of queries) {
    map.set(q, 'high')
  }
  return map
}

function reminderString(query: string, proposals: ProposalLog, asOf: Date): string {
  const entry = findPendingProposal(proposals, 'tool-research', query)
  if (!entry) return `신규 툴 리서치 spec 대기 중: ${query}`
  const weeks = weeksPending(entry, asOf)
  return `신규 툴 리서치 spec 대기 중: "${query}" (${weeks}주째 pending, 첫 제안: ${entry.firstProposedAt})`
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Selects up to MAX_TOOL_RESEARCH_SPECS_PER_WEEK tool research candidates from
 * recurring unmatched queries.
 *
 * Flow:
 *   1. Look up impressions for each recurring query from latestUnmatched.
 *   2. Apply classifySgeRiskByRules: 'high' → exclude, 'low' → candidate,
 *      'unknown' → collect for batch AI call.
 *   3. Batch AI call for 'unknown' queries → 'low' → candidates, else excluded.
 *   4. Proposal tracking: already-pending queries → reminders.
 *   5. Cap at MAX_TOOL_RESEARCH_SPECS_PER_WEEK.
 *
 * Returns { candidates, reminders }. Reminders are informational strings
 * included in the weekly report to keep track of pending proposals.
 *
 * @param recurringQueries  Queries that appeared in 2+ consecutive weeks of
 *                          unmatched query history (pre-computed by caller).
 * @param latestUnmatched   The most recent week's unmatched queries with
 *                          impression counts (for evidence strings).
 * @param patterns          SGE risk patterns loaded from sge-risk-patterns.json.
 * @param proposals         Current proposal log (for dedup checking).
 * @param asOf              Current date (never call new Date() internally).
 * @param apiKey            Anthropic API key.
 */
export async function selectToolResearchCandidates(
  recurringQueries: string[],
  latestUnmatched: UnmatchedQuery[],
  patterns: SgeRiskPatterns,
  proposals: ProposalLog,
  asOf: Date,
  apiKey: string
): Promise<{ candidates: ToolResearchCandidate[]; reminders: string[] }> {
  if (recurringQueries.length === 0) {
    return { candidates: [], reminders: [] }
  }

  // Build impression lookup from the latest week's data
  const impressionLookup = new Map<string, number>()
  for (const uq of latestUnmatched) {
    impressionLookup.set(uq.query, uq.impressions)
  }

  // Stage 1: rule-based SGE risk classification
  const lowRisk: string[] = []
  const unknownRisk: string[] = []

  for (const query of recurringQueries) {
    const risk = classifySgeRiskByRules(query, patterns)
    if (risk === 'high') {
      // Exclude — AI Overview will eat these
      continue
    } else if (risk === 'low') {
      lowRisk.push(query)
    } else {
      unknownRisk.push(query)
    }
  }

  // Stage 2: batch AI call for 'unknown' queries
  const aiRiskMap = await classifyUnknownSgeRisks(unknownRisk, apiKey)
  for (const [query, risk] of aiRiskMap) {
    if (risk === 'low') {
      lowRisk.push(query)
    }
    // 'high' → excluded (already not in lowRisk)
  }

  // Stage 3: proposal tracking dedup
  const candidates: ToolResearchCandidate[] = []
  const reminders: string[] = []

  for (const query of lowRisk) {
    const isPending = !!findPendingProposal(proposals, 'tool-research', query)
    if (isPending) {
      reminders.push(reminderString(query, proposals, asOf))
      continue
    }

    // Rejected proposals are suppressed silently (no reminder) — see
    // generate-improvement-spec.ts for the same pattern and rationale.
    const isRejected = !!findRejectedProposal(proposals, 'tool-research', query)
    if (isRejected) continue

    const impressions = impressionLookup.get(query) ?? 0
    const evidence = `2주 이상 연속으로 기존 tool과 매칭되지 않는 GSC 쿼리 (최근 노출수: ${impressions})`
    candidates.push({ query, impressions, evidence })
  }

  // Stage 4: cap at MAX_TOOL_RESEARCH_SPECS_PER_WEEK
  return {
    candidates: candidates.slice(0, MAX_TOOL_RESEARCH_SPECS_PER_WEEK),
    reminders,
  }
}

/**
 * Calls the Anthropic API to generate a tool research spec for one candidate.
 *
 * The spec follows the same structure as docs/screens/{tool-name}.md — it is
 * a design proposal for a potential new tool, not an implementation commit.
 *
 * @param candidate  - The tool research candidate
 * @param historyMd  - Full contents of data/history.md (may be empty string)
 * @param apiKey     - Anthropic API key (ANTHROPIC_API_KEY)
 * @returns          The generated spec as a Markdown string
 * @throws           On network errors or non-OK HTTP status
 */
export async function generateToolResearchSpec(
  candidate: ToolResearchCandidate,
  historyMd: string,
  apiKey: string
): Promise<string> {
  const historySection = historyMd.trim()
    ? `## 과거 이력 (이미 시도한 접근을 반복 제안하지 않기 위한 참고)\n\n${historyMd}`
    : '## 과거 이력\n\n(아직 이력 없음)'

  const prompt = `당신은 BitKitTools.com의 SEO/콘텐츠 전문가입니다.
아래 데이터를 바탕으로 신규 툴 추가를 검토하기 위한 리서치 spec을 작성하세요.
이 spec은 docs/screens/{툴명}.md와 동일한 구조로 작성하되, 구현 지시가 아니라 **기획 제안** 수준입니다.

## 신규 툴 후보 신호

- 검색 쿼리: "${candidate.query}"
- 근거: ${candidate.evidence}

${historySection}

---

위 데이터를 바탕으로 아래 항목을 포함한 신규 툴 리서치 spec을 한국어 마크다운으로 작성하세요:

1. **툴 개요**: 이 쿼리가 의미하는 사용자 니즈와 제안할 툴의 핵심 기능
2. **카테고리 판단**: developer / travel / beer / baby 중 어디에 속하는지와 그 이유
3. **AI 대체 저항력 평가**: 이 툴이 AI Overview로 대체되기 어려운 이유 (또는 위험 요소)
4. **경쟁사 분석**: 유사한 도구가 이미 있는지, 있다면 차별화 포인트는 무엇인지
5. **CPC/트래픽 전망**: 이 쿼리 및 관련 키워드의 예상 수요 (정성적 판단 수준)
6. **구현 복잡도**: 외부 API 없이 순수 클라이언트 계산으로 구현 가능한지
7. **disclaimerType 권고**: none / general / medical / financial / legal 중 하나
8. **키워드 자기잠식 위험**: 기존 툴과 타깃 키워드가 겹치는지
9. **권고 결론**: 추가 진행 / 보류 / 기각 + 이유

근거를 명시할 수 없는 제안은 포함하지 마세요.
과거 이력에 이미 검토한 방향은 반복 제안하지 마세요.`

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_API_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '(unreadable)')
    throw new Error(
      `[generate-tool-research-spec] Anthropic API error ${response.status}: ${errorText}`
    )
  }

  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
    stop_reason?: string
  }
  const text = extractAnthropicText(json)

  if (!text.trim()) {
    throw new Error(
      `[generate-tool-research-spec] Anthropic API returned empty response for query: ${candidate.query}`
    )
  }

  if (isTruncated(json)) {
    // A truncated spec is worse than no spec — see generate-improvement-spec.ts
    // for the full rationale. Throw so safeRunStep() drops this candidate
    // instead of publishing broken content into the weekly report.
    throw new Error(
      `[generate-tool-research-spec] Anthropic response was cut off by max_tokens for query "${candidate.query}" — refusing to return a truncated spec.`
    )
  }

  return text
}

/**
 * Selects a new category candidate from recurring queries not already consumed
 * by tool research.
 *
 * A new category is warranted only when there are recurring queries that don't
 * fit any of the four existing categories (developer / travel / beer / baby).
 * Rather than programmatically clustering queries, we pass the full list to the
 * AI in generateNewCategorySpec and let it decide.
 *
 * Proposal tracking dedup: the target key is the sorted, joined query list —
 * deterministic regardless of the order in which queries were discovered.
 *
 * @param recurringQueries       All recurring unmatched queries this week.
 * @param consumedByToolResearch Queries already selected as tool research candidates.
 * @param proposals              Current proposal log.
 * @param asOf                   Current date.
 * @returns                      A NewCategoryCandidate, or null when there is
 *                               nothing to propose.
 */
export function selectNewCategoryCandidate(
  recurringQueries: string[],
  consumedByToolResearch: string[],
  proposals: ProposalLog,
  _asOf: Date
): NewCategoryCandidate | null {
  const consumedSet = new Set(consumedByToolResearch)
  const remaining = recurringQueries.filter((q) => !consumedSet.has(q))

  if (remaining.length === 0) {
    return null
  }

  // Deterministic target key for proposal tracking
  const target = remaining.slice().sort().join('|')

  const isPending = !!findPendingProposal(proposals, 'new-category', target)
  if (isPending) {
    return null
  }

  const isRejected = !!findRejectedProposal(proposals, 'new-category', target)
  if (isRejected) {
    return null
  }

  const evidence = `${remaining.length}개의 기존 카테고리 외 반복 쿼리: ${remaining.map((q) => `"${q}"`).join(', ')}`
  return { queries: remaining, evidence }
}

// ── Exported Pure Helper (for testability) ─────────────────────────────────────

/**
 * Parses the raw AI response from generateNewCategorySpec.
 *
 * The prompt instructs the AI to return the sentinel string "NONE" (inside any
 * surrounding text) when it judges that the evidence is insufficient to propose
 * a new category. This is a pure function so it can be unit-tested independently
 * of the API call.
 *
 * @param rawText  Raw text response from the Anthropic API.
 * @returns        The spec text, or null when the sentinel is detected.
 */
export function parseNewCategorySpecResponse(rawText: string): string | null {
  // Check for the sentinel — case-insensitive, allows surrounding whitespace
  const sentinelPattern = new RegExp(
    `(^|\\s|:)${NEW_CATEGORY_NONE_SENTINEL}(\\s|$|\\.)`,
    'i'
  )
  if (sentinelPattern.test(rawText.trim())) {
    return null
  }
  const trimmed = rawText.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Calls the Anthropic API to assess whether a new category is warranted, and
 * generates the spec text if so.
 *
 * The prompt explicitly instructs the AI to respond with the sentinel "NONE"
 * when the queries do not constitute enough evidence for a new category —
 * preventing forced proposals on every run.
 *
 * @param candidate  - The new category candidate with query list and evidence
 * @param historyMd  - Full contents of data/history.md (may be empty string)
 * @param apiKey     - Anthropic API key (ANTHROPIC_API_KEY)
 * @returns          The generated spec as a Markdown string, or null when the
 *                   AI decides there is insufficient evidence for a new category.
 * @throws           On network errors or non-OK HTTP status
 */
export async function generateNewCategorySpec(
  candidate: NewCategoryCandidate,
  historyMd: string,
  apiKey: string
): Promise<string | null> {
  const historySection = historyMd.trim()
    ? `## 과거 이력 (이미 시도한 접근을 반복 제안하지 않기 위한 참고)\n\n${historyMd}`
    : '## 과거 이력\n\n(아직 이력 없음)'

  const queriesList = candidate.queries.map((q) => `- "${q}"`).join('\n')

  const prompt = `당신은 BitKitTools.com의 SEO/콘텐츠 전문가입니다.
BitKitTools.com은 현재 네 가지 카테고리를 운영 중입니다: developer, travel, beer, baby.

아래 검색 쿼리들은 GSC에서 2주 이상 연속으로 노출됐지만 기존 어떤 카테고리에도 속하지 않는 것들입니다.
이 쿼리들이 **완전히 새로운 카테고리**를 추가해야 할 만큼 충분한 근거가 되는지 판단하세요.

## 반복 노출 쿼리 목록

${queriesList}

${historySection}

---

**매우 중요**: 새로운 카테고리를 제안할 만한 근거가 충분하지 않다고 판단하면,
응답 전체를 반드시 다음 한 단어로만 작성하세요:

NONE

근거가 충분하다고 판단하면, 아래 항목을 포함한 신규 카테고리 spec을 한국어 마크다운으로 작성하세요:

1. **카테고리 이름 제안**: slug(영어 소문자, 하이픈)와 표시명(EN/KO)
2. **카테고리 정의**: 이 카테고리가 다루는 사용자 니즈와 범위
3. **근거 쿼리 분석**: 위 쿼리들이 이 카테고리를 지지하는 방식
4. **기존 카테고리와의 차별성**: 왜 기존 4개 카테고리에 넣을 수 없는지
5. **초기 툴 후보**: 이 카테고리에서 먼저 만들 수 있는 툴 2~3가지
6. **트래픽/CPC 전망**: 이 카테고리의 예상 수요 (정성적 판단)
7. **리스크**: YMYL 여부, 법적 리스크, AI 대체 위험 등

억지로 카테고리를 만들지 마세요. 쿼리가 너무 적거나 응집력이 없으면 NONE을 반환하세요.`

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_API_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '(unreadable)')
    throw new Error(
      `[generate-tool-research-spec] New category API error ${response.status}: ${errorText}`
    )
  }

  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
    stop_reason?: string
  }
  const text = extractAnthropicText(json)

  if (!text.trim()) {
    throw new Error(
      '[generate-tool-research-spec] Anthropic API returned empty response for new category spec'
    )
  }

  if (isTruncated(json)) {
    // A truncated spec is worse than no spec — see generate-improvement-spec.ts
    // for the full rationale. Throw so safeRunStep() drops this candidate
    // instead of publishing broken content into the weekly report.
    throw new Error(
      '[generate-tool-research-spec] Anthropic response was cut off by max_tokens for new category spec — refusing to return a truncated spec.'
    )
  }

  return parseNewCategorySpecResponse(text)
}
