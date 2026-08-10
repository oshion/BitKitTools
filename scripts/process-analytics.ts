/**
 * Analytics Data Processing Script
 *
 * Reads raw GA4/GSC/Clarity files from data/raw/ and transforms them into
 * per-day summaries saved at data/processed/{YYYY-MM-DD}.json.
 *
 * Idempotent: dates that already have a processed file are skipped.
 * Resilient: if a raw source file is missing for a date, it is silently skipped.
 *
 * GA4 and GSC use different date keys:
 *   GA4  → data/raw/ga4-{date}.json               (date = yesterday at collection time)
 *   GSC  → data/raw/gsc-{date}.json               (date = 2-5 days ago, query-dimensioned — query-level insight only)
 *   GSC  → data/raw/gsc-page-totals-{date}.json   (date = 2-5 days ago, page-only — authoritative click/impression totals)
 * Both are keyed by their own collection date in the filename. This processor
 * treats each filename date independently — a processed file for date D is
 * built from whichever raw files happen to exist for that same D.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const RAW_DIR = resolve(process.cwd(), 'data', 'raw')
const PROCESSED_DIR = resolve(process.cwd(), 'data', 'processed')

/**
 * GSC raw data for a date arrives up to ~1 day later than GA4/Clarity for
 * the same date (GA4 pulls "yesterday", GSC pulls "2 days ago" — see
 * collect-analytics.ts). If a date is processed the moment GA4 data shows
 * up, naive skip-if-already-processed idempotency would permanently lock
 * that date's processed file without GSC data once it later arrives. Dates
 * within this window are reprocessed (overwritten) on every run so
 * late-arriving GSC data gets picked up; older dates are trusted as settled
 * and left alone to avoid needless daily rewrites of years of history.
 */
export const REPROCESS_WINDOW_DAYS = 5

const SITE_ORIGIN = 'https://bitkittools.com'

// ── Types ────────────────────────────────────────────────────────────────────

interface Ga4Row {
  dimensionValues: Array<{ value: string }>
  metricValues: Array<{ value: string }>
}

interface Ga4RawData {
  dimensionHeaders?: Array<{ name: string }>
  metricHeaders?: Array<{ name: string }>
  rows?: Ga4Row[]
}

// ga4-bounce-{date}.json: dimensions=[pagePath], metrics=[bounceRate, sessions]
interface Ga4BounceRow {
  dimensionValues: Array<{ value: string }>
  metricValues: Array<{ value: string }>
}

interface Ga4BounceRawData {
  dimensionHeaders?: Array<{ name: string }>
  metricHeaders?: Array<{ name: string }>
  rows?: Ga4BounceRow[]
}

interface GscRow {
  keys: [string, string, string, string] // [query, page, country, device]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GscRawData {
  rows?: GscRow[]
  responseAggregationType?: string
}

// gsc-page-totals-{date}.json: dimensions=[page] only (no query). GSC
// anonymizes/omits rows for rare, low-volume queries when the response is
// broken down by query text (privacy protection) — on a low-traffic site, a
// click's query is often unique enough to be redacted entirely from the
// query-dimensioned response, even though it still counts toward page-level
// totals. This page-only fetch is the authoritative source for
// gscImpressions/gscClicks/gscAvgPosition; the query-dimensioned data above
// is only used for query-level insight (search intent, per-query position)
// and is expected to undercount clicks for rare queries.
export interface GscPageTotalsRow {
  keys: [string] // [page]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscPageTotalsRawData {
  rows?: GscPageTotalsRow[]
}

interface ClarityRawData {
  collectedAt?: string
  collectionDate?: string
  note?: string
  data?: unknown
}

export interface ProcessedPage {
  path: string
  sessions: number
  events: Record<string, number>
  gscImpressions: number
  gscClicks: number
  /** Impressions-weighted average position across all GSC queries for this page. */
  gscAvgPosition: number | null
  /** Bounce rate from GA4 (0–1 range). null when not available. */
  bounceRate: number | null
}

export interface ProcessedQuery {
  query: string
  page: string
  country: string
  device: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

export interface ProcessedDay {
  date: string
  pages: ProcessedPage[]
  queries: ProcessedQuery[]
  clarity: unknown | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a GSC page URL to a path comparable with GA4 pagePath.
 *
 * GSC page values look like "https://bitkittools.com/beer/bac-calculator/"
 * GA4 pagePath values look like "/beer/bac-calculator/" or "/beer/bac-calculator"
 *
 * Strategy: strip the origin, then normalise trailing slashes by always adding one.
 * GA4 paths are also normalised the same way so both sides match.
 */
function gscPageToPath(page: string): string {
  let path = page
  if (path.startsWith(SITE_ORIGIN)) {
    path = path.slice(SITE_ORIGIN.length)
  }
  // Ensure trailing slash for consistent comparison
  if (!path.endsWith('/')) {
    path = path + '/'
  }
  return path || '/'
}

/** Normalise a GA4 pagePath to have a trailing slash. */
function normalisePath(p: string): string {
  if (!p.endsWith('/')) {
    return p + '/'
  }
  return p
}

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null
  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (err) {
    console.warn(`[process-analytics] Failed to parse ${filePath}: ${String(err)}`)
    return null
  }
}

// ── GA4 processing ───────────────────────────────────────────────────────────

function processGa4(raw: Ga4RawData): Map<string, ProcessedPage> {
  const pageMap = new Map<string, ProcessedPage>()

  if (!raw.rows || raw.rows.length === 0) {
    return pageMap
  }

  for (const row of raw.rows) {
    const rawPath = row.dimensionValues[0]?.value ?? ''
    const eventName = row.dimensionValues[1]?.value ?? ''
    const sessions = parseInt(row.metricValues[0]?.value ?? '0', 10)
    const eventCount = parseInt(row.metricValues[1]?.value ?? '0', 10)

    const path = normalisePath(rawPath)

    if (!pageMap.has(path)) {
      pageMap.set(path, {
        path,
        sessions: 0,
        events: {},
        gscImpressions: 0,
        gscClicks: 0,
        gscAvgPosition: null,
        bounceRate: null,
      })
    }

    const entry = pageMap.get(path)!
    // sessions is per (pagePath, eventName) combination in GA4 output.
    // We accumulate and will later need the max or unique value. However,
    // GA4 reports sessions per (page, event) pair which can double-count.
    // Use the maximum sessions value seen for any event on this page as
    // the canonical session count (the page_view event typically has the
    // most accurate count).
    entry.sessions = Math.max(entry.sessions, sessions)

    if (eventName) {
      entry.events[eventName] = (entry.events[eventName] ?? 0) + eventCount
    }
  }

  return pageMap
}

// ── GSC processing ────────────────────────────────────────────────────────────

interface GscPageAccum {
  totalImpressions: number
  totalClicks: number
  /** Sum of (position × impressions) for weighted average */
  weightedPositionSum: number
}

/**
 * Builds ProcessedQuery[] and, as a FALLBACK ONLY, sets page-level
 * gscImpressions/gscClicks/gscAvgPosition by summing query rows. This
 * undercounts clicks whenever GSC redacts a rare query's row (see
 * GscPageTotalsRawData above) — mergePageTotalsIntoPages, called afterwards
 * in processDate(), overwrites these fields with the authoritative
 * page-only totals whenever that data is available. This fallback exists so
 * a page still gets a value if the page-totals fetch failed or the file
 * predates this fix.
 */
function mergeGscIntoPages(
  raw: GscRawData,
  pageMap: Map<string, ProcessedPage>
): ProcessedQuery[] {
  const queries: ProcessedQuery[] = []

  if (!raw.rows || raw.rows.length === 0) {
    return queries
  }

  // Accumulate GSC metrics per normalised path
  const gscAccum = new Map<string, GscPageAccum>()

  for (const row of raw.rows) {
    const [query, page, country, device] = row.keys
    const normPath = gscPageToPath(page)

    queries.push({
      query,
      page: normPath,
      country,
      device,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.ctr,
      position: row.position,
    })

    if (!gscAccum.has(normPath)) {
      gscAccum.set(normPath, {
        totalImpressions: 0,
        totalClicks: 0,
        weightedPositionSum: 0,
      })
    }

    const acc = gscAccum.get(normPath)!
    acc.totalImpressions += row.impressions
    acc.totalClicks += row.clicks
    // Impressions-weighted average: position contribution proportional to visibility
    acc.weightedPositionSum += row.position * row.impressions
  }

  // Merge GSC aggregates into pageMap — create page entry if GA4 had no data
  for (const [normPath, acc] of gscAccum) {
    if (!pageMap.has(normPath)) {
      pageMap.set(normPath, {
        path: normPath,
        sessions: 0,
        events: {},
        gscImpressions: 0,
        gscClicks: 0,
        gscAvgPosition: null,
        bounceRate: null,
      })
    }

    const entry = pageMap.get(normPath)!
    entry.gscImpressions = acc.totalImpressions
    entry.gscClicks = acc.totalClicks
    // Impressions-weighted average position (higher position number = lower ranking)
    entry.gscAvgPosition =
      acc.totalImpressions > 0
        ? acc.weightedPositionSum / acc.totalImpressions
        : null
  }

  return queries
}

/**
 * Authoritative page-level GSC merge — overwrites gscImpressions/gscClicks/
 * gscAvgPosition with values from the query-less page-totals fetch, which is
 * not subject to GSC's per-query row redaction. Creates a page entry if
 * neither GA4 nor the query-dimensioned GSC data produced one.
 */
export function mergePageTotalsIntoPages(
  raw: GscPageTotalsRawData,
  pageMap: Map<string, ProcessedPage>
): void {
  if (!raw.rows || raw.rows.length === 0) return

  for (const row of raw.rows) {
    const [page] = row.keys
    const normPath = gscPageToPath(page)

    if (!pageMap.has(normPath)) {
      pageMap.set(normPath, {
        path: normPath,
        sessions: 0,
        events: {},
        gscImpressions: 0,
        gscClicks: 0,
        gscAvgPosition: null,
        bounceRate: null,
      })
    }

    const entry = pageMap.get(normPath)!
    entry.gscImpressions = row.impressions
    entry.gscClicks = row.clicks
    // The API aggregates position for us when the row isn't split by query.
    entry.gscAvgPosition = row.impressions > 0 ? row.position : null
  }
}

// ── GA4 Bounce processing ─────────────────────────────────────────────────────

/**
 * Merge bounce rate values from ga4-bounce-{date}.json into the existing pageMap.
 * Only updates pages already present in the map; does not create new entries.
 * Pages not found in the bounce report retain bounceRate: null.
 */
function mergeBounceIntoPages(
  raw: Ga4BounceRawData,
  pageMap: Map<string, ProcessedPage>
): void {
  if (!raw.rows || raw.rows.length === 0) return

  for (const row of raw.rows) {
    const rawPath = row.dimensionValues[0]?.value ?? ''
    const bounceRateStr = row.metricValues[0]?.value ?? ''

    const path = normalisePath(rawPath)
    const bounceRate = parseFloat(bounceRateStr)

    if (!isNaN(bounceRate) && pageMap.has(path)) {
      const entry = pageMap.get(path)!
      entry.bounceRate = bounceRate
    }
  }
}

// ── Per-date processing ───────────────────────────────────────────────────────

function processDate(date: string): void {
  const ga4Path = resolve(RAW_DIR, `ga4-${date}.json`)
  const gscPath = resolve(RAW_DIR, `gsc-${date}.json`)
  const gscPageTotalsPath = resolve(RAW_DIR, `gsc-page-totals-${date}.json`)
  const clarityPath = resolve(RAW_DIR, `clarity-${date}.json`)
  const ga4BouncePath = resolve(RAW_DIR, `ga4-bounce-${date}.json`)

  const ga4Raw = readJsonFile<Ga4RawData>(ga4Path)
  const gscRaw = readJsonFile<GscRawData>(gscPath)
  const gscPageTotalsRaw = readJsonFile<GscPageTotalsRawData>(gscPageTotalsPath)
  const clarityRaw = readJsonFile<ClarityRawData>(clarityPath)
  const ga4BounceRaw = readJsonFile<Ga4BounceRawData>(ga4BouncePath)

  // Build page map from GA4 first
  const pageMap: Map<string, ProcessedPage> =
    ga4Raw !== null ? processGa4(ga4Raw) : new Map()

  // Merge GSC data and collect query rows (fallback page totals — may
  // undercount clicks due to GSC's per-query redaction, see above)
  const queries: ProcessedQuery[] =
    gscRaw !== null ? mergeGscIntoPages(gscRaw, pageMap) : []

  // Overwrite with authoritative, non-redacted page-level totals when available
  if (gscPageTotalsRaw !== null) {
    mergePageTotalsIntoPages(gscPageTotalsRaw, pageMap)
  }

  // Merge bounce rate data — best-effort, file may not exist
  if (ga4BounceRaw !== null) {
    mergeBounceIntoPages(ga4BounceRaw, pageMap)
  }

  // Clarity: pass raw data.data through without transformation
  const clarity: unknown | null = clarityRaw?.data ?? null

  const result: ProcessedDay = {
    date,
    pages: Array.from(pageMap.values()).sort((a, b) =>
      a.path.localeCompare(b.path)
    ),
    queries,
    clarity,
  }

  mkdirSync(PROCESSED_DIR, { recursive: true })
  const outPath = resolve(PROCESSED_DIR, `${date}.json`)
  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`[process-analytics] Processed ${date} → ${outPath}`)
}

// ── Date Selection ───────────────────────────────────────────────────────────

/** Whole-day difference between `today` and `dateStr` (YYYY-MM-DD), UTC-based. */
function daysSince(dateStr: string, today: Date): number {
  const target = new Date(`${dateStr}T00:00:00Z`)
  const diffMs = today.getTime() - target.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Pure decision function: should this date be (re)processed?
 * - Never processed before → always yes.
 * - Already processed → only if still within the GSC-lag reprocess window
 *   (see REPROCESS_WINDOW_DAYS), so late-arriving GSC data gets merged in.
 */
export function shouldProcessDate(
  date: string,
  alreadyProcessed: boolean,
  today: Date,
  reprocessWindowDays: number = REPROCESS_WINDOW_DAYS
): boolean {
  if (!alreadyProcessed) return true
  return daysSince(date, today) <= reprocessWindowDays
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  if (!existsSync(RAW_DIR)) {
    console.log('[process-analytics] data/raw/ not found — nothing to process.')
    return
  }

  // Collect all unique dates from raw filenames (ga4-*, gsc-*, clarity-*)
  const rawFiles = readdirSync(RAW_DIR)
  const dateSet = new Set<string>()

  for (const file of rawFiles) {
    const match = /^(?:ga4|gsc|clarity)-(\d{4}-\d{2}-\d{2})\.json$/.exec(file)
    if (match?.[1]) {
      dateSet.add(match[1])
    }
  }

  if (dateSet.size === 0) {
    console.log('[process-analytics] No raw files found — nothing to process.')
    return
  }

  const today = new Date()
  const datesToProcess = Array.from(dateSet).filter((date) => {
    const alreadyProcessed = existsSync(resolve(PROCESSED_DIR, `${date}.json`))
    const shouldProcess = shouldProcessDate(date, alreadyProcessed, today)

    if (!shouldProcess) {
      console.log(`[process-analytics] Skipping ${date} — already processed and settled.`)
    } else if (alreadyProcessed) {
      console.log(`[process-analytics] Reprocessing ${date} — within GSC lag window.`)
    }

    return shouldProcess
  })

  if (datesToProcess.length === 0) {
    console.log('[process-analytics] All dates already processed.')
    return
  }

  for (const date of datesToProcess.sort()) {
    processDate(date)
  }

  console.log('[process-analytics] Done.')
}

// Execute only when run as a script, not when imported by tests
if (process.env['NODE_ENV'] !== 'test') {
  main()
}
