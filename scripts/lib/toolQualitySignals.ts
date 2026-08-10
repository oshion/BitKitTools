/**
 * Tool Quality Signals
 *
 * The weekly report otherwise only measures discoverability (GSC clicks/
 * impressions) and raw traffic (GA4 sessions) — nothing about whether a tool
 * is actually pleasant/functional to use once someone lands on it. These two
 * functions turn already-collected-but-previously-unused data into that
 * signal:
 *
 *   - `input_enter` is a GA4 custom event fired once per session the first
 *     time a visitor touches any input on a tool page (see
 *     phases/9-ga4-input-enter-event/). sessions vs input_enter count gives
 *     an engagement rate: "of the people who landed, how many actually tried
 *     the tool?" Low engagement despite real traffic suggests UX friction or
 *     a search-intent mismatch, independent of click-through rate.
 *
 *   - Clarity's DeadClickCount/RageClickCount/ScriptErrorCount/QuickbackClick
 *     metrics are collected daily (collectClarity in collect-analytics.ts)
 *     but process-analytics.ts stores them as an untyped passthrough
 *     (`ProcessedDay.clarity: unknown`) — never parsed or surfaced anywhere.
 */

// ── Engagement rate (GA4 input_enter vs sessions) ────────────────────────────

export interface PageEngagementRate {
  path: string
  sessions: number
  inputEnterCount: number
  /** inputEnterCount / sessions. Can exceed 1 in edge cases (multiple sessions counted differently across days). */
  engagementRate: number
}

/** Minimum accumulated sessions for a page to be included — avoids noise from tiny samples. */
export const MIN_SESSIONS_FOR_ENGAGEMENT = 5

/**
 * Turns accumulated per-page sessions/input_enter counts into engagement
 * rates, sorted ascending (lowest engagement first — the pages most likely
 * to signal "visitors land but don't actually try the tool").
 */
export function computeEngagementRates(
  sessionsByPath: Map<string, number>,
  inputEnterByPath: Map<string, number>
): PageEngagementRate[] {
  const result: PageEngagementRate[] = []

  for (const [path, sessions] of sessionsByPath) {
    if (sessions < MIN_SESSIONS_FOR_ENGAGEMENT) continue
    const inputEnterCount = inputEnterByPath.get(path) ?? 0
    result.push({
      path,
      sessions,
      inputEnterCount,
      engagementRate: inputEnterCount / sessions,
    })
  }

  return result.sort((a, b) => a.engagementRate - b.engagementRate)
}

// ── Clarity UX-issue signals ──────────────────────────────────────────────────

export interface ClarityIssueSummary {
  metricName: string
  /** Number of dimensioned rows Clarity returned for this metric this week (a distinct URL x Country/Region combination per row). */
  affectedRowCount: number
  /** Up to 5 distinct page URLs pulled from the rows, when a `URL` field is present. */
  samplePages: string[]
}

/**
 * Clarity metrics worth surfacing as UX-issue signals. See collectClarity's
 * doc comment in collect-analytics.ts for the full metric list; these four
 * are the ones that indicate actual friction or bugs rather than routine
 * traffic/engagement-time stats.
 */
const WATCHED_CLARITY_METRICS = new Set([
  'DeadClickCount',
  'RageClickCount',
  'ScriptErrorCount',
  'QuickbackClick',
])

/**
 * Summarizes Clarity's raw per-day metric data (ProcessedDay.clarity) into a
 * small set of UX-issue counts.
 *
 * Defensive against unknown/malformed shapes: `ProcessedDay.clarity` is
 * stored as `unknown` because the exact field names for Clarity's per-row
 * counts haven't been verified against real populated data yet (Clarity
 * requires visitor cookie consent, and consented traffic has been ~0 so
 * far — every raw file observed so far has empty `information` arrays). This
 * only relies on two structural assumptions that are safe regardless of
 * exact field naming: (1) `information.length` is the number of affected
 * dimensioned rows, and (2) a `URL` field is present per row, since
 * dimension1='URL' was explicitly requested from the Clarity API.
 */
export function summarizeClaritySignals(clarityDataPerDay: unknown[]): ClarityIssueSummary[] {
  const totals = new Map<string, { count: number; pages: Set<string> }>()

  for (const dayData of clarityDataPerDay) {
    if (!Array.isArray(dayData)) continue

    for (const entry of dayData) {
      if (typeof entry !== 'object' || entry === null) continue
      const metricName = (entry as Record<string, unknown>).metricName
      const information = (entry as Record<string, unknown>).information
      if (typeof metricName !== 'string' || !WATCHED_CLARITY_METRICS.has(metricName)) continue
      if (!Array.isArray(information) || information.length === 0) continue

      const acc = totals.get(metricName) ?? { count: 0, pages: new Set<string>() }
      acc.count += information.length
      for (const row of information) {
        if (typeof row === 'object' && row !== null) {
          const url = (row as Record<string, unknown>).URL
          if (typeof url === 'string') acc.pages.add(url)
        }
      }
      totals.set(metricName, acc)
    }
  }

  return Array.from(totals.entries())
    .map(([metricName, acc]) => ({
      metricName,
      affectedRowCount: acc.count,
      samplePages: Array.from(acc.pages).slice(0, 5),
    }))
    .sort((a, b) => b.affectedRowCount - a.affectedRowCount)
}
