/**
 * Lighthouse Score Collector — CLI Entry Point
 *
 * Audits the production site (https://bitkittools.com) using `lhci collect`,
 * then extracts scores and saves a dated snapshot to data/processed/.
 *
 * Usage: npx tsx scripts/collect-lighthouse.ts
 *
 * NOTE: This script spawns a headless Chrome process via lhci collect.
 * On machines where Chrome is blocked by security policy (e.g., corporate EDR),
 * run this in GitHub Actions instead of locally.
 *
 * Output: data/processed/lighthouse-{YYYY-MM-DD}.json
 */

import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { findScoresBelowThreshold } from './lib/lighthouseThreshold'
import type { PageLighthouseScore } from './lib/lighthouseThreshold'

// ── Constants ─────────────────────────────────────────────────────────────────

const URLS = [
  'https://bitkittools.com/',
  'https://bitkittools.com/developer/json-formatter/',
  'https://bitkittools.com/travel/flight-delay-compensation/',
  'https://bitkittools.com/beer/bac-calculator/',
  'https://bitkittools.com/baby/growth-percentile/',
]

const LHCI_OUTPUT_DIR = resolve(process.cwd(), '.lighthouseci')
const DATA_DIR = resolve(process.cwd(), 'data', 'processed')

/** Default score threshold passed to findScoresBelowThreshold */
const DEFAULT_THRESHOLD = 90

// ── LHR Types (subset of what lhci writes) ───────────────────────────────────

interface LhrCategory {
  score: number | null
}

interface LhrFile {
  requestedUrl?: string
  finalUrl?: string
  categories: {
    performance?: LhrCategory
    accessibility?: LhrCategory
    'best-practices'?: LhrCategory
    seo?: LhrCategory
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

/** Round a 0–1 Lighthouse score to a 0–100 integer. */
function toPercent(score: number | null | undefined): number {
  if (score == null) return 0
  return Math.round(score * 100)
}

// ── Step 1: Run lhci collect ─────────────────────────────────────────────────

function runLhciCollect(): void {
  console.log('[collect-lighthouse] Running lhci collect against production URLs…')

  const urlArgs = URLS.map((url) => `--url=${url}`)

  const args = [
    'lhci',
    'collect',
    ...urlArgs,
    '--numberOfRuns=1',
    '--settings.onlyCategories=performance,accessibility,best-practices,seo',
    '--settings.chromeFlags=--no-sandbox --disable-gpu --disable-dev-shm-usage',
  ]

  const result = spawnSync('npx', args, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  })

  if (result.error) {
    console.error('[collect-lighthouse] Failed to spawn lhci collect:', result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`[collect-lighthouse] lhci collect exited with status ${result.status ?? 'unknown'}`)
    process.exit(1)
  }

  console.log('[collect-lighthouse] lhci collect completed.')
}

// ── Step 2: Parse LHR files ──────────────────────────────────────────────────

function parseLhrFiles(): PageLighthouseScore[] {
  if (!existsSync(LHCI_OUTPUT_DIR)) {
    console.error(
      `[collect-lighthouse] .lighthouseci/ directory not found at ${LHCI_OUTPUT_DIR}.\n` +
        'lhci collect may have failed silently.'
    )
    process.exit(1)
  }

  const lhrFiles = readdirSync(LHCI_OUTPUT_DIR).filter(
    (f) => f.startsWith('lhr-') && f.endsWith('.json')
  )

  if (lhrFiles.length === 0) {
    console.error(
      '[collect-lighthouse] No lhr-*.json files found in .lighthouseci/.\n' +
        'lhci collect may have failed silently or Chrome was blocked.'
    )
    process.exit(1)
  }

  console.log(`[collect-lighthouse] Found ${lhrFiles.length} LHR file(s) in .lighthouseci/`)

  // Group by URL (multiple runs → one file per URL in our case, numberOfRuns=1)
  const scoresByUrl = new Map<string, PageLighthouseScore>()
  const failedUrls: string[] = []

  for (const filename of lhrFiles) {
    const filePath = join(LHCI_OUTPUT_DIR, filename)
    let lhr: LhrFile

    try {
      const raw = readFileSync(filePath, 'utf-8')
      lhr = JSON.parse(raw) as LhrFile
    } catch (err) {
      console.warn(`[collect-lighthouse] Could not parse ${filename}:`, err)
      failedUrls.push(filename)
      continue
    }

    const url = lhr.finalUrl ?? lhr.requestedUrl ?? filename

    try {
      const score: PageLighthouseScore = {
        url,
        performance: toPercent(lhr.categories.performance?.score),
        accessibility: toPercent(lhr.categories.accessibility?.score),
        bestPractices: toPercent(lhr.categories['best-practices']?.score),
        seo: toPercent(lhr.categories.seo?.score),
      }

      // If multiple runs produced multiple files for the same URL, keep the last one
      scoresByUrl.set(url, score)
    } catch (err) {
      console.warn(`[collect-lighthouse] Could not extract scores from ${filename}:`, err)
      failedUrls.push(url)
    }
  }

  if (failedUrls.length > 0) {
    console.warn(
      `[collect-lighthouse] Failed to parse ${failedUrls.length} file(s): ${failedUrls.join(', ')}`
    )
  }

  const scores = Array.from(scoresByUrl.values())

  if (scores.length === 0) {
    console.error('[collect-lighthouse] No scores could be extracted. Aborting.')
    process.exit(1)
  }

  return scores
}

// ── Step 3: Save snapshot ─────────────────────────────────────────────────────

function saveSnapshot(scores: PageLighthouseScore[]): string {
  mkdirSync(DATA_DIR, { recursive: true })

  const date = today()
  const outPath = join(DATA_DIR, `lighthouse-${date}.json`)

  const snapshot = {
    date,
    scores,
  }

  writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf-8')
  console.log(`[collect-lighthouse] Saved snapshot → ${outPath}`)

  return outPath
}

// ── Step 4: Log summary ───────────────────────────────────────────────────────

function logSummary(scores: PageLighthouseScore[]): void {
  console.log('\n[collect-lighthouse] Score Summary:')
  for (const page of scores) {
    console.log(
      `  ${page.url}\n` +
        `    Performance: ${page.performance}  Accessibility: ${page.accessibility}` +
        `  Best Practices: ${page.bestPractices}  SEO: ${page.seo}`
    )
  }

  const flagged = findScoresBelowThreshold(scores, DEFAULT_THRESHOLD)
  if (flagged.length === 0) {
    console.log(`\n[collect-lighthouse] ✓ All scores are at or above ${DEFAULT_THRESHOLD}.`)
  } else {
    console.warn(`\n[collect-lighthouse] ⚠ ${flagged.length} score(s) below ${DEFAULT_THRESHOLD}:`)
    for (const { url, category, score } of flagged) {
      console.warn(`  [${category}] ${score} — ${url}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  runLhciCollect()
  const scores = parseLhrFiles()
  saveSnapshot(scores)
  logSummary(scores)
}

main()
