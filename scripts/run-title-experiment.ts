/**
 * run-title-experiment.ts
 *
 * Thin orchestration entry point for the automated title A/B test pipeline.
 *
 * Runs two phases each time it is invoked:
 *
 * Phase B — Evaluate existing experiments (always runs first)
 *   B1. Update `cooldownStartedAt` for newly GSC-reindexed pages.
 *   B2. Evaluate experiments that have completed their 21-day cooldown window:
 *         - 'kept'       → mark entry as kept (new title stays).
 *         - 'new-attempt' → close current entry; queue page for re-experiment.
 *         - 'rollback'   → deploy PR to restore original title; mark rolled-back.
 *
 * Phase C — Start new experiments (runs after Phase B, only if slots remain)
 *   C1. Detect CTR anomalies from the latest processed GSC data.
 *   C2. Select candidate pages (non-YMYL, not already in-progress, ≤ 2 total).
 *   C3. Generate title variants via Anthropic API and deploy PRs.
 *       – Non-YMYL: auto-merge enabled.
 *       – YMYL:     PR created but no auto-merge (human review required).
 *
 * All file I/O and gh/git side effects live here.
 * Pure decision logic lives in scripts/lib/titleExperimentOrchestrator.ts.
 *
 * Required environment variables:
 *   GH_TOKEN          — GitHub PAT with repo + workflow scopes.
 *   ANTHROPIC_API_KEY — Anthropic API key for variant generation.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { resolve } from 'path'
import { toolsConfig } from '../src/lib/config/tools-config'
import {
  readActionLog,
  writeActionLog,
} from './lib/detectStagnation'
import { detectCtrAnomalies, type PageCtrSample, type CtrBenchmarkTable } from './lib/detectCtrAnomalies'
import { findReindexedExperiments, type IndexingStatusMap } from './lib/titleExperimentReindex'
import { generateTitleVariants } from './generate-title-variant'
import type { TitleVariant } from './generate-title-variant'
import {
  isYmylTool,
  countInProgressExperiments,
  isExperimentReadyForEvaluation,
  evaluateExperimentOutcome,
  selectCandidatePages,
  getPageCtr,
  getRequiredKeywordsForTool,
  findToolByPage,
  deployTitleVariant,
  type ProcessedQuery,
} from './lib/titleExperimentOrchestrator'

// ── Constants ─────────────────────────────────────────────────────────────────

const DATA_DIR = resolve(process.cwd(), 'data')
const INDEXING_STATUS_FILE = resolve(DATA_DIR, 'indexing-status.json')
const BENCHMARK_FILE = resolve(DATA_DIR, 'reference', 'ctr-benchmark.json')
const PROCESSED_DIR = resolve(DATA_DIR, 'processed')

/** Maximum concurrent in-progress title experiments */
const MAX_CONCURRENT_EXPERIMENTS = 2

// ── File helpers ──────────────────────────────────────────────────────────────

function loadIndexingStatus(): IndexingStatusMap {
  if (!existsSync(INDEXING_STATUS_FILE)) return {}
  try {
    const raw = readFileSync(INDEXING_STATUS_FILE, 'utf-8')
    return JSON.parse(raw) as IndexingStatusMap
  } catch {
    console.warn('[run-title-experiment] Could not parse indexing-status.json — treating as empty.')
    return {}
  }
}

function loadCtrBenchmark(): CtrBenchmarkTable {
  if (!existsSync(BENCHMARK_FILE)) {
    throw new Error(`CTR benchmark file not found: ${BENCHMARK_FILE}`)
  }
  const raw = readFileSync(BENCHMARK_FILE, 'utf-8')
  return JSON.parse(raw) as CtrBenchmarkTable
}

/** Returns the most recently modified YYYY-MM-DD.json file in data/processed/. */
function loadLatestProcessedQueries(): ProcessedQuery[] {
  if (!existsSync(PROCESSED_DIR)) return []

  const candidates = readdirSync(PROCESSED_DIR)
    .filter((f: string) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f: string) => ({ file: f, mtime: statSync(resolve(PROCESSED_DIR, f)).mtimeMs }))
    .sort((a: { mtime: number }, b: { mtime: number }) => b.mtime - a.mtime)

  if (candidates.length === 0) return []

  const latest = candidates[0]!.file
  try {
    const raw = readFileSync(resolve(PROCESSED_DIR, latest), 'utf-8')
    const parsed = JSON.parse(raw) as { queries?: ProcessedQuery[] }
    return parsed.queries ?? []
  } catch {
    console.warn(`[run-title-experiment] Could not parse processed data file: ${latest}`)
    return []
  }
}

// ── Phase B helpers ───────────────────────────────────────────────────────────

interface NewAttemptInfo {
  page: string
  attemptNumber: number
  originalTitle: import('../src/types/tool').LocalizedText
  originalDescription: import('../src/types/tool').LocalizedText
  baselineCtr: number
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const GH_TOKEN = process.env.GH_TOKEN ?? ''
  if (!GH_TOKEN) {
    console.error('[run-title-experiment] GH_TOKEN environment variable is required.')
    process.exit(1)
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
  if (!ANTHROPIC_API_KEY) {
    console.error('[run-title-experiment] ANTHROPIC_API_KEY environment variable is required.')
    process.exit(1)
  }

  // ── Load data ──────────────────────────────────────────────────────────────

  const actionLog = readActionLog()
  const indexingStatus = loadIndexingStatus()
  const queries = loadLatestProcessedQueries()

  console.log(
    `[run-title-experiment] Loaded ${actionLog.actions.length} action log entries, ` +
    `${Object.keys(indexingStatus).length} indexing status entries, ` +
    `${queries.length} GSC query rows.`
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Phase B: Evaluate existing experiments
  // ─────────────────────────────────────────────────────────────────────────

  // B1: Stamp cooldownStartedAt for experiments that have been reindexed.
  const reindexConfirmations = findReindexedExperiments(actionLog, indexingStatus)
  let actionLogDirty = false

  for (const confirmation of reindexConfirmations) {
    const entry = actionLog.actions.find((e) => e.id === confirmation.actionLogEntryId)
    if (entry) {
      entry.cooldownStartedAt = confirmation.cooldownStartedAt
      console.log(
        `[run-title-experiment] B1 cooldown started: ${entry.page} (cooldownStartedAt: ${confirmation.cooldownStartedAt})`
      )
      actionLogDirty = true
    }
  }

  if (actionLogDirty) {
    writeActionLog(actionLog)
    actionLogDirty = false
  }

  // B2: Evaluate experiments whose cooldown window has elapsed.
  const now = new Date()
  const newAttemptQueue: NewAttemptInfo[] = []

  for (const entry of actionLog.actions) {
    if (!isExperimentReadyForEvaluation(entry, now)) continue

    const currentCtr = getPageCtr(queries, entry.page)
    if (currentCtr === null) {
      console.warn(
        `[run-title-experiment] B2 no CTR data for ${entry.page} — skipping evaluation for this run.`
      )
      continue
    }

    const outcome = evaluateExperimentOutcome(entry, currentCtr)

    if (outcome === 'kept') {
      entry.status = 'kept'
      console.log(
        `[run-title-experiment] B2 kept: ${entry.page} CTR ${currentCtr.toFixed(4)} > baseline ${(entry.baselineCtr ?? 0).toFixed(4)}`
      )
      actionLogDirty = true
    } else if (outcome === 'new-attempt') {
      entry.status = 'rolled-back'
      const nextAttempt = (entry.attemptNumber ?? 1) + 1
      console.log(
        `[run-title-experiment] B2 new-attempt: ${entry.page} — attempt ${nextAttempt} queued (CTR ${currentCtr.toFixed(4)} did not improve)`
      )
      if (entry.originalTitle && entry.originalDescription) {
        newAttemptQueue.push({
          page: entry.page,
          attemptNumber: nextAttempt,
          originalTitle: entry.originalTitle,
          originalDescription: entry.originalDescription,
          baselineCtr: entry.baselineCtr ?? 0,
        })
      }
      actionLogDirty = true
    } else {
      // 'rollback' — attempt 3 failed; restore original title
      entry.status = 'rolled-back'
      console.log(
        `[run-title-experiment] B2 rollback: ${entry.page} — all 3 attempts failed, restoring original title.`
      )
      actionLogDirty = true

      if (entry.originalTitle && entry.originalDescription) {
        const rollbackVariant: TitleVariant = {
          title: entry.originalTitle,
          description: entry.originalDescription,
        }
        const tool = findToolByPage(toolsConfig, entry.page)
        const ymyl = tool ? isYmylTool(tool) : false

        try {
          const { prUrl } = await deployTitleVariant(
            entry.page,
            rollbackVariant,
            ymyl,
            GH_TOKEN
          )
          console.log(`[run-title-experiment] B2 rollback PR created: ${prUrl}`)
        } catch (err) {
          console.error(
            `[run-title-experiment] B2 rollback deploy failed for ${entry.page}: ${String(err)}`
          )
        }
      } else {
        console.warn(
          `[run-title-experiment] B2 rollback: ${entry.page} — no originalTitle/Description stored, cannot restore.`
        )
      }
    }
  }

  if (actionLogDirty) {
    writeActionLog(actionLog)
    actionLogDirty = false
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase C: Start new experiments
  // ─────────────────────────────────────────────────────────────────────────

  const inProgressCount = countInProgressExperiments(actionLog)
  const availableSlots = Math.max(0, MAX_CONCURRENT_EXPERIMENTS - inProgressCount)

  if (availableSlots === 0) {
    console.log(
      `[run-title-experiment] C — concurrent limit reached (${inProgressCount}/${MAX_CONCURRENT_EXPERIMENTS}). No new experiments started.`
    )
    return
  }

  console.log(
    `[run-title-experiment] C — ${availableSlots} slot(s) available for new experiments.`
  )

  // C1: Detect CTR anomalies.
  const benchmark = loadCtrBenchmark()
  const samples: PageCtrSample[] = queries.map((q) => ({
    page: q.page,
    query: q.query,
    impressions: q.impressions,
    clicks: q.clicks,
    avgPosition: q.position,
  }))
  const anomalies = detectCtrAnomalies(samples, benchmark)
  console.log(`[run-title-experiment] C1 detected ${anomalies.length} CTR anomalie(s).`)

  // C2: Select new candidate pages (non-YMYL, non-in-progress, up to availableSlots).
  const candidatePages = selectCandidatePages(
    anomalies,
    actionLog,
    toolsConfig,
    availableSlots
  )
  console.log(
    `[run-title-experiment] C2 ${candidatePages.length} new candidate page(s) selected.`
  )

  // Fill remaining slots with new-attempt retries.
  const retrySlots = Math.max(0, availableSlots - candidatePages.length)
  const retryQueue = newAttemptQueue.slice(0, retrySlots)

  // C3: Generate variants and deploy for new candidates.
  for (const page of candidatePages) {
    const tool = findToolByPage(toolsConfig, page)
    if (!tool) {
      console.warn(`[run-title-experiment] C3 tool not found for page ${page} — skipping.`)
      continue
    }

    const baselineCtr = getPageCtr(queries, page) ?? 0
    const requiredKeywords = getRequiredKeywordsForTool(tool)

    const variants = await generateTitleVariants(
      {
        page,
        currentTitle: tool.title,
        currentDescription: tool.description,
        requiredKeywords,
        ctrEvidence: `CTR anomaly detected; current page CTR: ${(baselineCtr * 100).toFixed(2)}%`,
      },
      ANTHROPIC_API_KEY
    )

    if (variants.length === 0) {
      console.warn(`[run-title-experiment] C3 no valid variant generated for ${page} — skipping.`)
      continue
    }

    const variant = variants[0]!
    const ymyl = isYmylTool(tool)

    try {
      const { prUrl, autoMerged } = await deployTitleVariant(page, variant, ymyl, GH_TOKEN)

      const entryId = `title-experiment-${Date.now()}-${tool.id}`
      actionLog.actions.push({
        id: entryId,
        type: 'title-experiment',
        page,
        deployedAt: new Date().toISOString(),
        description: `Title experiment attempt 1 for ${page}`,
        attemptNumber: 1,
        originalTitle: tool.title,
        originalDescription: tool.description,
        baselineCtr,
        status: 'in-progress',
      })
      actionLogDirty = true

      console.log(
        `[run-title-experiment] C3 deployed: ${page} → PR ${prUrl} (autoMerged: ${autoMerged})`
      )
    } catch (err) {
      console.error(
        `[run-title-experiment] C3 deploy failed for ${page}: ${String(err)}`
      )
    }
  }

  // C3b: Deploy retry experiments for pages that previously failed.
  for (const retryInfo of retryQueue) {
    const tool = findToolByPage(toolsConfig, retryInfo.page)
    if (!tool) {
      console.warn(
        `[run-title-experiment] C3b tool not found for retry page ${retryInfo.page} — skipping.`
      )
      continue
    }

    const requiredKeywords = getRequiredKeywordsForTool(tool)

    const variants = await generateTitleVariants(
      {
        page: retryInfo.page,
        currentTitle: tool.title,
        currentDescription: tool.description,
        requiredKeywords,
        ctrEvidence: `Retry attempt ${retryInfo.attemptNumber} after previous variant did not improve CTR.`,
      },
      ANTHROPIC_API_KEY
    )

    if (variants.length === 0) {
      console.warn(
        `[run-title-experiment] C3b no valid variant for retry ${retryInfo.page} — skipping.`
      )
      continue
    }

    const variant = variants[0]!
    const ymyl = isYmylTool(tool)

    try {
      const { prUrl, autoMerged } = await deployTitleVariant(
        retryInfo.page,
        variant,
        ymyl,
        GH_TOKEN
      )

      const entryId = `title-experiment-${Date.now()}-${tool.id}-attempt${retryInfo.attemptNumber}`
      actionLog.actions.push({
        id: entryId,
        type: 'title-experiment',
        page: retryInfo.page,
        deployedAt: new Date().toISOString(),
        description: `Title experiment attempt ${retryInfo.attemptNumber} for ${retryInfo.page}`,
        attemptNumber: retryInfo.attemptNumber,
        originalTitle: retryInfo.originalTitle,
        originalDescription: retryInfo.originalDescription,
        baselineCtr: retryInfo.baselineCtr,
        status: 'in-progress',
      })
      actionLogDirty = true

      console.log(
        `[run-title-experiment] C3b retry deployed: ${retryInfo.page} (attempt ${retryInfo.attemptNumber}) → PR ${prUrl} (autoMerged: ${autoMerged})`
      )
    } catch (err) {
      console.error(
        `[run-title-experiment] C3b retry deploy failed for ${retryInfo.page}: ${String(err)}`
      )
    }
  }

  if (actionLogDirty) {
    writeActionLog(actionLog)
  }

  console.log('[run-title-experiment] Done.')
}

main().catch((err: unknown) => {
  console.error(`[run-title-experiment] Fatal error: ${String(err)}`)
  process.exit(1)
})
