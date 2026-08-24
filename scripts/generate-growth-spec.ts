/**
 * generate-growth-spec.ts
 *
 * Module (not a standalone CLI script — no main()) for selecting growth spec
 * candidates from the top-pages history and generating spec text via the
 * Anthropic API.
 *
 * Orchestration is handled by the weekly-report integration (step 5).
 *
 * Design:
 *   1. selectGrowthCandidates — pure function that picks pages that have been
 *      top performers for at least minConsecutiveWeeks consecutive weeks,
 *      filtering out pages that already have a pending 'growth' proposal
 *      (those become reminder strings). No per-week cap — occurrence frequency
 *      is inherently low due to the multi-week consecutive requirement.
 *   2. generateGrowthSpec — async function that calls the Anthropic API
 *      and returns the generated spec text for one candidate.
 */

import type { TopPagesHistory } from './lib/topPagesHistory'
import { findConsecutiveTopPerformers } from './lib/topPagesHistory'
import type { ProposalLog } from './lib/proposalTracking'
import { findPendingProposal, findRejectedProposal, weeksPending } from './lib/proposalTracking'
import { extractAnthropicText, isTruncated } from './lib/anthropicResponse'

// ── Constants ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'

/**
 * Default minimum consecutive weeks a page must appear in the top performers
 * list before it qualifies as a growth spec candidate.
 *
 * Per the roadmap: "2~3주 이상 연속" → hoist 2 weeks as the lower bound.
 */
export const DEFAULT_MIN_CONSECUTIVE_WEEKS = 2

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GrowthSpecCandidate {
  /** URL path of the top-performing page to expand */
  page: string
  /** How many consecutive weeks this page has been in the top performers list */
  consecutiveWeeks: number
  /**
   * Human-readable evidence string: "최근 N주 연속 클릭 상위 페이지" + actual
   * click figures from history, used verbatim in the spec body and prompt.
   */
  evidence: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Counts how many consecutive trailing weeks a page appeared in the top list.
 * Iterates the history from newest to oldest and stops at the first week where
 * the page is absent.
 */
function countConsecutiveWeeks(history: TopPagesHistory, page: string): number {
  const weeks = history.weeks
  let count = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    const pageSet = new Set(weeks[i]!.pages.map((p) => p.page))
    if (pageSet.has(page)) {
      count++
    } else {
      break
    }
  }
  return count
}

/**
 * Builds the evidence string for a growth candidate.
 * Includes the consecutive week count and actual click figures from the most
 * recent minConsecutiveWeeks entries.
 */
function buildGrowthEvidence(
  history: TopPagesHistory,
  page: string,
  consecutiveWeeks: number
): string {
  const recentWeeks = history.weeks.slice(-consecutiveWeeks)
  const clickSummary = recentWeeks
    .map((w) => {
      const entry = w.pages.find((p) => p.page === page)
      return `${w.weekStart}: ${entry?.clicks ?? 0}클릭`
    })
    .join(', ')
  return `최근 ${consecutiveWeeks}주 연속 클릭 상위 페이지 (${clickSummary})`
}

function reminderString(page: string, proposals: ProposalLog, asOf: Date): string {
  const entry = findPendingProposal(proposals, 'growth', page)
  if (!entry) return `성장 spec 대기 중: ${page}`
  const weeks = weeksPending(entry, asOf)
  return `성장 spec 대기 중: ${page} (${weeks}주째 pending, 첫 제안: ${entry.firstProposedAt})`
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Selects growth spec candidates from the top-pages history.
 *
 * 1. Calls `findConsecutiveTopPerformers` with `minConsecutiveWeeks` (default 2).
 * 2. For each qualifying page, computes the actual consecutive week count and
 *    builds an evidence string with real click figures.
 * 3. Pages that already have a pending 'growth' proposal are placed in
 *    `reminders` instead of `candidates`.
 * 4. No per-week cap — occurrence frequency is inherently low.
 *
 * Returns `{ candidates: [], reminders: [] }` when no page meets the condition —
 * this is normal operation, not an error.
 */
export function selectGrowthCandidates(
  history: TopPagesHistory,
  proposals: ProposalLog,
  asOf: Date,
  minConsecutiveWeeks: number = DEFAULT_MIN_CONSECUTIVE_WEEKS
): { candidates: GrowthSpecCandidate[]; reminders: string[] } {
  const qualifyingPages = findConsecutiveTopPerformers(history, minConsecutiveWeeks)

  const candidates: GrowthSpecCandidate[] = []
  const reminders: string[] = []

  for (const page of qualifyingPages) {
    const isPending = !!findPendingProposal(proposals, 'growth', page)
    if (isPending) {
      reminders.push(reminderString(page, proposals, asOf))
      continue
    }

    // Rejected proposals are suppressed silently (no reminder) — see
    // generate-improvement-spec.ts for the same pattern and rationale.
    const isRejected = !!findRejectedProposal(proposals, 'growth', page)
    if (isRejected) continue

    const consecutiveWeeks = countConsecutiveWeeks(history, page)
    const evidence = buildGrowthEvidence(history, page, consecutiveWeeks)
    candidates.push({ page, consecutiveWeeks, evidence })
  }

  return { candidates, reminders }
}

// ── API Call ──────────────────────────────────────────────────────────────────

/**
 * Calls the Anthropic API to generate a growth spec for one candidate.
 *
 * The prompt instructs the model to produce an expansion spec — not a problem
 * fix, but an amplification of already-proven performance. Directions include:
 * splitting sub-keyword pages, strengthening internal links, adding FAQ/content.
 *
 * @param candidate  - The growth candidate to generate a spec for
 * @param historyMd  - Full contents of data/history.md (may be empty string)
 * @param apiKey     - Anthropic API key (ANTHROPIC_API_KEY)
 * @returns          The generated spec as a Markdown string
 * @throws           On network errors or non-OK HTTP status
 */
export async function generateGrowthSpec(
  candidate: GrowthSpecCandidate,
  historyMd: string,
  apiKey: string
): Promise<string> {
  const historySection = historyMd.trim()
    ? `## 과거 이력 (이미 시도한 접근을 반복 제안하지 않기 위한 참고)\n\n${historyMd}`
    : '## 과거 이력\n\n(아직 이력 없음)'

  const prompt = `당신은 BitKitTools.com의 SEO/콘텐츠 전문가입니다.
아래 데이터를 바탕으로 이미 검증된 고성과 페이지를 더 키우기 위한 확장 spec을 작성하세요.
이 spec은 문제를 고치는 게 아니라 **이미 잘 되는 성과를 증폭**하는 방향입니다.

## 고성과 대상 페이지

- 경로: ${candidate.page}
- 연속 상위 기록: ${candidate.consecutiveWeeks}주 연속 클릭 상위 페이지
- 근거 수치: ${candidate.evidence}

${historySection}

---

위 데이터를 바탕으로 아래 항목을 포함한 성장 확장 spec을 한국어 마크다운으로 작성하세요:

1. **현황 요약**: 왜 이 페이지가 확장 대상인지 (근거 수치 반드시 포함)
2. **확장 방향 제안**: 구체적인 성장 전략 (아래 중 해당하는 것 포함)
   - 관련 서브 키워드 전용 페이지 분리 제안 (URL slug + 타깃 키워드 포함)
   - 내부링크 강화 방안 (어떤 다른 페이지에서 이 페이지로 링크를 추가할지)
   - 콘텐츠/FAQ 보강 (추가할 섹션, 검색 의도를 더 잘 커버하는 FAQ 항목 예시)
   - 기타 SEO 강화 방안 (schema.org, hreflang, canonical 등)
3. **우선순위 제안**: 제안한 방향 중 가장 임팩트가 클 것으로 예상되는 순서와 이유
4. **기대 효과**: 어떤 지표가 어느 방향으로 움직일 것인지

근거를 명시할 수 없는 제안은 포함하지 마세요.
과거 이력에 이미 시도한 방향은 반복 제안하지 마세요.`

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
      `[generate-growth-spec] Anthropic API error ${response.status}: ${errorText}`
    )
  }

  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
    stop_reason?: string
  }
  const text = extractAnthropicText(json)

  if (!text.trim()) {
    throw new Error(
      '[generate-growth-spec] Anthropic API returned empty response for ' + candidate.page
    )
  }

  if (isTruncated(json)) {
    console.warn(
      `[generate-growth-spec] Anthropic response was cut off by max_tokens for ${candidate.page} — spec may be incomplete.`
    )
  }

  return text
}
