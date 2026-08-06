/**
 * generate-weekly-specs.ts
 *
 * Orchestration script that runs all Phase 17 spec generators in sequence and
 * appends the results to the current weekly report file.
 *
 * Run order (steps 1–2 always execute regardless of candidate availability, so
 * consecutive-week counters are accurate for subsequent runs):
 *   1. recordWeeklyTopPages
 *   2. Record unmatched query history point
 *   3. selectImprovementCandidates → generateImprovementSpec (max 3)
 *   4. selectGrowthCandidates       → generateGrowthSpec
 *   5. selectToolResearchCandidates → generateToolResearchSpec (max 2)
 *   6. selectNewCategoryCandidate   → generateNewCategorySpec
 *   7. selectProgrammaticSeoCandidates → draftAndValidateVariant → generateProgrammaticSeoSpec
 *   8. Persist all new proposals to data/proposals.json
 *
 * Each step is isolated: a failure in one step does not prevent the remaining
 * steps from executing. Errors are logged to stderr but never re-thrown.
 *
 * Usage: npx tsx scripts/generate-weekly-specs.ts
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import type { ProcessedDay } from './process-analytics'
import { aggregateQueriesByPageAndQuery, aggregateWeeklyReport } from './lib/aggregateWeeklyReport'
import { detectCtrAnomalies } from './lib/detectCtrAnomalies'
import type { CtrBenchmarkTable } from './lib/detectCtrAnomalies'
import { readProposals, writeProposals, upsertProposal } from './lib/proposalTracking'
import type { ProposalLog, ProposalEntry } from './lib/proposalTracking'
import {
  recordWeeklyTopPages,
  readTopPagesHistory,
} from './lib/topPagesHistory'
import {
  readUnmatchedQueryHistory,
  writeUnmatchedQueryHistory,
  appendUnmatchedQueriesPoint,
  findRecurringQueries,
} from './lib/unmatchedQueryHistory'
import { findUnmatchedQueries } from './lib/toolResearchMatching'
import type { SgeRiskPatterns, UnmatchedQuery } from './lib/toolResearchMatching'
import { selectImprovementCandidates, generateImprovementSpec } from './generate-improvement-spec'
import { selectGrowthCandidates, generateGrowthSpec } from './generate-growth-spec'
import {
  selectToolResearchCandidates,
  generateToolResearchSpec,
  selectNewCategoryCandidate,
  generateNewCategorySpec,
} from './generate-tool-research-spec'
import {
  selectProgrammaticSeoCandidates,
  draftAndValidateVariant,
  generateProgrammaticSeoSpec,
} from './generate-programmatic-seo-spec'
import { toolsConfig } from '../src/lib/config/tools-config'
import { buildWeeklySpecsSection } from './lib/weeklySpecsReport'
import type { WeeklySpecsResult } from './lib/weeklySpecsReport'

export type { WeeklySpecsResult }

// ── Constants ─────────────────────────────────────────────────────────────────

const PROCESSED_DIR = resolve(process.cwd(), 'data', 'processed')
const REPORTS_DIR = resolve(process.cwd(), 'data', 'reports')
const SGE_RISK_PATTERNS_PATH = resolve(process.cwd(), 'data', 'reference', 'sge-risk-patterns.json')

/**
 * Standard Google SERP CTR benchmark by position (industry average).
 * Used by detectCtrAnomalies when comparing observed CTRs against expected.
 */
const CTR_BENCHMARK: CtrBenchmarkTable = {
  byPosition: [
    { position: 1, expectedCtr: 0.284 },
    { position: 2, expectedCtr: 0.151 },
    { position: 3, expectedCtr: 0.102 },
    { position: 4, expectedCtr: 0.073 },
    { position: 5, expectedCtr: 0.057 },
    { position: 6, expectedCtr: 0.046 },
    { position: 7, expectedCtr: 0.038 },
    { position: 8, expectedCtr: 0.033 },
    { position: 9, expectedCtr: 0.029 },
    { position: 10, expectedCtr: 0.026 },
  ],
  defaultExpectedCtrBeyondPosition10: 0.01,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Read up to the most recent `limit` days of processed files. */
function readRecentProcessedDays(limit: number): ProcessedDay[] {
  if (!existsSync(PROCESSED_DIR)) return []
  const files = readdirSync(PROCESSED_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .slice(-limit)
  const result: ProcessedDay[] = []
  for (const file of files) {
    try {
      const raw = readFileSync(join(PROCESSED_DIR, file), 'utf-8')
      result.push(JSON.parse(raw) as ProcessedDay)
    } catch {
      // Skip malformed files
    }
  }
  return result
}

function readHistoryMd(): string {
  const path = resolve(process.cwd(), 'data', 'history.md')
  if (!existsSync(path)) return ''
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

function readSgeRiskPatterns(): SgeRiskPatterns {
  if (!existsSync(SGE_RISK_PATTERNS_PATH)) {
    return { zeroClickPatterns: [], interactionNeededPatterns: [] }
  }
  try {
    return JSON.parse(readFileSync(SGE_RISK_PATTERNS_PATH, 'utf-8')) as SgeRiskPatterns
  } catch {
    return { zeroClickPatterns: [], interactionNeededPatterns: [] }
  }
}

/** Deterministically derives a proposal id from type and target. */
function makeProposalId(type: ProposalEntry['type'], target: string): string {
  const slug = target
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${type}-${slug}`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Isolation helper ──────────────────────────────────────────────────────────

/**
 * Runs an async step, catching and logging any error without re-throwing.
 * Ensures a failure in one step never blocks subsequent steps.
 * Exported so the isolation guarantee can be unit-tested independently.
 */
export async function safeRunStep<T>(
  stepName: string,
  fn: () => Promise<T>
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[generate-weekly-specs] ${stepName} failed:`, err)
    return undefined
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Runs all Phase 17 spec generators and returns the aggregated result.
 *
 * Guaranteed invariants:
 *   - The history recording steps (1 and 2) always run, even if no candidates
 *     are found, so that consecutive-week counters remain accurate.
 *   - A failure in any step does not prevent subsequent steps from running.
 *   - All new proposals are upserted into data/proposals.json before returning.
 */
export async function generateWeeklySpecs(apiKey: string): Promise<WeeklySpecsResult> {
  const result: WeeklySpecsResult = {
    improvementSpecs: [],
    growthSpecs: [],
    toolResearchSpecs: [],
    newCategorySpec: null,
    programmaticSeoSpecs: [],
    reminders: [],
  }

  const days = readRecentProcessedDays(7)
  if (days.length === 0) {
    console.log('[generate-weekly-specs] No processed data found — skipping all spec generation.')
    return result
  }

  const weeklyData = aggregateWeeklyReport(days)
  const allQueries = days.flatMap((d) => d.queries)
  const historyMd = readHistoryMd()
  const sgePatterns = readSgeRiskPatterns()
  const asOf = new Date()

  // Proposals log is mutated in-memory as each new proposal is upserted.
  let proposals: ProposalLog = readProposals()

  // Tracks queries consumed by tool research (step 5) so new-category check
  // (step 6) can exclude them from its candidate pool.
  let consumedByToolResearch: string[] = []

  // Latest unmatched queries for this week — populated in step 2, consumed in
  // steps 5–7. Initialised to empty so steps 5–7 can still run if step 2 fails.
  let latestUnmatched: UnmatchedQuery[] = []

  // ── Step 1: Record weekly top pages (always, no skip on empty) ──────────────
  await safeRunStep('recordWeeklyTopPages', async () => {
    recordWeeklyTopPages(weeklyData.topPerformingPages, weeklyData.periodStart)
    console.log(
      `[generate-weekly-specs] Step 1 done: recorded ${weeklyData.topPerformingPages.length} top page(s).`
    )
  })

  // ── Step 2: Record unmatched query history (always, no skip on empty) ───────
  await safeRunStep('recordUnmatchedQueryHistory', async () => {
    latestUnmatched = findUnmatchedQueries(allQueries, toolsConfig)
    const unmatchedHistory = readUnmatchedQueryHistory()
    const updated = appendUnmatchedQueriesPoint(unmatchedHistory, {
      weekStart: weeklyData.periodStart,
      queries: latestUnmatched.map((q) => q.query),
    })
    writeUnmatchedQueryHistory(updated)
    console.log(
      `[generate-weekly-specs] Step 2 done: recorded ${latestUnmatched.length} unmatched query(-ies).`
    )
  })

  // ── Step 3: Improvement specs ────────────────────────────────────────────────
  await safeRunStep('improvementSpecs', async () => {
    const pageCtrSamples = aggregateQueriesByPageAndQuery(allQueries)
    const ctrAnomalies = detectCtrAnomalies(pageCtrSamples, CTR_BENCHMARK)
    const { candidates, reminders } = selectImprovementCandidates(
      ctrAnomalies,
      weeklyData.highBouncePages,
      proposals,
      asOf
    )
    result.reminders.push(...reminders)

    for (const candidate of candidates) {
      await safeRunStep(`generateImprovementSpec(${candidate.page})`, async () => {
        const spec = await generateImprovementSpec(candidate, historyMd, apiKey)
        result.improvementSpecs.push(spec)
        const { log } = upsertProposal(
          proposals,
          {
            id: makeProposalId('improvement', candidate.page),
            type: 'improvement',
            target: candidate.page,
            firstProposedAt: todayIso(),
            status: 'pending',
          },
          asOf
        )
        proposals = log
        console.log(`[generate-weekly-specs] Step 3: improvement spec generated for ${candidate.page}`)
      })
    }
  })

  // ── Step 4: Growth specs ─────────────────────────────────────────────────────
  await safeRunStep('growthSpecs', async () => {
    const topPagesHistory = readTopPagesHistory()
    const { candidates, reminders } = selectGrowthCandidates(topPagesHistory, proposals, asOf)
    result.reminders.push(...reminders)

    for (const candidate of candidates) {
      await safeRunStep(`generateGrowthSpec(${candidate.page})`, async () => {
        const spec = await generateGrowthSpec(candidate, historyMd, apiKey)
        result.growthSpecs.push(spec)
        const { log } = upsertProposal(
          proposals,
          {
            id: makeProposalId('growth', candidate.page),
            type: 'growth',
            target: candidate.page,
            firstProposedAt: todayIso(),
            status: 'pending',
          },
          asOf
        )
        proposals = log
        console.log(`[generate-weekly-specs] Step 4: growth spec generated for ${candidate.page}`)
      })
    }
  })

  // ── Step 5: Tool research specs ──────────────────────────────────────────────
  await safeRunStep('toolResearchSpecs', async () => {
    const unmatchedHistory = readUnmatchedQueryHistory()
    const recurringQueries = findRecurringQueries(unmatchedHistory)

    const { candidates, reminders } = await selectToolResearchCandidates(
      recurringQueries,
      latestUnmatched,
      sgePatterns,
      proposals,
      asOf,
      apiKey
    )
    result.reminders.push(...reminders)
    consumedByToolResearch = candidates.map((c) => c.query)

    for (const candidate of candidates) {
      await safeRunStep(`generateToolResearchSpec(${candidate.query})`, async () => {
        const spec = await generateToolResearchSpec(candidate, historyMd, apiKey)
        result.toolResearchSpecs.push(spec)
        const { log } = upsertProposal(
          proposals,
          {
            id: makeProposalId('tool-research', candidate.query),
            type: 'tool-research',
            target: candidate.query,
            firstProposedAt: todayIso(),
            status: 'pending',
          },
          asOf
        )
        proposals = log
        console.log(`[generate-weekly-specs] Step 5: tool research spec generated for "${candidate.query}"`)
      })
    }
  })

  // ── Step 6: New category spec ────────────────────────────────────────────────
  await safeRunStep('newCategorySpec', async () => {
    const unmatchedHistory = readUnmatchedQueryHistory()
    const recurringQueries = findRecurringQueries(unmatchedHistory)

    const categoryCandidate = selectNewCategoryCandidate(
      recurringQueries,
      consumedByToolResearch,
      proposals,
      asOf
    )

    if (categoryCandidate) {
      const spec = await generateNewCategorySpec(categoryCandidate, historyMd, apiKey)
      result.newCategorySpec = spec

      if (spec) {
        const { log } = upsertProposal(
          proposals,
          {
            id: makeProposalId('new-category', categoryCandidate.queries[0] ?? 'unknown'),
            type: 'new-category',
            target: categoryCandidate.queries[0] ?? '',
            firstProposedAt: todayIso(),
            status: 'pending',
          },
          asOf
        )
        proposals = log
        console.log('[generate-weekly-specs] Step 6: new category spec generated.')
      } else {
        console.log('[generate-weekly-specs] Step 6: AI returned NONE — no new category proposal.')
      }
    } else {
      console.log('[generate-weekly-specs] Step 6: no new category candidate found.')
    }
  })

  // ── Step 7: Programmatic SEO specs ───────────────────────────────────────────
  await safeRunStep('programmaticSeoSpecs', async () => {
    const { candidates, reminders } = selectProgrammaticSeoCandidates(
      latestUnmatched,
      toolsConfig,
      proposals,
      asOf
    )
    result.reminders.push(...reminders)

    for (const candidate of candidates) {
      await safeRunStep(`generateProgrammaticSeoSpec(${candidate.variantQuery})`, async () => {
        const draft = await draftAndValidateVariant(candidate, apiKey)
        if (!draft) {
          console.log(
            `[generate-weekly-specs] Step 7: draft failed guardrail for "${candidate.variantQuery}" — skipped.`
          )
          return
        }
        const spec = await generateProgrammaticSeoSpec(candidate, draft, apiKey)
        result.programmaticSeoSpecs.push(spec)
        const { log } = upsertProposal(
          proposals,
          {
            id: makeProposalId('programmatic-seo', candidate.variantQuery),
            type: 'programmatic-seo',
            target: candidate.variantQuery,
            firstProposedAt: todayIso(),
            status: 'pending',
          },
          asOf
        )
        proposals = log
        console.log(
          `[generate-weekly-specs] Step 7: programmatic SEO spec generated for "${candidate.variantQuery}"`
        )
      })
    }
  })

  // ── Step 8: Persist proposals ────────────────────────────────────────────────
  await safeRunStep('writeProposals', async () => {
    writeProposals(proposals)
    console.log('[generate-weekly-specs] Step 8: proposals saved.')
  })

  return result
}

// ── CLI Entry Point ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error(
      '[generate-weekly-specs] Error: ANTHROPIC_API_KEY environment variable is not set.\n' +
        'Set it before running: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-weekly-specs.ts'
    )
    process.exit(1)
  }

  const result = await generateWeeklySpecs(apiKey)

  const specCount =
    result.improvementSpecs.length +
    result.growthSpecs.length +
    result.toolResearchSpecs.length +
    (result.newCategorySpec !== null ? 1 : 0) +
    result.programmaticSeoSpecs.length

  console.log(
    `[generate-weekly-specs] Done. Generated ${specCount} spec(s), ` +
      `${result.reminders.length} reminder(s).`
  )

  // Append the spec section to the existing report file (written by generate-report.ts).
  const section = buildWeeklySpecsSection(result)
  if (!section) {
    console.log('[generate-weekly-specs] No spec content to append — report unchanged.')
    return
  }

  const today = todayIso()
  const yearStr = today.slice(0, 4)
  const reportPath = join(REPORTS_DIR, yearStr, `${today}.md`)

  if (!existsSync(reportPath)) {
    // Report file not found (generate-report.ts may have been skipped).
    // Write the specs section as a standalone file so the data is not lost.
    const fallbackDir = join(REPORTS_DIR, yearStr)
    mkdirSync(fallbackDir, { recursive: true })
    const fallbackPath = join(fallbackDir, `${today}-specs.md`)
    writeFileSync(fallbackPath, section, 'utf-8')
    console.log(`[generate-weekly-specs] Report not found — wrote specs to ${fallbackPath}`)
    return
  }

  appendFileSync(reportPath, `\n\n${section}`, 'utf-8')
  console.log(`[generate-weekly-specs] Appended spec section to data/reports/${yearStr}/${today}.md`)
}

main().catch((err: unknown) => {
  console.error('[generate-weekly-specs] Unexpected error:', err)
  process.exit(1)
})
