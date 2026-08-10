/**
 * Analytics Data Collection Script
 *
 * Collects GA4, Search Console, and Microsoft Clarity data and saves raw
 * responses to:
 *   data/raw/ga4-{YYYY-MM-DD}.json
 *   data/raw/gsc-{YYYY-MM-DD}.json
 *   data/raw/clarity-{YYYY-MM-DD}.json
 *
 * GA4 reports yesterday's data; GSC re-fetches a rolling window (2–5 days
 * ago, see scripts/lib/gscDateWindow.ts) every run, since click counts keep
 * being revised for a few days after the initial freshness lag and a single
 * one-time snapshot would permanently miss late-attributed clicks.
 * Clarity reports the last 24 hours of rolling aggregates (the API does not
 * support specific calendar-date queries).
 *
 * GA4, GSC, and Clarity calls are all independent — one failure does not abort
 * the others. The script exits with code 1 only when both GA4 AND GSC fail.
 * A Clarity failure alone never causes a non-zero exit.
 *
 * Required environment variables:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON  Service account key JSON (full string)
 *   - GA4_PROPERTY_ID              GA4 numeric property ID (e.g. "123456789")
 *
 * Optional environment variables:
 *   - CLARITY_API_KEY              Clarity Data Export API token (project admin)
 *
 * References:
 *   GA4      https://developers.google.com/analytics/devguides/reporting/data/v1
 *   GSC      https://developers.google.com/webmaster-tools/search-console-api-original/v1/searchanalytics/query
 *   Clarity  https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api
 */

import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { getGoogleAccessToken } from './lib/googleAuth'
import { getGscBackfillDates } from './lib/gscDateWindow'

const GA4_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'
const GSC_API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3'
const GSC_SITE_URL = 'sc-domain:bitkittools.com'

// ── Date helpers ────────────────────────────────────────────────────────────

function getDateDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function ensureDataDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true })
}

// ── GA4 ─────────────────────────────────────────────────────────────────────

interface Ga4ReportRequestBody {
  dateRanges: Array<{ startDate: string; endDate: string }>
  dimensions: Array<{ name: string }>
  metrics: Array<{ name: string }>
  keepEmptyRows: boolean
}

async function fetchGa4Report(
  propertyId: string,
  accessToken: string,
  body: Ga4ReportRequestBody
): Promise<unknown> {
  const url = `${GA4_API_BASE}/properties/${propertyId}:runReport`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `[GA4] API returned HTTP ${response.status}. Response: ${text}`
    )
  }

  return response.json()
}

async function collectGa4(date: string): Promise<void> {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    throw new Error(
      '[GA4] GA4_PROPERTY_ID environment variable is not set.'
    )
  }

  console.log(`[GA4] Fetching data for ${date}...`)

  const accessToken = await getGoogleAccessToken()

  const requestBody: Ga4ReportRequestBody = {
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }, { name: 'eventName' }],
    metrics: [{ name: 'sessions' }, { name: 'eventCount' }],
    keepEmptyRows: false,
  }

  const data = await fetchGa4Report(propertyId, accessToken, requestBody)

  const outputDir = resolve(process.cwd(), 'data', 'raw')
  ensureDataDir(outputDir)

  const outputPath = resolve(outputDir, `ga4-${date}.json`)
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`[GA4] Saved → ${outputPath}`)
}

/**
 * Fetch per-page bounce rate from GA4 as a separate report.
 *
 * bounceRate is a session-level metric and must NOT be combined with the
 * eventName dimension used in collectGa4() — mixing them distorts the values.
 * The result is saved to ga4-bounce-{date}.json (separate from ga4-{date}.json)
 * to preserve the existing file schema used by process-analytics.ts.
 *
 * Failure here does NOT affect ga4Success or the process exit code — it follows
 * the same best-effort pattern as Clarity collection.
 */
async function collectGa4Bounce(date: string): Promise<void> {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    throw new Error(
      '[GA4-Bounce] GA4_PROPERTY_ID environment variable is not set.'
    )
  }

  console.log(`[GA4-Bounce] Fetching bounce rate data for ${date}...`)

  const accessToken = await getGoogleAccessToken()

  const requestBody: Ga4ReportRequestBody = {
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'bounceRate' }, { name: 'sessions' }],
    keepEmptyRows: false,
  }

  const data = await fetchGa4Report(propertyId, accessToken, requestBody)

  const outputDir = resolve(process.cwd(), 'data', 'raw')
  ensureDataDir(outputDir)

  const outputPath = resolve(outputDir, `ga4-bounce-${date}.json`)
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`[GA4-Bounce] Saved → ${outputPath}`)
}

// ── Google Search Console ────────────────────────────────────────────────────

interface GscSearchAnalyticsRequestBody {
  startDate: string
  endDate: string
  dimensions: string[]
  rowLimit: number
  startRow: number
  dataState: string
}

async function fetchGscReport(
  accessToken: string,
  body: GscSearchAnalyticsRequestBody
): Promise<unknown> {
  // Domain property siteUrl must be encoded in the URL path.
  const encodedSiteUrl = encodeURIComponent(GSC_SITE_URL)
  const url = `${GSC_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `[GSC] API returned HTTP ${response.status}. Response: ${text}`
    )
  }

  return response.json()
}

async function collectGsc(date: string): Promise<void> {
  console.log(`[GSC] Fetching data for ${date}...`)

  const accessToken = await getGoogleAccessToken()

  const requestBody: GscSearchAnalyticsRequestBody = {
    startDate: date,
    endDate: date,
    // All four dimensions required per step spec (country/device for
    // non-English traffic pattern detection).
    dimensions: ['query', 'page', 'country', 'device'],
    rowLimit: 25000,
    startRow: 0,
    // "all" includes data that may still be processing; "final" is safer
    // but may omit very recent rows — use "all" to maximise row count
    // for a 2-day-old date that is past the freshness window.
    dataState: 'all',
  }

  const data = await fetchGscReport(accessToken, requestBody)

  const outputDir = resolve(process.cwd(), 'data', 'raw')
  ensureDataDir(outputDir)

  const outputPath = resolve(outputDir, `gsc-${date}.json`)
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`[GSC] Saved → ${outputPath}`)
}

// ── Microsoft Clarity ────────────────────────────────────────────────────────

const CLARITY_API_BASE = 'https://www.clarity.ms/export-data/api/v1'

/**
 * Clarity Data Export API: project-live-insights
 *
 * NOTE: The API does not accept a specific calendar date. numOfDays must be
 * 1, 2, or 3 and represents the last 24/48/72 hours of rolling aggregates.
 *
 * Reference:
 *   https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api
 */
async function fetchClarityInsights(
  apiKey: string,
  numOfDays: 1 | 2 | 3,
  dimension1?: string,
  dimension2?: string,
  dimension3?: string
): Promise<unknown> {
  const params = new URLSearchParams({ numOfDays: String(numOfDays) })
  if (dimension1) params.append('dimension1', dimension1)
  if (dimension2) params.append('dimension2', dimension2)
  if (dimension3) params.append('dimension3', dimension3)

  const url = `${CLARITY_API_BASE}/project-live-insights?${params.toString()}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `[Clarity] API returned HTTP ${response.status}. Response: ${text}`
    )
  }

  return response.json()
}

async function collectClarity(date: string): Promise<void> {
  const apiKey = process.env.CLARITY_API_KEY
  if (!apiKey) {
    throw new Error(
      '[Clarity] CLARITY_API_KEY environment variable is not set.'
    )
  }

  console.log('[Clarity] Fetching live insights (numOfDays=1, dimension1=URL, dimension2=Country/Region)...')

  // The API returns aggregated data for the last 24 hours (numOfDays=1).
  // URL + Country/Region breakdown gives page-level traffic by country,
  // the most useful analogue to GA4's pagePath dimension.
  const data = await fetchClarityInsights(apiKey, 1, 'URL', 'Country/Region')

  const output = {
    collectedAt: new Date().toISOString(),
    // collectionDate is the date label used for the filename (GA4 "yesterday"),
    // not the exact calendar date the Clarity data covers. The API reports the
    // last 24 rolling hours, which closely corresponds to "yesterday" in UTC.
    collectionDate: date,
    note: 'Clarity Data Export API returns rolling last-24h aggregates; specific calendar-date queries are not supported by the API.',
    data,
  }

  const outputDir = resolve(process.cwd(), 'data', 'raw')
  ensureDataDir(outputDir)

  const outputPath = resolve(outputDir, `clarity-${date}.json`)
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log(`[Clarity] Saved → ${outputPath}`)
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const ga4PropertyId = process.env.GA4_PROPERTY_ID

  if (!serviceAccountJson || !ga4PropertyId) {
    const missing = [
      !serviceAccountJson && 'GOOGLE_SERVICE_ACCOUNT_JSON',
      !ga4PropertyId && 'GA4_PROPERTY_ID',
    ]
      .filter(Boolean)
      .join(', ')
    console.error(
      `[collect-analytics] Missing required environment variable(s): ${missing}`
    )
    process.exit(1)
  }

  // GA4: yesterday's data (no freshness lag issue)
  const yesterdayDate = getDateDaysAgo(1)

  let ga4Success = false

  // GA4 — independent try/catch; GSC always runs regardless of GA4 outcome.
  try {
    await collectGa4(yesterdayDate)
    ga4Success = true
  } catch (err: unknown) {
    console.error(`[GA4] Collection failed: ${String(err)}`)
  }

  // GA4 Bounce — best-effort, separate report to avoid metric distortion.
  // Failure does NOT affect ga4Success or the exit code.
  try {
    await collectGa4Bounce(yesterdayDate)
  } catch (err: unknown) {
    console.error(`[GA4-Bounce] Collection failed: ${String(err)}`)
  }

  // GSC — refetch a rolling window (not just exactly 2 days ago). Click
  // counts can keep being revised for several days after the initial
  // freshness lag, so a single one-time snapshot permanently misses clicks
  // that Google attributes later. Each date's raw file is overwritten here;
  // process-analytics.ts's own REPROCESS_WINDOW_DAYS then regenerates the
  // processed output from the refreshed raw data on its next run.
  let gscSuccessCount = 0
  const gscDates = getGscBackfillDates(new Date())
  for (const date of gscDates) {
    try {
      await collectGsc(date)
      gscSuccessCount++
    } catch (err: unknown) {
      console.error(`[GSC] Collection failed for ${date}: ${String(err)}`)
    }
  }
  const gscSuccess = gscSuccessCount > 0

  // Clarity — fully independent; failure never triggers process.exit(1).
  // CLARITY_API_KEY is optional; if absent, collectClarity throws and we log.
  try {
    await collectClarity(yesterdayDate)
  } catch (err: unknown) {
    console.error(`[Clarity] Collection failed: ${String(err)}`)
  }

  if (!ga4Success && !gscSuccess) {
    console.error(
      '[collect-analytics] Both GA4 and GSC collection failed. Exiting with error.'
    )
    process.exit(1)
  }

  console.log('[collect-analytics] Done.')
}

main().catch((err: unknown) => {
  console.error(`[collect-analytics] Fatal error: ${String(err)}`)
  process.exit(1)
})
