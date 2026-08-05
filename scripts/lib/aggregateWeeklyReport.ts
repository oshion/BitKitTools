/**
 * Weekly Report Data Aggregator
 *
 * Pure function — no file system or network access.
 * Aggregates a list of ProcessedDay records into a WeeklyReportData summary
 * suitable for report generation.
 */

import type { ProcessedDay } from '../process-analytics'

// ── Exported Types ────────────────────────────────────────────────────────────

export interface ZeroCtrPage {
  path: string
  impressions: number
}

export interface HighBouncePage {
  path: string
  bounceRate: number
  sessions: number
}

export interface CtrDeviation {
  path: string
  segmentType: 'country' | 'device'
  segment: string
  segmentCtr: number
  overallCtr: number
  /** segmentCtr / overallCtr — less than 1 means under-performing in this segment */
  deviationRatio: number
}

export interface TopPerformingPage {
  path: string
  clicks: number
  impressions: number
  ctr: number
}

export interface QueryPositionChange {
  query: string
  page: string
  earliestPosition: number
  latestPosition: number
  /** earliestPosition - latestPosition. Positive = rank improved (lower number = better) */
  positionChange: number
}

export interface WeeklyReportData {
  /** YYYY-MM-DD, earliest date in days */
  periodStart: string
  /** YYYY-MM-DD, latest date in days */
  periodEnd: string
  totals: { impressions: number; clicks: number; sessions: number }
  /** Pages with clicks > 0, top 5 by clicks desc — what's actually working */
  topPerformingPages: TopPerformingPage[]
  /** Pages with impressions > 0 but clicks === 0, top 10 by impressions desc */
  zeroCtrPages: ZeroCtrPage[]
  /** Pages with sessions >= 5, top 10 by bounceRate desc */
  highBouncePages: HighBouncePage[]
  /** Segments with significant CTR deviation from the page overall CTR */
  ctrDeviations: CtrDeviation[]
  /** Queries that rose most in rank (positionChange desc, top 10) */
  risingQueries: QueryPositionChange[]
  /** Queries that fell most in rank (positionChange asc, top 10) */
  fallingQueries: QueryPositionChange[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum sessions required to include a page in highBouncePages */
const MIN_SESSIONS_FOR_BOUNCE = 5

/** Minimum impressions for a segment to be considered in CTR deviation analysis */
const MIN_SEGMENT_IMPRESSIONS = 10

/** Deviation ratio threshold — include only if ratio < 0.5 or >= 2.0 */
const CTR_DEVIATION_LOWER = 0.5
const CTR_DEVIATION_UPPER = 2.0

/** How many top-performing pages to surface */
const TOP_PERFORMING_LIMIT = 5

// ── Main Function ─────────────────────────────────────────────────────────────

export function aggregateWeeklyReport(days: ProcessedDay[]): WeeklyReportData {
  // Sort days by date so "earliest" and "latest" are well-defined
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))

  const periodStart = sorted[0]?.date ?? ''
  const periodEnd = sorted[sorted.length - 1]?.date ?? ''

  // ── Totals ─────────────────────────────────────────────────────────────────

  let totalImpressions = 0
  let totalClicks = 0
  let totalSessions = 0

  // Page-level accumulators (across all days)
  // Key: path
  const pageImpressions = new Map<string, number>()
  const pageClicks = new Map<string, number>()
  const pageSessions = new Map<string, number>()
  // bounceRate: accumulate as weighted sum (by sessions) then divide
  const pageBounceWeightedSum = new Map<string, number>()
  const pageBounceSessionSum = new Map<string, number>()

  // Query/segment-level accumulators for CTR deviation
  // Key: `${path}::country::${country}` or `${path}::device::${device}`
  const segmentImpressions = new Map<string, number>()
  const segmentClicks = new Map<string, number>()

  for (const day of sorted) {
    for (const page of day.pages) {
      totalSessions += page.sessions
      totalImpressions += page.gscImpressions
      totalClicks += page.gscClicks

      const prev = pageImpressions.get(page.path) ?? 0
      pageImpressions.set(page.path, prev + page.gscImpressions)

      const prevClicks = pageClicks.get(page.path) ?? 0
      pageClicks.set(page.path, prevClicks + page.gscClicks)

      const prevSessions = pageSessions.get(page.path) ?? 0
      pageSessions.set(page.path, prevSessions + page.sessions)

      // Bounce rate: weight by sessions to handle multi-day accumulation
      if (page.bounceRate !== null && page.sessions > 0) {
        const prevBounceSum = pageBounceWeightedSum.get(page.path) ?? 0
        const prevBounceSessionSum = pageBounceSessionSum.get(page.path) ?? 0
        pageBounceWeightedSum.set(page.path, prevBounceSum + page.bounceRate * page.sessions)
        pageBounceSessionSum.set(page.path, prevBounceSessionSum + page.sessions)
      }
    }

    for (const q of day.queries) {
      // Accumulate by (path, country) and (path, device) segments
      const countryKey = `${q.page}::country::${q.country}`
      const deviceKey = `${q.page}::device::${q.device}`

      segmentImpressions.set(countryKey, (segmentImpressions.get(countryKey) ?? 0) + q.impressions)
      segmentClicks.set(countryKey, (segmentClicks.get(countryKey) ?? 0) + q.clicks)

      segmentImpressions.set(deviceKey, (segmentImpressions.get(deviceKey) ?? 0) + q.impressions)
      segmentClicks.set(deviceKey, (segmentClicks.get(deviceKey) ?? 0) + q.clicks)
    }
  }

  // ── Top Performing Pages ───────────────────────────────────────────────────

  const topPerformingPages: TopPerformingPage[] = []
  for (const [path, clicks] of pageClicks) {
    if (clicks <= 0) continue
    const impressions = pageImpressions.get(path) ?? 0
    const ctr = impressions > 0 ? clicks / impressions : 0
    topPerformingPages.push({ path, clicks, impressions, ctr })
  }
  topPerformingPages.sort((a, b) => b.clicks - a.clicks)
  const topPerformingTop5 = topPerformingPages.slice(0, TOP_PERFORMING_LIMIT)

  // ── Zero CTR Pages ─────────────────────────────────────────────────────────

  const zeroCtrPages: ZeroCtrPage[] = []
  for (const [path, impr] of pageImpressions) {
    const clicks = pageClicks.get(path) ?? 0
    if (impr > 0 && clicks === 0) {
      zeroCtrPages.push({ path, impressions: impr })
    }
  }
  zeroCtrPages.sort((a, b) => b.impressions - a.impressions)
  const zeroCtrTop10 = zeroCtrPages.slice(0, 10)

  // ── High Bounce Pages ──────────────────────────────────────────────────────

  const highBouncePages: HighBouncePage[] = []
  for (const [path, bounceSessionSum] of pageBounceSessionSum) {
    const sessions = pageSessions.get(path) ?? 0
    // Only include pages with enough total sessions to avoid noise
    if (sessions < MIN_SESSIONS_FOR_BOUNCE) continue

    const bounceWeightedSum = pageBounceWeightedSum.get(path) ?? 0
    if (bounceSessionSum === 0) continue

    const bounceRate = bounceWeightedSum / bounceSessionSum
    highBouncePages.push({ path, bounceRate, sessions })
  }
  highBouncePages.sort((a, b) => b.bounceRate - a.bounceRate)
  const highBounceTop10 = highBouncePages.slice(0, 10)

  // ── CTR Deviations ─────────────────────────────────────────────────────────

  const ctrDeviations: CtrDeviation[] = []

  for (const [key, segImpr] of segmentImpressions) {
    // Skip segments with insufficient impressions
    if (segImpr < MIN_SEGMENT_IMPRESSIONS) continue

    const segClicks = segmentClicks.get(key) ?? 0
    const segCtr = segImpr > 0 ? segClicks / segImpr : 0

    // Parse the key: `${path}::${segmentType}::${segment}`
    const firstSep = key.indexOf('::')
    const secondSep = key.indexOf('::', firstSep + 2)
    if (firstSep === -1 || secondSep === -1) continue

    const path = key.slice(0, firstSep)
    const segmentType = key.slice(firstSep + 2, secondSep) as 'country' | 'device'
    const segment = key.slice(secondSep + 2)

    // Overall CTR for this page
    const pageImpr = pageImpressions.get(path) ?? 0
    const pageClk = pageClicks.get(path) ?? 0
    if (pageImpr === 0) continue

    const overallCtr = pageClk / pageImpr

    // Avoid division by zero
    if (overallCtr === 0) continue

    const deviationRatio = segCtr / overallCtr

    // Only include if deviation is significant
    if (deviationRatio < CTR_DEVIATION_LOWER || deviationRatio >= CTR_DEVIATION_UPPER) {
      ctrDeviations.push({
        path,
        segmentType,
        segment,
        segmentCtr: segCtr,
        overallCtr,
        deviationRatio,
      })
    }
  }

  // ── Rising / Falling Queries ───────────────────────────────────────────────

  let risingQueries: QueryPositionChange[] = []
  let fallingQueries: QueryPositionChange[] = []

  if (sorted.length >= 2) {
    const earliestDate = sorted[0]!.date
    const latestDate = sorted[sorted.length - 1]!.date

    // Build impressions-weighted average position per (query, page) per date
    // Key: `${query}:::${page}`
    type PositionAccum = { weightedSum: number; totalImpressions: number }

    const earliest = new Map<string, PositionAccum>()
    const latest = new Map<string, PositionAccum>()

    for (const day of sorted) {
      const isEarliest = day.date === earliestDate
      const isLatest = day.date === latestDate

      if (!isEarliest && !isLatest) continue

      const target = isEarliest ? earliest : latest

      for (const q of day.queries) {
        const key = `${q.query}:::${q.page}`
        const existing = target.get(key) ?? { weightedSum: 0, totalImpressions: 0 }
        existing.weightedSum += q.position * q.impressions
        existing.totalImpressions += q.impressions
        target.set(key, existing)
      }
    }

    const positionChanges: QueryPositionChange[] = []

    for (const [key, earlyAccum] of earliest) {
      const lateAccum = latest.get(key)
      if (!lateAccum) continue // not in latest day → skip

      if (earlyAccum.totalImpressions === 0 || lateAccum.totalImpressions === 0) continue

      const earlyPos = earlyAccum.weightedSum / earlyAccum.totalImpressions
      const latePos = lateAccum.weightedSum / lateAccum.totalImpressions

      const sepIdx = key.indexOf(':::')
      if (sepIdx === -1) continue

      const query = key.slice(0, sepIdx)
      const page = key.slice(sepIdx + 3)

      positionChanges.push({
        query,
        page,
        earliestPosition: earlyPos,
        latestPosition: latePos,
        positionChange: earlyPos - latePos, // positive = rank improved
      })
    }

    // Rising: largest positionChange first (most improved)
    risingQueries = [...positionChanges]
      .sort((a, b) => b.positionChange - a.positionChange)
      .slice(0, 10)

    // Falling: smallest positionChange first (most degraded)
    fallingQueries = [...positionChanges]
      .sort((a, b) => a.positionChange - b.positionChange)
      .slice(0, 10)
  }

  return {
    periodStart,
    periodEnd,
    totals: {
      impressions: totalImpressions,
      clicks: totalClicks,
      sessions: totalSessions,
    },
    topPerformingPages: topPerformingTop5,
    zeroCtrPages: zeroCtrTop10,
    highBouncePages: highBounceTop10,
    ctrDeviations,
    risingQueries,
    fallingQueries,
  }
}
