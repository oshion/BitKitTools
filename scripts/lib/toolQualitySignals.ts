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
  /** Sessions this week in which the metric actually occurred (sum of round(sessionsCount x sessionsWithMetricPercentage / 100) over rows). */
  affectedSessionCount: number
  /** Up to 5 distinct page URLs (row `Url` field) that had at least one affected session. */
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
 * Row shape (verified against real populated data, data/raw/clarity-2026-10-29.json):
 * one row per URL — `{ sessionsCount, sessionsWithMetricPercentage, ..., Url }`.
 * Clarity returns a row for every URL that had traffic, even when the metric never
 * occurred (percentage 0), so the row count is NOT an issue count — counting rows
 * produced a false "5 script errors" alarm in the 2026-11-02 report. Only sessions
 * where the metric occurred are counted, and only those URLs become samplePages.
 *
 * Still defensive against unknown/malformed shapes since `ProcessedDay.clarity`
 * is stored as `unknown`.
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
      if (!Array.isArray(information)) continue

      for (const row of information) {
        if (typeof row !== 'object' || row === null) continue
        const { sessionsCount, sessionsWithMetricPercentage, Url } = row as Record<string, unknown>
        if (typeof sessionsCount !== 'number' || typeof sessionsWithMetricPercentage !== 'number') continue

        const affected = Math.round((sessionsCount * sessionsWithMetricPercentage) / 100)
        if (affected <= 0) continue

        const acc = totals.get(metricName) ?? { count: 0, pages: new Set<string>() }
        acc.count += affected
        if (typeof Url === 'string') acc.pages.add(Url)
        totals.set(metricName, acc)
      }
    }
  }

  return Array.from(totals.entries())
    .map(([metricName, acc]) => ({
      metricName,
      affectedSessionCount: acc.count,
      samplePages: Array.from(acc.pages).slice(0, 5),
    }))
    .sort((a, b) => b.affectedSessionCount - a.affectedSessionCount)
}
