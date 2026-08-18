/**
 * generate-improvement-spec.ts
 *
 * Module (not a standalone CLI script — no main()) for selecting improvement
 * spec candidates and generating spec text via the Anthropic API.
 *
 * Orchestration is handled by the weekly-report integration (step 5).
 *
 * Design:
 *   1. selectImprovementCandidates — pure function that picks the strongest
 *      candidates from CTR anomalies + high-bounce pages, filtering out pages
 *      that already have a pending proposal (those become reminder strings).
 *   2. buildImprovementSpecPrompt — pure function that assembles the prompt
 *      text; exported separately so tests can verify content without calling
 *      the real API.
 *   3. generateImprovementSpec — async function that calls the Anthropic API
 *      and returns the generated spec text.
 */

import type { CtrAnomaly } from './lib/detectCtrAnomalies'
import type { HighBouncePage } from './lib/aggregateWeeklyReport'
import type { ProposalLog } from './lib/proposalTracking'
import { findPendingProposal, weeksPending } from './lib/proposalTracking'
import { extractAnthropicText, isTruncated } from './lib/anthropicResponse'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum number of improvement specs generated per weekly run. */
export const MAX_IMPROVEMENT_SPECS_PER_WEEK = 3

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImprovementSpecCandidate {
  /** URL path of the page to improve */
  page: string
  /** Short human-readable reason summary (e.g. "CTR이 벤치마크 대비 낮음") */
  reason: string
  /** Concrete evidence with actual numbers — used verbatim in spec body and prompt */
  evidence: string
}

/** Internal sorting weight: higher = stronger evidence */
type EvidenceStrength = 'ctr-both' | 'ctr-single' | 'bounce-only'

interface RawCandidate extends ImprovementSpecCandidate {
  strength: EvidenceStrength
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function strengthOrder(s: EvidenceStrength): number {
  switch (s) {
    case 'ctr-both':
      return 3
    case 'ctr-single':
      return 2
    case 'bounce-only':
      return 1
  }
}

function buildCtrEvidence(anomaly: CtrAnomaly): string {
  const ctrPct = (anomaly.ctr * 100).toFixed(1)
  const reasonLabels = anomaly.reasons
    .map((r) => (r === 'below-benchmark' ? '벤치마크 대비 낮음' : '사이트 내 하위 백분위'))
    .join(', ')
  return `쿼리 '${anomaly.query}': CTR ${ctrPct}% (${reasonLabels})`
}

function buildBounceEvidence(page: HighBouncePage): string {
  const bouncePct = (page.bounceRate * 100).toFixed(1)
  return `이탈률 ${bouncePct}%, ${page.sessions}세션`
}

function reminderString(page: string, proposals: ProposalLog, asOf: Date): string {
  const entry = findPendingProposal(proposals, 'improvement', page)
  if (!entry) return `개선 spec 대기 중: ${page}`
  const weeks = weeksPending(entry, asOf)
  return `개선 spec 대기 중: ${page} (${weeks}주째 pending, 첫 제안: ${entry.firstProposedAt})`
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Selects up to MAX_IMPROVEMENT_SPECS_PER_WEEK improvement candidates by:
 *
 * 1. Building candidate entries from CTR anomalies (grouped by page, taking
 *    the strongest signal per page) and high-bounce pages.
 * 2. Merging candidates for the same page (CTR + bounce overlap → strongest
 *    evidence wins, evidence strings combined).
 * 3. Filtering out pages that already have a pending proposal — those pages
 *    are placed in `reminders` instead.
 * 4. Sorting by evidence strength (both-filter CTR > single-filter CTR > bounce).
 * 5. Returning the top MAX_IMPROVEMENT_SPECS_PER_WEEK candidates and all
 *    reminder strings.
 *
 * Candidates with empty evidence are never emitted — this is guaranteed by
 * the buildXxxEvidence helpers always producing a non-empty string.
 */
export function selectImprovementCandidates(
  ctrAnomalies: CtrAnomaly[],
  bouncePages: HighBouncePage[],
  proposals: ProposalLog,
  asOf: Date
): { candidates: ImprovementSpecCandidate[]; reminders: string[] } {
  // ── Step 1: build raw candidates keyed by page ──────────────────────────────

  // Group CTR anomalies by page and pick strongest per page
  const ctrByPage = new Map<string, CtrAnomaly>()
  for (const anomaly of ctrAnomalies) {
    const existing = ctrByPage.get(anomaly.page)
    if (!existing || anomaly.reasons.length > existing.reasons.length) {
      ctrByPage.set(anomaly.page, anomaly)
    }
  }

  const rawByPage = new Map<string, RawCandidate>()

  // Add CTR-sourced candidates
  for (const [page, anomaly] of ctrByPage) {
    const evidence = buildCtrEvidence(anomaly)
    if (!evidence.trim()) continue // guard — should never be empty in practice

    const strength: EvidenceStrength =
      anomaly.reasons.length >= 2 ? 'ctr-both' : 'ctr-single'

    rawByPage.set(page, {
      page,
      reason: anomaly.reasons.length >= 2
        ? 'CTR이 벤치마크와 사이트 내 백분위 기준 모두 낮음'
        : 'CTR이 벤치마크 대비 낮음',
      evidence,
      strength,
    })
  }

  // Add bounce-sourced candidates (merge if page already exists from CTR)
  for (const bp of bouncePages) {
    const bounceEvidence = buildBounceEvidence(bp)
    if (!bounceEvidence.trim()) continue

    const existing = rawByPage.get(bp.path)
    if (existing) {
      // Combine evidence; keep stronger strength label (CTR always >= bounce)
      rawByPage.set(bp.path, {
        ...existing,
        reason: existing.reason + ' + 이탈률 높음',
        evidence: `${existing.evidence}; ${bounceEvidence}`,
      })
    } else {
      rawByPage.set(bp.path, {
        page: bp.path,
        reason: '이탈률이 높음',
        evidence: bounceEvidence,
        strength: 'bounce-only',
      })
    }
  }

  // ── Step 2: filter pending proposals → reminders ────────────────────────────

  const candidates: ImprovementSpecCandidate[] = []
  const reminders: string[] = []

  for (const raw of rawByPage.values()) {
    const isPending = !!findPendingProposal(proposals, 'improvement', raw.page)
    if (isPending) {
      reminders.push(reminderString(raw.page, proposals, asOf))
    } else {
      candidates.push({ page: raw.page, reason: raw.reason, evidence: raw.evidence })
    }
  }

  // ── Step 3: sort by evidence strength ──────────────────────────────────────

  // Reconstruct strength for sorting from rawByPage
  candidates.sort((a, b) => {
    const sa = strengthOrder(rawByPage.get(a.page)?.strength ?? 'bounce-only')
    const sb = strengthOrder(rawByPage.get(b.page)?.strength ?? 'bounce-only')
    return sb - sa
  })

  // ── Step 4: cap at MAX_IMPROVEMENT_SPECS_PER_WEEK ──────────────────────────

  return {
    candidates: candidates.slice(0, MAX_IMPROVEMENT_SPECS_PER_WEEK),
    reminders,
  }
}

// ── Prompt Builder (exported for testability) ─────────────────────────────────

/**
 * Assembles the Anthropic API prompt for a single improvement spec candidate.
 * Exported as a pure function so unit tests can verify content and structure
 * without making real API calls.
 *
 * @param candidate - The improvement candidate with page, reason, evidence
 * @param historyMd - Full contents of data/history.md (may be empty string)
 */
export function buildImprovementSpecPrompt(
  candidate: ImprovementSpecCandidate,
  historyMd: string
): string {
  const historySection = historyMd.trim()
    ? `## 과거 이력 (이미 시도한 접근을 반복 제안하지 않기 위한 참고)\n\n${historyMd}`
    : '## 과거 이력\n\n(아직 이력 없음)'

  return `당신은 BitKitTools.com의 SEO/콘텐츠 전문가입니다.
아래 데이터 기반으로 특정 페이지의 개선 spec을 작성하세요.

## 개선 대상 페이지

- 경로: ${candidate.page}
- 진단 근거: ${candidate.reason}
- 근거 수치: ${candidate.evidence}

${historySection}

---

위 데이터를 바탕으로 아래 항목을 포함한 개선 spec을 한국어 마크다운으로 작성하세요:

1. **문제 요약**: 어떤 지표가 왜 나쁜지 (근거 수치 반드시 포함)
2. **원인 가설**: 2~3가지 가능한 원인
3. **개선 제안**: 구체적인 변경 내용
   - title / description 문구 제안 (EN/KO 각각, 기존 대비 명확한 차별점 포함)
   - 콘텐츠 구조 개선 (FAQ 추가, 섹션 재구성 등)
   - 기타 UX/콘텐츠 개선 사항
4. **기대 효과**: 어떤 지표가 어느 방향으로 움직일 것인지
5. **우선순위**: 이 개선이 왜 지금 중요한지

근거를 명시할 수 없는 제안은 포함하지 마세요.
과거 이력에 이미 시도한 방향은 반복 제안하지 마세요.`
}

// ── API Call ──────────────────────────────────────────────────────────────────

/**
 * Calls the Anthropic API to generate an improvement spec for one candidate.
 *
 * @param candidate - The improvement candidate to generate a spec for
 * @param historyMd - Full contents of data/history.md
 * @param apiKey    - Anthropic API key (ANTHROPIC_API_KEY)
 * @returns         The generated spec as a Markdown string
 * @throws          On network errors or non-OK HTTP status
 */
export async function generateImprovementSpec(
  candidate: ImprovementSpecCandidate,
  historyMd: string,
  apiKey: string
): Promise<string> {
  const prompt = buildImprovementSpecPrompt(candidate, historyMd)

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
      `[generate-improvement-spec] Anthropic API error ${response.status}: ${errorText}`
    )
  }

  const json = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
    stop_reason?: string
  }
  const text = extractAnthropicText(json)

  if (!text.trim()) {
    throw new Error(
      '[generate-improvement-spec] Anthropic API returned empty response for ' +
        candidate.page
    )
  }

  if (isTruncated(json)) {
    console.warn(
      `[generate-improvement-spec] Anthropic response was cut off by max_tokens for ${candidate.page} — spec may be incomplete.`
    )
  }

  return text
}
