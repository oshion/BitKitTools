/**
 * generate-report.ts
 *
 * Weekly report generator. Reads the calendar Saturday-to-Friday week of
 * processed data (see lib/weeklyReportWindow.ts), aggregates it, classifies
 * query intents, detects stagnation trend, and writes a Markdown report: code-computed
 * facts plus AI claims that passed validation (docs/report-quality-pipeline.md).
 *
 * Usage: npx tsx scripts/generate-report.ts
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import type { ProcessedDay } from './process-analytics'
import { aggregateWeeklyReport, buildTitleExperimentSection } from './lib/aggregateWeeklyReport'
import {
  classifyAmbiguousQueries,
  classifyIntentRuleBased,
  type IntentClassification,
} from './lib/classifyIntent'
import { appendTrendPoint, readActionLog, readTrend, writeTrend } from './lib/detectStagnation'
import { getWeeklyReportWindow, getPreviousWeeklyWindow } from './lib/weeklyReportWindow'
import type { CleanupCandidate } from './lib/cleanupSection'
import { buildFallbackHistoryEntry } from './lib/reportResponse'
import { buildReportFacts, removeAuditSessions } from './lib/reportFacts'
import { buildClaimsPrompt, requestReportClaims, validateClaims } from './lib/reportClaims'
import { renderReport } from './lib/renderReport'
import { toolsConfig } from '../src/lib/config/tools-config'
import { findScoresBelowThreshold } from './lib/lighthouseThreshold'
import type { PageLighthouseScore } from './lib/lighthouseThreshold'

// ── Constants ─────────────────────────────────────────────────────────────────

const PROCESSED_DIR = resolve(process.cwd(), 'data', 'processed')
const REPORTS_DIR = resolve(process.cwd(), 'data', 'reports')
const HISTORY_PATH = resolve(process.cwd(), 'data', 'history.md')

/** Top N queries (by impressions) to classify for intent */
const TOP_QUERIES_LIMIT = 30
/** Minimum sessions in 7 days to NOT be flagged as cleanup candidate */
const CLEANUP_SESSION_THRESHOLD = 5
/** Days since addedAt after which a tool can be flagged as cleanup candidate */
const CLEANUP_AGE_DAYS = 90

// ── Data I/O ──────────────────────────────────────────────────────────────────

/** Read processed day files (YYYY-MM-DD.json) whose date falls within [start, end] inclusive. */
function readProcessedDaysInWindow(start: string, end: string): ProcessedDay[] {
  if (!existsSync(PROCESSED_DIR)) return []

  const files = readdirSync(PROCESSED_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .filter((f) => {
      const date = f.slice(0, 10)
      return date >= start && date <= end
    })
    .sort()

  const result: ProcessedDay[] = []
  for (const file of files) {
    try {
      const raw = readFileSync(join(PROCESSED_DIR, file), 'utf-8')
      result.push(JSON.parse(raw) as ProcessedDay)
    } catch {
      // Skip malformed files silently
    }
  }
  return result
}

/** Read data/history.md — returns empty string if file does not exist. */
function readHistory(): string {
  if (!existsSync(HISTORY_PATH)) return ''
  try {
    return readFileSync(HISTORY_PATH, 'utf-8')
  } catch {
    return ''
  }
}

// ── Cleanup Candidates ────────────────────────────────────────────────────────

/**
 * Returns tools that are ≥90 days old and had fewer than 5 sessions
 * across the provided days. Currently all tools are <90 days old so
 * this will return an empty array in the short term.
 */
function getCleanupCandidates(days: ProcessedDay[]): CleanupCandidate[] {
  const today = new Date()
  const cutoffDate = new Date(today.getTime() - CLEANUP_AGE_DAYS * 24 * 60 * 60 * 1000)

  // Build session totals per path from all days
  const sessionsByPath = new Map<string, number>()
  for (const day of days) {
    for (const page of day.pages) {
      sessionsByPath.set(page.path, (sessionsByPath.get(page.path) ?? 0) + page.sessions)
    }
  }

  const candidates: CleanupCandidate[] = []

  for (const tool of toolsConfig) {
    const addedAt = new Date(tool.addedAt)
    if (addedAt > cutoffDate) continue // Newer than 90 days — skip

    // Count sessions across both EN and KO paths
    const paths = [
      `/${tool.category}/${tool.slug}/`,
      `/ko/${tool.category}/${tool.slug}/`,
    ]
    let totalSessions = 0
    for (const path of paths) {
      totalSessions += sessionsByPath.get(path) ?? 0
    }

    if (totalSessions < CLEANUP_SESSION_THRESHOLD) {
      candidates.push({ slug: tool.slug, addedAt: tool.addedAt, sessions: totalSessions })
    }
  }

  return candidates
}

// ── Date Helper ───────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Lighthouse Snapshot ───────────────────────────────────────────────────────

interface LighthouseSnapshot {
  date: string
  scores: PageLighthouseScore[]
}

/**
 * Reads data/processed/lighthouse-{today}.json.
 * Returns null (without throwing) if the file doesn't exist or is malformed —
 * report generation continues without the performance section in that case.
 */
function readTodayLighthouseSnapshot(): LighthouseSnapshot | null {
  const date = todayIso()
  const filePath = join(PROCESSED_DIR, `lighthouse-${date}.json`)
  if (!existsSync(filePath)) return null
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as LighthouseSnapshot
  } catch {
    return null
  }
}

/**
 * Deterministically builds the `## ⚠️ 성능 경고` section from a snapshot.
 * Returns null when there are no flagged scores (no section needed).
 * This is NOT delegated to AI — the section is built in code to guarantee it
 * appears whenever there are scores below threshold.
 */
function buildPerformanceWarningSection(snapshot: LighthouseSnapshot | null): string | null {
  if (!snapshot) return null
  const flagged = findScoresBelowThreshold(snapshot.scores, 90)
  if (flagged.length === 0) return null

  const lines = flagged.map(({ url, category, score }) => `- ${url}: ${category} ${score}점`)
  return `## ⚠️ 성능 경고\n\n다음 페이지가 Lighthouse 90점 미만입니다:\n${lines.join('\n')}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Require API key upfront
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error(
      '[generate-report] Error: ANTHROPIC_API_KEY environment variable is not set.\n' +
        'Set it before running: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-report.ts'
    )
    process.exit(1)
  }

  // ── 0. Read today's Lighthouse snapshot (optional — missing is not an error) ─

  const lighthouseSnapshot = readTodayLighthouseSnapshot()
  if (lighthouseSnapshot) {
    console.log(
      `[generate-report] Loaded Lighthouse snapshot for ${lighthouseSnapshot.date} (${lighthouseSnapshot.scores.length} page(s)).`
    )
  } else {
    console.log(
      '[generate-report] No Lighthouse snapshot found for today — performance section will be omitted.'
    )
  }

  // ── 1. Read the Sat-Fri weekly window of processed data ──────────────────────

  const { start: windowStart, end: windowEnd } = getWeeklyReportWindow(new Date())
  console.log(`[generate-report] Report window: ${windowStart} ~ ${windowEnd}`)

  const { days, removedSessions } = removeAuditSessions(readProcessedDaysInWindow(windowStart, windowEnd))

  if (days.length === 0) {
    console.log(
      '[generate-report] No processed data files found for the report window. ' +
        'Skipping report generation (this is expected in the initial state).'
    )
    process.exit(0)
  }

  console.log(
    `[generate-report] Loaded ${days.length} day(s) of data: ${days.map((d) => d.date).join(', ')}`
  )

  // ── 2. Aggregate weekly data ─────────────────────────────────────────────────

  // Previous Sat-Fri week, only for week-over-week rank changes (risingQueries/fallingQueries).
  const previousWindow = getPreviousWeeklyWindow({ start: windowStart, end: windowEnd })
  const { days: previousDays } = removeAuditSessions(
    readProcessedDaysInWindow(previousWindow.start, previousWindow.end)
  )

  const weeklyData = aggregateWeeklyReport(days, previousDays)

  // ── 3. Classify search intent for top queries ────────────────────────────────

  // Deduplicate queries and rank by total impressions
  const impressionsByQuery = new Map<string, number>()
  for (const day of days) {
    for (const q of day.queries) {
      impressionsByQuery.set(q.query, (impressionsByQuery.get(q.query) ?? 0) + q.impressions)
    }
  }

  const topQueries = [...impressionsByQuery.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_QUERIES_LIMIT)
    .map(([query]) => query)

  // Stage 1: rule-based
  const ruleResults = new Map<string, IntentClassification>()
  const ambiguousQueries: string[] = []
  for (const query of topQueries) {
    const intent = classifyIntentRuleBased(query)
    if (intent === 'ambiguous') {
      ambiguousQueries.push(query)
    } else {
      ruleResults.set(query, intent)
    }
  }

  // Stage 2: AI fallback for ambiguous queries (fail-soft)
  const aiResults = ambiguousQueries.length > 0
    ? await classifyAmbiguousQueries(ambiguousQueries, apiKey)
    : new Map<string, IntentClassification>()

  const intentClassifications: Record<string, IntentClassification> = {}
  for (const query of topQueries) {
    intentClassifications[query] = ruleResults.get(query) ?? aiResults.get(query) ?? 'ambiguous'
  }

  // ── 4. Cleanup candidates ────────────────────────────────────────────────────

  const cleanupCandidates = getCleanupCandidates(days)

  // ── 5. Update stagnation trend ───────────────────────────────────────────────

  const trend = readTrend()

  // Find last week's point before we add/replace this week's entry, so we can
  // report week-over-week movement. If the last entry already has this week's
  // weekStart (a same-day re-run), fall back one further.
  const lastEntry = trend.weeks[trend.weeks.length - 1]
  const previousWeek =
    lastEntry?.weekStart === weeklyData.periodStart
      ? trend.weeks[trend.weeks.length - 2]
      : lastEntry

  const updatedTrend = appendTrendPoint(trend, {
    weekStart: weeklyData.periodStart,
    organicSessions: weeklyData.totals.sessions,
    organicClicks: weeklyData.totals.clicks,
  })
  writeTrend(updatedTrend)
  console.log('[generate-report] Trend data updated.')

  // ── 6. Compute facts ─────────────────────────────────────────────────────────

  const facts = buildReportFacts({
    weekly: weeklyData,
    days,
    previousWeek,
    removedAuditSessions: removedSessions,
    lighthouse: lighthouseSnapshot?.scores ?? [],
    cleanupCount: cleanupCandidates.length,
    intents: intentClassifications,
  })

  // ── 7. Request and validate AI claims ────────────────────────────────────────

  console.log('[generate-report] Calling Anthropic API...')
  const claims = await requestReportClaims(buildClaimsPrompt(facts, readHistory()), apiKey)
  const { accepted, rejected } = validateClaims(claims ?? [], facts)
  console.log(
    claims
      ? `[generate-report] Claims: ${accepted.length} accepted, ${rejected.length} removed.`
      : '[generate-report] No usable AI claims — publishing facts only.'
  )

  // ── 8b. Deterministically append performance warning section ─────────────────
  // This is NOT delegated to AI — we guarantee the section appears whenever
  // there are scores below threshold, regardless of AI prompt compliance.

  const performanceWarning = buildPerformanceWarningSection(lighthouseSnapshot)

  // ── 8c. Deterministically append title experiment section ─────────────────────
  // Also NOT delegated to AI — built in code so it always appears when there
  // are active title experiments, regardless of AI prompt compliance.

  const actionLog = readActionLog()
  const titleExperimentSection = buildTitleExperimentSection(actionLog)

  const report = renderReport({
    periodStart: weeklyData.periodStart,
    periodEnd: weeklyData.periodEnd,
    status: claims ? 'analyzed' : 'facts-only',
    facts,
    accepted,
    rejected,
    cleanupCandidates,
    appendSections: [performanceWarning, titleExperimentSection].filter(
      (section): section is string => Boolean(section)
    ),
  })

  // ── 9. Save report ───────────────────────────────────────────────────────────

  const today = todayIso()
  const yearStr = today.slice(0, 4)
  const reportDir = join(REPORTS_DIR, yearStr)
  mkdirSync(reportDir, { recursive: true })
  const reportPath = join(reportDir, `${today}.md`)
  writeFileSync(reportPath, report, 'utf-8')
  console.log(`[generate-report] Saved report to data/reports/${yearStr}/${today}.md`)

  // ── 10. Append history entry ─────────────────────────────────────────────────

  // Written from the data only: unverified AI summaries spread into later specs.
  const historyEntry = buildFallbackHistoryEntry(weeklyData, previousWeek)
  const existingContent = readHistory()
  const separator = existingContent.length > 0 ? '\n\n' : ''
  appendFileSync(HISTORY_PATH, `${separator}${historyEntry}`, 'utf-8')
  console.log('[generate-report] Appended history entry to data/history.md')
}

main().catch((err: unknown) => {
  console.error('[generate-report] Unexpected error:', err)
  process.exit(1)
})
