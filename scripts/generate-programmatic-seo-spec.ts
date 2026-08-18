/**
 * generate-programmatic-seo-spec.ts
 *
 * Module for identifying programmatic SEO variant pages from unmatched GSC
 * queries that are near-misses of existing tools (same domain, different
 * direction/format/variant), and generating differentiated spec text via the
 * Anthropic API.
 *
 * Orchestration is handled by the weekly-report integration (step 5).
 *
 * Design:
 *   1. findNearMissQueries — pure function that identifies unmatched queries
 *      with significant but incomplete token overlap with existing tool keywords.
 *      "Significant" = >= NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO.
 *      "Incomplete" = < 1.0 (all tokens matched would be a synonym, not a variant).
 *   2. selectProgrammaticSeoCandidates — pure function that applies proposal
 *      tracking dedup and returns candidates / reminders.
 *   3. draftProgrammaticSeoVariant — async, calls the Anthropic API with the
 *      related tool's existing content, instructing it to produce differentiated
 *      title/description/FAQ content.
 *   4. draftAndValidateVariant — wraps step 3 with the similarity guardrail.
 *      Retries once with explicit "differentiate more" feedback. Returns null
 *      if both attempts fail the guardrail — this is normal, not an error.
 *   5. generateProgrammaticSeoSpec — async, produces the final spec Markdown
 *      for a candidate whose draft has passed the guardrail.
 *
 * Rules:
 *   - Similarity guardrail runs on the AI-generated draft, NOT on the idea.
 *   - Retry is capped at 1 attempt (2 total). On second failure → null (skip).
 *   - Proposal tracking uses type 'programmatic-seo', target = variantQuery string.
 *   - Never create real API call tests.
 */

import type { ToolConfig, LocalizedText } from '../src/types/tool'
import type { UnmatchedQuery } from './lib/toolResearchMatching'
import type { ProposalLog } from './lib/proposalTracking'
import { findPendingProposal, weeksPending } from './lib/proposalTracking'
import { passesSimilarityGuardrail } from './lib/checkPageSimilarity'
import { extractAnthropicText, isTruncated } from './lib/anthropicResponse'

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Minimum fraction of a query's word tokens that must appear in a tool's
 * keyword/title vocabulary for the query to be considered a near-miss of
 * that tool.
 *
 * 0.5 means at least half of the query's tokens must be present in the tool's
 * vocabulary — indicating the query is clearly in the same domain as the tool.
 */
export const NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO = 0.5

/**
 * A query is excluded from near-miss candidates when ALL its tokens appear in
 * the tool's vocabulary (overlap ratio == 1.0). Such a query is a near-synonym
 * of the existing tool, not a meaningful standalone variant.
 *
 * The condition for a near-miss is:
 *   NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO <= overlap < NEAR_MISS_MAX_TOKEN_OVERLAP_RATIO
 */
const NEAR_MISS_MAX_TOKEN_OVERLAP_RATIO = 1.0

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProgrammaticSeoCandidate {
  /** The unmatched GSC query that is a near-miss of an existing tool. */
  variantQuery: string
  /** The existing tool this query most closely resembles. */
  relatedTool: ToolConfig
  /** Human-readable evidence string — used verbatim in prompts and spec bodies. */
  evidence: string
}

export interface ProgrammaticSeoDraft {
  /** Differentiated page title for the variant. */
  title: LocalizedText
  /** Differentiated page description for the variant. */
  description: LocalizedText
  /**
   * FAQ topic highlights (EN) that distinguish this variant from the related tool.
   * Used for the similarity guardrail check and as seed content for the final spec.
   */
  faqHighlights: string[]
}

// ── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Builds a Set of lowercase word tokens from a tool's English keywords and title.
 * Tokens shorter than 2 characters are excluded to reduce noise (e.g. "a", "I").
 */
function buildToolTokenSet(tool: ToolConfig): Set<string> {
  const tokens = new Set<string>()
  for (const kw of tool.keywords.en) {
    for (const word of kw.toLowerCase().split(/\s+/)) {
      if (word.length >= 2) tokens.add(word)
    }
  }
  for (const word of tool.title.en.toLowerCase().split(/\s+/)) {
    if (word.length >= 2) tokens.add(word)
  }
  return tokens
}

/**
 * Computes the fraction of `queryTokens` that appear in `toolTokens`.
 * Returns a value in [0, 1].
 */
function computeTokenOverlap(queryTokens: string[], toolTokens: Set<string>): number {
  if (queryTokens.length === 0) return 0
  const matchCount = queryTokens.filter((t) => toolTokens.has(t)).length
  return matchCount / queryTokens.length
}

/**
 * Serializes a ProgrammaticSeoDraft to a single string for similarity comparison.
 * Concatenates title, description, and FAQ highlights so the guardrail considers
 * all content dimensions.
 */
function draftToText(draft: ProgrammaticSeoDraft): string {
  return [draft.title.en, draft.description.en, draft.faqHighlights.join(' ')].join(' ')
}

/**
 * Serializes a ToolConfig's content to a single string for similarity comparison.
 * Mirrors draftToText so the comparison uses equivalent content dimensions.
 */
function toolToText(tool: ToolConfig): string {
  const faqText = tool.faq.map((f) => `${f.question.en} ${f.answer.en}`).join(' ')
  return [tool.title.en, tool.description.en, faqText].join(' ')
}

function reminderString(variantQuery: string, proposals: ProposalLog, asOf: Date): string {
  const entry = findPendingProposal(proposals, 'programmatic-seo', variantQuery)
  if (!entry) return `프로그래머틱 SEO spec 대기 중: ${variantQuery}`
  const weeks = weeksPending(entry, asOf)
  return `프로그래머틱 SEO spec 대기 중: "${variantQuery}" (${weeks}주째 pending, 첫 제안: ${entry.firstProposedAt})`
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Finds unmatched GSC queries that are near-misses of existing tools.
 *
 * Near-miss definition: a query where a significant fraction of its word tokens
 * (>= NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO) exist in a tool's keyword/title
 * vocabulary, but not ALL tokens match (< 1.0 overlap ratio). This captures
 * "same domain, different direction/format/variant" queries — the exact kind
 * of content that benefits from programmatic SEO variant pages.
 *
 * Exclusions:
 * - Overlap < MIN: too different to be a variant — handled by step 3 (new tools).
 * - Overlap == 1.0: all tokens match the tool vocab — near-synonym, not a variant.
 * - Queries with no meaningful tokens (all tokens < 2 chars after filtering).
 *
 * For each query, only the tool with the highest token overlap is considered —
 * a single query maps to at most one related tool.
 *
 * Results are returned in the same order as `unmatchedQueries` (impressions
 * descending, as guaranteed by the caller's preprocessing).
 */
export function findNearMissQueries(
  unmatchedQueries: UnmatchedQuery[],
  tools: ToolConfig[]
): ProgrammaticSeoCandidate[] {
  if (tools.length === 0 || unmatchedQueries.length === 0) {
    return []
  }

  // Pre-compute token sets for all tools (avoid rebuilding on every query)
  const toolTokenSets = tools.map((tool) => ({
    tool,
    tokens: buildToolTokenSet(tool),
  }))

  const candidates: ProgrammaticSeoCandidate[] = []

  for (const uq of unmatchedQueries) {
    const queryTokens = uq.query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2)

    if (queryTokens.length === 0) continue

    let bestOverlap = 0
    let bestTool: ToolConfig | null = null

    for (const { tool, tokens } of toolTokenSets) {
      const overlap = computeTokenOverlap(queryTokens, tokens)
      if (overlap > bestOverlap) {
        bestOverlap = overlap
        bestTool = tool
      }
    }

    if (
      bestTool !== null &&
      bestOverlap >= NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO &&
      bestOverlap < NEAR_MISS_MAX_TOKEN_OVERLAP_RATIO
    ) {
      candidates.push({
        variantQuery: uq.query,
        relatedTool: bestTool,
        evidence: `기존 "${bestTool.title.en}" 툴과 ${Math.round(bestOverlap * 100)}% 토큰 겹침 (노출수: ${uq.impressions})`,
      })
    }
  }

  return candidates
}

/**
 * Applies proposal tracking dedup to near-miss candidates.
 *
 * Near-misses with an existing pending proposal become reminders (the weekly
 * report reminds the team that the proposal is still outstanding). New
 * near-misses become actionable candidates.
 *
 * @param unmatchedQueries  Latest week's unmatched queries (impression-sorted).
 * @param tools             All ToolConfig entries from tools-config.ts.
 * @param proposals         Current proposal log (for dedup checking).
 * @param asOf              Current date (never call new Date() internally).
 * @returns                 { candidates, reminders }
 */
export function selectProgrammaticSeoCandidates(
  unmatchedQueries: UnmatchedQuery[],
  tools: ToolConfig[],
  proposals: ProposalLog,
  asOf: Date
): { candidates: ProgrammaticSeoCandidate[]; reminders: string[] } {
  const nearMisses = findNearMissQueries(unmatchedQueries, tools)

  const candidates: ProgrammaticSeoCandidate[] = []
  const reminders: string[] = []

  for (const candidate of nearMisses) {
    const isPending = !!findPendingProposal(
      proposals,
      'programmatic-seo',
      candidate.variantQuery
    )
    if (isPending) {
      reminders.push(reminderString(candidate.variantQuery, proposals, asOf))
      continue
    }
    candidates.push(candidate)
  }

  return { candidates, reminders }
}

/**
 * Calls the Anthropic API to draft differentiated content for a programmatic
 * SEO variant page.
 *
 * The prompt explicitly provides the related tool's existing title, description,
 * and FAQ, with explicit instructions NOT to just swap labels. The AI must
 * produce content that reflects the specific use context of the variant query.
 *
 * @throws On network errors or non-OK HTTP status.
 */
export async function draftProgrammaticSeoVariant(
  candidate: ProgrammaticSeoCandidate,
  apiKey: string
): Promise<ProgrammaticSeoDraft> {
  const { relatedTool, variantQuery, evidence } = candidate

  const existingFaqText =
    relatedTool.faq.length > 0
      ? relatedTool.faq
          .map((f, i) => `Q${i + 1}: ${f.question.en}\nA: ${f.answer.en}`)
          .join('\n\n')
      : '(없음)'

  const prompt = `당신은 BitKitTools.com의 SEO/콘텐츠 전문가입니다.
아래 기존 툴과 관련된 검색 쿼리에 대한 프로그래머틱 SEO 변형 페이지 콘텐츠를 기획하세요.

## 기존 툴 (이것과 달라야 합니다 — 라벨만 바꾸는 것은 절대 금지)

- 제목(EN): ${relatedTool.title.en}
- 제목(KO): ${relatedTool.title.ko}
- 설명(EN): ${relatedTool.description.en}
- 설명(KO): ${relatedTool.description.ko}
- 기존 FAQ:
${existingFaqText}

## 대상 쿼리

"${variantQuery}"

## 근거

${evidence}

---

**핵심 지시**: 기존 툴 제목/설명/FAQ를 라벨만 바꿔 복붙하지 마세요.
이 쿼리를 검색하는 사용자의 고유한 니즈와 맥락을 파악해 완전히 다른 콘텐츠를 만드세요.
같은 단어가 두 페이지에 반복되면 검색엔진에서 중복 콘텐츠로 처리됩니다.

다음 JSON 형식으로만 응답하세요 (마크다운 없이, 순수 JSON만):

{
  "title": { "en": "...", "ko": "..." },
  "description": { "en": "...", "ko": "..." },
  "faqHighlights": ["차별화 FAQ 주제 1 (영어)", "차별화 FAQ 주제 2 (영어)", "차별화 FAQ 주제 3 (영어)"]
}

faqHighlights는 기존 툴과 명확히 다른, 이 변형 쿼리만의 고유한 사용 맥락을 반영한 FAQ 주제여야 합니다.`

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
    throw new Error(
      `[generate-programmatic-seo-spec] Anthropic API error ${response.status}: ${errorText}`
    )
  }

  const json = (await response.json()) as { content?: Array<{ type: string; text?: string }> }
  const rawText = extractAnthropicText(json)

  const match = rawText.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error(
      `[generate-programmatic-seo-spec] Could not find JSON in draft response for query: "${variantQuery}"`
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch (err) {
    throw new Error(
      `[generate-programmatic-seo-spec] Failed to parse draft JSON for query: "${variantQuery}": ${String(err)}`
    )
  }

  const p = parsed as Record<string, unknown>
  const title = p['title'] as LocalizedText | undefined
  const description = p['description'] as LocalizedText | undefined
  const faqHighlights = p['faqHighlights'] as string[] | undefined

  if (
    !title?.en ||
    !title?.ko ||
    !description?.en ||
    !description?.ko ||
    !Array.isArray(faqHighlights) ||
    faqHighlights.length === 0
  ) {
    throw new Error(
      `[generate-programmatic-seo-spec] Invalid or incomplete draft structure for query: "${variantQuery}"`
    )
  }

  return { title, description, faqHighlights }
}

/**
 * Drafts a programmatic SEO variant and validates it against the similarity
 * guardrail (70% Jaccard threshold by default).
 *
 * Flow:
 *   Attempt 1: Generate initial draft.
 *   → If guardrail passes: return the draft.
 *   → If guardrail fails: retry with an explicit "differentiate more" note in
 *     the evidence string (which is included verbatim in the prompt).
 *   Attempt 2: Generate retry draft.
 *   → If guardrail passes: return the draft.
 *   → If guardrail fails: return null (skip this candidate — normal behavior).
 *
 * Returning null is a normal outcome — not every near-miss query warrants a
 * new page. The caller should continue to the next candidate.
 *
 * @throws On API network/HTTP errors. Does NOT throw on guardrail failures.
 */
export async function draftAndValidateVariant(
  candidate: ProgrammaticSeoCandidate,
  apiKey: string
): Promise<ProgrammaticSeoDraft | null> {
  const existingText = toolToText(candidate.relatedTool)

  // Attempt 1: initial draft
  const draft1 = await draftProgrammaticSeoVariant(candidate, apiKey)
  if (passesSimilarityGuardrail(draftToText(draft1), existingText)) {
    return draft1
  }

  // Attempt 2: retry with differentiation feedback injected into evidence
  const retryCandidate: ProgrammaticSeoCandidate = {
    ...candidate,
    evidence:
      candidate.evidence +
      ' [재시도: 첫 번째 초안이 기존 툴과 너무 유사했습니다(Jaccard ≥ 0.7). ' +
      '이번에는 완전히 다른 사용 맥락, 다른 어휘, 이 쿼리에만 고유한 FAQ를 만드세요.]',
  }
  const draft2 = await draftProgrammaticSeoVariant(retryCandidate, apiKey)
  if (passesSimilarityGuardrail(draftToText(draft2), existingText)) {
    return draft2
  }

  // Both attempts failed the guardrail — skip this candidate
  return null
}

/**
 * Calls the Anthropic API to generate the final programmatic SEO spec Markdown
 * for a candidate whose draft has already passed the similarity guardrail.
 *
 * The spec follows the same structure as docs/screens/{tool-name}.md —
 * it is a design proposal, not an implementation commit.
 *
 * @throws On network errors or non-OK HTTP status.
 */
export async function generateProgrammaticSeoSpec(
  candidate: ProgrammaticSeoCandidate,
  draft: ProgrammaticSeoDraft,
  apiKey: string
): Promise<string> {
  const faqList = draft.faqHighlights.map((q, i) => `${i + 1}. ${q}`).join('\n')

  const prompt = `당신은 BitKitTools.com의 SEO/콘텐츠 전문가입니다.
아래 데이터를 바탕으로 프로그래머틱 SEO 변형 페이지의 최종 spec을 한국어 마크다운으로 작성하세요.
이 spec은 docs/screens/{툴명}.md와 동일한 구조로, 구현 지시가 아닌 **기획 제안** 수준입니다.

## 대상 쿼리

"${candidate.variantQuery}"

## 연관 툴 (이미 존재하는 유사 툴)

- 제목(EN): ${candidate.relatedTool.title.en}
- 카테고리: ${candidate.relatedTool.category}
- 근거: ${candidate.evidence}

## 유사도 검증 통과 차별화 초안

- 제목(EN): ${draft.title.en}
- 제목(KO): ${draft.title.ko}
- 설명(EN): ${draft.description.en}
- 설명(KO): ${draft.description.ko}
- 차별화 FAQ 주제:
${faqList}

---

위 데이터를 바탕으로 아래 항목을 포함한 프로그래머틱 SEO 변형 페이지 spec을 작성하세요:

1. **페이지 개요**: 이 변형 쿼리가 커버하는 사용자 니즈와 기존 툴과의 차이점
2. **URL 제안**: slug (예: /developer/png-to-jpg-converter)
3. **타이틀 및 설명**: 검증된 차별화 초안 기반
4. **이 페이지만의 차별화 콘텐츠**: 기존 툴과 다른 사용 맥락, 차별화 FAQ 3개(초안 기반으로 확장), 예시 시나리오
5. **구현 판단**: 별도 페이지로 만들 가치가 있는지 판단 (새 페이지 vs 기존 툴에 기능 추가 vs 기각) + 이유
6. **disclaimerType 권고**: none / general / medical / financial / legal 중 하나 + 이유
7. **키워드 자기잠식 위험**: 기존 연관 툴과 타깃 키워드 겹침 분석

각 항목에 근거를 명시하고, 기존 툴과의 차별화 포인트를 명확히 서술하세요.
라벨만 바꾼 복붙 내용을 포함하지 마세요.`

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
      `[generate-programmatic-seo-spec] Anthropic API error ${response.status}: ${errorText}`
    )
  }

  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
    stop_reason?: string
  }
  const text = extractAnthropicText(json)

  if (!text.trim()) {
    throw new Error(
      `[generate-programmatic-seo-spec] Anthropic API returned empty response for query: "${candidate.variantQuery}"`
    )
  }

  if (isTruncated(json)) {
    console.warn(
      `[generate-programmatic-seo-spec] Anthropic response was cut off by max_tokens for "${candidate.variantQuery}" — spec may be incomplete.`
    )
  }

  return text
}
