/**
 * Analytics Data Collection Script
 *
 * Collects GA4 and Search Console data and saves raw responses to:
 *   data/raw/ga4-{YYYY-MM-DD}.json
 *   data/raw/gsc-{YYYY-MM-DD}.json
 *
 * GA4 reports yesterday's data; GSC reports 2 days ago (accounts for
 * the typical 2–3 day data freshness lag in Search Console).
 *
 * GA4 and GSC calls are independent — one failure does not abort the other.
 * The script exits with code 1 only when both APIs fail to produce data.
 *
 * Required environment variables:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON  Service account key JSON (full string)
 *   - GA4_PROPERTY_ID              GA4 numeric property ID (e.g. "123456789")
 *
 * References:
 *   GA4  https://developers.google.com/analytics/devguides/reporting/data/v1
 *   GSC  https://developers.google.com/webmaster-tools/search-console-api-original/v1/searchanalytics/query
 */

import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { getGoogleAccessToken } from './lib/googleAuth'

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
  // GSC: 2 days ago — Search Console data typically lags 2–3 days,
  // so requesting yesterday often returns an empty or incomplete dataset.
  const gscDate = getDateDaysAgo(2)

  let ga4Success = false
  let gscSuccess = false

  // GA4 — independent try/catch; GSC always runs regardless of GA4 outcome.
  try {
    await collectGa4(yesterdayDate)
    ga4Success = true
  } catch (err: unknown) {
    console.error(`[GA4] Collection failed: ${String(err)}`)
  }

  // GSC — independent try/catch.
  try {
    await collectGsc(gscDate)
    gscSuccess = true
  } catch (err: unknown) {
    console.error(`[GSC] Collection failed: ${String(err)}`)
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
