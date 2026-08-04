/**
 * Analytics Data Retention & Rollup Script
 *
 * 1. raw 60일 보관: data/raw/ 에서 60일보다 오래된 파일 삭제
 * 2. processed 주간 롤업: data/processed/ 에서 90일보다 오래된 일별 파일을
 *    ISO 주차 단위로 묶어 data/processed/weekly/{year}-W{week}.json으로 합친 뒤 원본 삭제
 *
 * Idempotent: 이미 롤업된 주는 재처리하지 않는다.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const RAW_RETENTION_DAYS = 60
const PROCESSED_ROLLUP_DAYS = 90
const TOP_N = 10

// ── Types ─────────────────────────────────────────────────────────────────────

// Mirrors ProcessedDay from process-analytics.ts
interface ProcessedPage {
  path: string
  sessions: number
  events: Record<string, number>
  gscImpressions: number
  gscClicks: number
  gscAvgPosition: number | null
}

interface ProcessedQuery {
  query: string
  page: string
  country: string
  device: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface ProcessedDay {
  date: string
  pages: ProcessedPage[]
  queries: ProcessedQuery[]
  clarity: unknown
}

interface WeeklyRollup {
  week: string
  dateRange: { start: string; end: string }
  totalSessions: number
  totalGscImpressions: number
  totalGscClicks: number
  avgGscPosition: number | null
  topPages: Array<{
    path: string
    sessions: number
    gscImpressions: number
    gscClicks: number
    gscAvgPosition: number | null
  }>
  topQueries: Array<{
    query: string
    impressions: number
    clicks: number
    avgPosition: number | null
  }>
}

// ── ISO Week ──────────────────────────────────────────────────────────────────

/**
 * Calculate the ISO 8601 week number for a given date.
 * Week 1 is the week containing the first Thursday of the year.
 * Weeks start on Monday.
 */
export function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to the Thursday of the current week (ISO weeks are anchored to Thursday)
  const dayOfWeek = d.getUTCDay() || 7 // Convert Sunday (0) to 7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: d.getUTCFullYear(), week: weekNo }
}

export function formatISOWeek(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, '0')}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD string for the date that is `daysBack` before `today` (UTC). */
function cutoffDateStr(today: Date, daysBack: number): string {
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  d.setUTCDate(d.getUTCDate() - daysBack)
  return d.toISOString().slice(0, 10)
}

// ── Raw file cleanup ──────────────────────────────────────────────────────────

/**
 * Delete raw files (ga4-/gsc-/clarity-) older than RAW_RETENTION_DAYS days.
 * @returns Filenames of deleted files.
 */
export function deleteOldRawFiles(rawDir: string, today: Date = new Date()): string[] {
  if (!existsSync(rawDir)) {
    console.log('[retention] data/raw/ not found — skipping raw cleanup.')
    return []
  }

  const cutoff = cutoffDateStr(today, RAW_RETENTION_DAYS)
  const deleted: string[] = []

  for (const file of readdirSync(rawDir)) {
    const match = /^(?:ga4|gsc|clarity)-(\d{4}-\d{2}-\d{2})\.json$/.exec(file)
    if (!match) continue
    const dateStr = match[1]
    if (!dateStr) continue
    // Strictly older than cutoff (cutoff itself is kept)
    if (dateStr < cutoff) {
      rmSync(resolve(rawDir, file))
      console.log(`[retention] Deleted raw: ${file}`)
      deleted.push(file)
    }
  }

  if (deleted.length === 0) {
    console.log('[retention] No raw files to delete.')
  } else {
    console.log(`[retention] Deleted ${deleted.length} raw file(s).`)
  }

  return deleted
}

// ── Weekly rollup builder ─────────────────────────────────────────────────────

function buildWeeklyRollup(weekKey: string, days: ProcessedDay[]): WeeklyRollup {
  const sortedDates = days.map((d) => d.date).sort()
  const start = sortedDates[0] ?? ''
  const end = sortedDates[sortedDates.length - 1] ?? ''

  let totalSessions = 0
  let totalGscImpressions = 0
  let totalGscClicks = 0
  let globalWeightedPosSum = 0
  let globalWeightedPosImpressions = 0

  // Aggregate pages by path across all days
  const pageAcc = new Map<
    string,
    {
      sessions: number
      gscImpressions: number
      gscClicks: number
      weightedPosSum: number
      weightedPosImpressions: number
    }
  >()

  // Aggregate queries by query string across all days
  const queryAcc = new Map<
    string,
    {
      impressions: number
      clicks: number
      weightedPosSum: number
      weightedPosImpressions: number
    }
  >()

  for (const day of days) {
    for (const page of day.pages) {
      totalSessions += page.sessions
      totalGscImpressions += page.gscImpressions
      totalGscClicks += page.gscClicks

      if (page.gscAvgPosition !== null && page.gscImpressions > 0) {
        globalWeightedPosSum += page.gscAvgPosition * page.gscImpressions
        globalWeightedPosImpressions += page.gscImpressions
      }

      if (!pageAcc.has(page.path)) {
        pageAcc.set(page.path, {
          sessions: 0,
          gscImpressions: 0,
          gscClicks: 0,
          weightedPosSum: 0,
          weightedPosImpressions: 0,
        })
      }
      const pa = pageAcc.get(page.path)!
      pa.sessions += page.sessions
      pa.gscImpressions += page.gscImpressions
      pa.gscClicks += page.gscClicks
      if (page.gscAvgPosition !== null && page.gscImpressions > 0) {
        pa.weightedPosSum += page.gscAvgPosition * page.gscImpressions
        pa.weightedPosImpressions += page.gscImpressions
      }
    }

    for (const q of day.queries) {
      if (!queryAcc.has(q.query)) {
        queryAcc.set(q.query, {
          impressions: 0,
          clicks: 0,
          weightedPosSum: 0,
          weightedPosImpressions: 0,
        })
      }
      const qa = queryAcc.get(q.query)!
      qa.impressions += q.impressions
      qa.clicks += q.clicks
      if (q.impressions > 0) {
        qa.weightedPosSum += q.position * q.impressions
        qa.weightedPosImpressions += q.impressions
      }
    }
  }

  const topPages = Array.from(pageAcc.entries())
    .map(([path, a]) => ({
      path,
      sessions: a.sessions,
      gscImpressions: a.gscImpressions,
      gscClicks: a.gscClicks,
      gscAvgPosition:
        a.weightedPosImpressions > 0 ? a.weightedPosSum / a.weightedPosImpressions : null,
    }))
    .sort((a, b) => b.gscImpressions - a.gscImpressions || b.sessions - a.sessions)
    .slice(0, TOP_N)

  const topQueries = Array.from(queryAcc.entries())
    .map(([query, a]) => ({
      query,
      impressions: a.impressions,
      clicks: a.clicks,
      avgPosition:
        a.weightedPosImpressions > 0 ? a.weightedPosSum / a.weightedPosImpressions : null,
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, TOP_N)

  return {
    week: weekKey,
    dateRange: { start, end },
    totalSessions,
    totalGscImpressions,
    totalGscClicks,
    avgGscPosition:
      globalWeightedPosImpressions > 0
        ? globalWeightedPosSum / globalWeightedPosImpressions
        : null,
    topPages,
    topQueries,
  }
}

// ── Processed weekly rollup ───────────────────────────────────────────────────

/**
 * Roll up processed daily files older than PROCESSED_ROLLUP_DAYS into weekly summaries.
 * Weekly files are written to `weeklyDir`. Original daily files are deleted after rollup.
 * @returns Filenames of daily files that were rolled up (deleted).
 */
export function rollupOldProcessedFiles(
  processedDir: string,
  weeklyDir: string,
  today: Date = new Date()
): string[] {
  if (!existsSync(processedDir)) {
    console.log('[retention] data/processed/ not found — skipping rollup.')
    return []
  }

  const cutoff = cutoffDateStr(today, PROCESSED_ROLLUP_DAYS)

  // Collect old daily files (only YYYY-MM-DD.json pattern, skip weekly/ subdir etc.)
  const oldFiles: string[] = []
  for (const file of readdirSync(processedDir)) {
    const match = /^(\d{4}-\d{2}-\d{2})\.json$/.exec(file)
    if (!match) continue
    const dateStr = match[1]
    if (!dateStr) continue
    if (dateStr < cutoff) {
      oldFiles.push(file)
    }
  }

  if (oldFiles.length === 0) {
    console.log('[retention] No processed files to roll up.')
    return []
  }

  // Group files by ISO week
  const weekGroups = new Map<string, string[]>()
  for (const file of oldFiles) {
    const dateStr = file.slice(0, 10) // "YYYY-MM-DD"
    const parts = dateStr.split('-')
    const yearNum = parseInt(parts[0] ?? '', 10)
    const monthNum = parseInt(parts[1] ?? '', 10)
    const dayNum = parseInt(parts[2] ?? '', 10)
    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) continue

    const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum))
    const { year: isoYear, week: isoWeek } = getISOWeek(date)
    const weekKey = formatISOWeek(isoYear, isoWeek)

    if (!weekGroups.has(weekKey)) weekGroups.set(weekKey, [])
    weekGroups.get(weekKey)!.push(file)
  }

  mkdirSync(weeklyDir, { recursive: true })
  const rolledUp: string[] = []

  for (const [weekKey, files] of weekGroups) {
    const weeklyPath = resolve(weeklyDir, `${weekKey}.json`)

    // Idempotent: skip already-rolled-up weeks
    if (existsSync(weeklyPath)) {
      console.log(`[retention] Skipping ${weekKey} — already rolled up.`)
      continue
    }

    // Load day files
    const days: ProcessedDay[] = []
    for (const file of files.sort()) {
      try {
        const raw = readFileSync(resolve(processedDir, file), 'utf-8')
        days.push(JSON.parse(raw) as ProcessedDay)
      } catch (err) {
        console.warn(`[retention] Failed to read ${file}: ${String(err)}`)
      }
    }

    if (days.length === 0) continue

    const rollup = buildWeeklyRollup(weekKey, days)
    writeFileSync(weeklyPath, JSON.stringify(rollup, null, 2), 'utf-8')
    console.log(`[retention] Created rollup: ${weekKey}.json (${days.length} days)`)

    // Delete source daily files after successful write
    for (const file of files) {
      rmSync(resolve(processedDir, file))
      console.log(`[retention] Deleted processed: ${file}`)
      rolledUp.push(file)
    }
  }

  if (rolledUp.length === 0) {
    console.log('[retention] All eligible weeks already rolled up (idempotent).')
  } else {
    console.log(`[retention] Rolled up ${rolledUp.length} file(s) into weekly summaries.`)
  }

  return rolledUp
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  const today = new Date()
  const rawDir = resolve(process.cwd(), 'data', 'raw')
  const processedDir = resolve(process.cwd(), 'data', 'processed')
  const weeklyDir = resolve(processedDir, 'weekly')

  console.log(`[retention] Running for ${today.toISOString().slice(0, 10)}`)

  deleteOldRawFiles(rawDir, today)
  rollupOldProcessedFiles(processedDir, weeklyDir, today)

  console.log('[retention] Done.')
}

// Execute only when run as a script, not when imported by tests
if (process.env['NODE_ENV'] !== 'test') {
  main()
}
