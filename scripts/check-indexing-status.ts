/**
 * GSC URL Inspection Script
 *
 * Checks indexing status for recently added and not-yet-indexed tool pages
 * using the Google Search Console URL Inspection API, then saves results to
 * /data/indexing-status.json as a rolling snapshot.
 *
 * URL selection strategy (quota-efficient — avoids checking all pages every run):
 *   1. Tool pages whose addedAt is within the last 30 days → EN + KO both
 *   2. Any URL already in indexing-status.json whose verdict is NOT 'PASS'
 *      → re-check until it becomes indexed
 *   3. Pages that have a pending title-experiment reindex check
 *      (action log entries with type='title-experiment' and no cooldownStartedAt)
 *      → EN + KO both, until reindex is confirmed
 * URLs that are already indexed (verdict=PASS) and older than 30 days are skipped,
 * unless they are covered by Rule 3.
 *
 * Merge behaviour: existing entries for URLs NOT inspected in this run are
 * preserved unchanged (the file is read → merged → written, never fully replaced).
 *
 * Error handling: a failure for one URL does not abort the rest. The script
 * exits with code 1 only when every inspected URL failed.
 *
 * Required environment variables:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON  Service account key JSON (full string)
 *
 * References:
 *   URL Inspection API  https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { toolsConfig } from '../src/lib/config/tools-config'
import { readActionLog } from './lib/detectStagnation'
import { getGoogleAccessToken } from './lib/googleAuth'
import type { IndexingStatusMap } from './lib/titleExperimentReindex'

// Re-export the shared type so consumers can import from this script's
// canonical output path without knowing about the internal lib location.
export type { IndexingStatusEntry, IndexingStatusMap } from './lib/titleExperimentReindex'

// URL Inspection API requires the full `webmasters` scope, not `.readonly`.
// Reference: https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect#auth
const URL_INSPECTION_SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
]

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const GSC_SITE_URL = 'sc-domain:bitkittools.com'
const URL_INSPECTION_ENDPOINT =
  'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

const DATA_DIR = resolve(process.cwd(), 'data')
const STATUS_FILE = resolve(DATA_DIR, 'indexing-status.json')

const DAYS_NEW_THRESHOLD = 30

// ── API response type ─────────────────────────────────────────────────────────

interface UrlInspectionApiResponse {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string
      coverageState?: string
      /** ISO timestamp of the last time Google crawled this URL */
      lastCrawlTime?: string
    }
  }
}

// ── URL helpers ────────────────────────────────────────────────────────────────

function enUrl(path: string): string {
  return `${SITE_URL}${path}`
}

function koUrl(path: string): string {
  return `${SITE_URL}/ko${path}`
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function isWithinDays(isoDateStr: string, days: number): boolean {
  const date = new Date(isoDateStr)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
}

// ── Persistence ────────────────────────────────────────────────────────────────

function loadExistingStatus(): IndexingStatusMap {
  if (!existsSync(STATUS_FILE)) return {}
  try {
    const raw = readFileSync(STATUS_FILE, 'utf-8')
    return JSON.parse(raw) as IndexingStatusMap
  } catch {
    console.warn(
      '[check-indexing] Could not parse existing indexing-status.json — treating as empty.'
    )
    return {}
  }
}

function saveStatus(status: IndexingStatusMap): void {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8')
}

// ── URL selection ─────────────────────────────────────────────────────────────

function selectUrlsToCheck(existing: IndexingStatusMap): string[] {
  const selected = new Set<string>()

  // Rule 1: recently added tool pages (both locale variants)
  for (const tool of toolsConfig) {
    if (isWithinDays(tool.addedAt, DAYS_NEW_THRESHOLD)) {
      const path = `/${tool.category}/${tool.slug}`
      selected.add(enUrl(path))
      selected.add(koUrl(path))
    }
  }

  // Rule 2: URLs previously recorded as not indexed
  for (const [url, entry] of Object.entries(existing)) {
    if (entry.verdict !== 'PASS') {
      selected.add(url)
    }
  }

  // Rule 3: pages with a pending title-experiment reindex check.
  // A "pending" entry is one with type='title-experiment' and no cooldownStartedAt —
  // we keep checking until GSC reports a lastCrawlTime after deployedAt.
  const actionLog = readActionLog()
  for (const entry of actionLog.actions) {
    if (entry.type === 'title-experiment' && entry.cooldownStartedAt === undefined) {
      // Normalise path: strip trailing slash to match Rule 1's URL format
      const rawPath = entry.page
      const normPath = rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath
      selected.add(enUrl(normPath))
      selected.add(koUrl(normPath))
    }
  }

  return Array.from(selected)
}

// ── API call ───────────────────────────────────────────────────────────────────

interface InspectResult {
  verdict: string
  coverageState: string
  lastCrawlTime?: string
}

async function inspectUrl(
  url: string,
  accessToken: string
): Promise<InspectResult> {
  const response = await fetch(URL_INSPECTION_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inspectionUrl: url,
      siteUrl: GSC_SITE_URL,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `URL Inspection API returned HTTP ${response.status} for ${url}. Response: ${text}`
    )
  }

  const data = (await response.json()) as UrlInspectionApiResponse
  const indexStatus = data.inspectionResult?.indexStatusResult

  return {
    verdict: indexStatus?.verdict ?? 'VERDICT_UNSPECIFIED',
    coverageState: indexStatus?.coverageState ?? 'Unknown',
    lastCrawlTime: indexStatus?.lastCrawlTime,
  }
}

// ── Entry point ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.error(
      '[check-indexing] Missing required environment variable: GOOGLE_SERVICE_ACCOUNT_JSON'
    )
    process.exit(1)
  }

  const existing = loadExistingStatus()
  const urlsToCheck = selectUrlsToCheck(existing)

  if (urlsToCheck.length === 0) {
    console.log(
      '[check-indexing] No URLs to inspect: no tools added in the last 30 days and no previously not-indexed URLs. Done.'
    )
    return
  }

  console.log(
    `[check-indexing] ${urlsToCheck.length} URL(s) selected for inspection:`
  )
  for (const url of urlsToCheck) {
    console.log(`  • ${url}`)
  }

  const accessToken = await getGoogleAccessToken(URL_INSPECTION_SCOPES)

  // Start from the existing snapshot and overwrite only the URLs we inspect.
  const updated: IndexingStatusMap = { ...existing }

  let successCount = 0
  for (const url of urlsToCheck) {
    try {
      const result = await inspectUrl(url, accessToken)
      updated[url] = {
        verdict: result.verdict,
        coverageState: result.coverageState,
        lastCheckedAt: new Date().toISOString(),
        ...(result.lastCrawlTime !== undefined && { lastCrawlTime: result.lastCrawlTime }),
      }
      console.log(
        `[check-indexing] ✓ ${url} — verdict: ${result.verdict}, coverageState: ${result.coverageState}${result.lastCrawlTime ? `, lastCrawlTime: ${result.lastCrawlTime}` : ''}`
      )
      successCount++
    } catch (err: unknown) {
      console.error(
        `[check-indexing] ✗ Failed to inspect ${url}: ${String(err)}`
      )
    }
  }

  if (successCount === 0) {
    console.error(
      '[check-indexing] All URL inspections failed. Exiting with error.'
    )
    process.exit(1)
  }

  saveStatus(updated)
  console.log(`[check-indexing] Saved → ${STATUS_FILE}`)
  console.log(
    `[check-indexing] Done. ${successCount}/${urlsToCheck.length} URL(s) inspected successfully.`
  )
}

main().catch((err: unknown) => {
  console.error(`[check-indexing] Fatal error: ${String(err)}`)
  process.exit(1)
})
