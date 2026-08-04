/**
 * Analytics Data Collection Script
 *
 * Collects yesterday's GA4 data (page sessions + event counts) and saves
 * the raw response to data/raw/ga4-{YYYY-MM-DD}.json.
 *
 * GSC and Clarity collection will be added in subsequent steps.
 *
 * Required environment variables:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON  Service account key JSON (full string)
 *   - GA4_PROPERTY_ID              GA4 numeric property ID (e.g. "123456789")
 *
 * Reference: https://developers.google.com/analytics/devguides/reporting/data/v1
 */

import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { getGoogleAccessToken } from './lib/googleAuth'

const GA4_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'

function getYesterdayDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function ensureDataDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true })
}

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

async function collectGa4(yesterday: string): Promise<void> {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) {
    throw new Error(
      '[GA4] GA4_PROPERTY_ID environment variable is not set.'
    )
  }

  console.log(`[GA4] Fetching data for ${yesterday}...`)

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

  const outputPath = resolve(outputDir, `ga4-${yesterday}.json`)
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`[GA4] Saved → ${outputPath}`)
}

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

  const yesterday = getYesterdayDate()

  await collectGa4(yesterday)

  console.log('[collect-analytics] Done.')
}

main().catch((err: unknown) => {
  console.error(`[collect-analytics] Fatal error: ${String(err)}`)
  process.exit(1)
})
