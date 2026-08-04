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
 *   GA4  → data/raw/ga4-{date}.json   (date = yesterday at collection time)
 *   GSC  → data/raw/gsc-{date}.json   (date = 2 days ago at collection time)
 * Both are keyed by their own collection date in the filename. This processor
 * treats each filename date independently — a processed file for date D is
 * built from whichever raw files happen to exist for that same D.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const RAW_DIR = resolve(process.cwd(), 'data', 'raw')
const PROCESSED_DIR = resolve(process.cwd(), 'data', 'processed')

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

interface ClarityRawData {
  collectedAt?: string
  collectionDate?: string
  note?: string
  data?: unknown
}

interface ProcessedPage {
  path: string
  sessions: number
  events: Record<string, number>
  gscImpressions: number
  gscClicks: number
  /** Impressions-weighted average position across all GSC queries for this page. */
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

// ── Per-date processing ───────────────────────────────────────────────────────

function processDate(date: string): void {
  const ga4Path = resolve(RAW_DIR, `ga4-${date}.json`)
  const gscPath = resolve(RAW_DIR, `gsc-${date}.json`)
  const clarityPath = resolve(RAW_DIR, `clarity-${date}.json`)

  const ga4Raw = readJsonFile<Ga4RawData>(ga4Path)
  const gscRaw = readJsonFile<GscRawData>(gscPath)
  const clarityRaw = readJsonFile<ClarityRawData>(clarityPath)

  // Build page map from GA4 first
  const pageMap: Map<string, ProcessedPage> =
    ga4Raw !== null ? processGa4(ga4Raw) : new Map()

  // Merge GSC data and collect query rows
  const queries: ProcessedQuery[] =
    gscRaw !== null ? mergeGscIntoPages(gscRaw, pageMap) : []

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
    if (match) {
      dateSet.add(match[1])
    }
  }

  if (dateSet.size === 0) {
    console.log('[process-analytics] No raw files found — nothing to process.')
    return
  }

  const datesToProcess = Array.from(dateSet).filter((date) => {
    const processedPath = resolve(PROCESSED_DIR, `${date}.json`)
    if (existsSync(processedPath)) {
      console.log(`[process-analytics] Skipping ${date} — already processed.`)
      return false
    }
    return true
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

main()
