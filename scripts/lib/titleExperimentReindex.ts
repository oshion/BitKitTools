/**
 * Title Experiment Reindex Tracking
 *
 * Pure functions for determining when a title-experiment page has been
 * re-crawled by Google after deployment, so the cooldown timer can start.
 *
 * Cooldown start point is the actual lastCrawlTime reported by GSC —
 * NOT the deployment time — to avoid counting days before Google even
 * sees the new title.
 *
 * Types are defined here (not in check-indexing-status.ts) because this
 * is a pure library that scripts can import without triggering side effects.
 */

import type { ActionLog } from './detectStagnation'

// ── Shared Indexing Status Types ──────────────────────────────────────────────
// These mirror what check-indexing-status.ts persists to data/indexing-status.json.
// Both this file and check-indexing-status.ts use these types as the canonical
// shape, ensuring the on-disk format stays in sync.

export interface IndexingStatusEntry {
  verdict: string
  coverageState: string
  lastCheckedAt: string
  /** ISO timestamp of the last time Google crawled this URL, as reported by GSC */
  lastCrawlTime?: string
}

export type IndexingStatusMap = Record<string, IndexingStatusEntry>

// ── Output Type ───────────────────────────────────────────────────────────────

export interface ReindexConfirmation {
  actionLogEntryId: string
  /** ISO timestamp to use as cooldownStartedAt — equals lastCrawlTime of the confirmed URL */
  cooldownStartedAt: string
}

// ── Core Logic ────────────────────────────────────────────────────────────────

/**
 * Given an action log and the current indexing-status snapshot, returns
 * confirmations for every title-experiment entry that:
 *   1. Does NOT yet have a `cooldownStartedAt` (cooldown not yet started)
 *   2. Has a corresponding URL entry in `indexingStatus` whose `lastCrawlTime`
 *      is present AND is strictly after `deployedAt`
 *
 * The confirmed `cooldownStartedAt` value equals the `lastCrawlTime` of the
 * matched URL — this is the earliest moment we know Google saw the new title.
 *
 * URL matching: the action log stores en-locale paths (e.g. `/beer/bac-calculator`
 * with or without a trailing slash). We normalise to no-trailing-slash and check
 * all possible domain-prefixed variants that check-indexing-status.ts would have
 * written (en and ko).
 *
 * If multiple locale variants exist in indexingStatus, the earliest
 * lastCrawlTime that is after deployedAt is used.
 *
 * Entries that are already cooldown-started, have no matching indexing entry,
 * or whose lastCrawlTime predates deployedAt are silently excluded —
 * they remain "pending" for the next daily run.
 */
export function findReindexedExperiments(
  actionLog: ActionLog,
  indexingStatus: IndexingStatusMap,
  siteUrl: string = 'https://bitkittools.com'
): ReindexConfirmation[] {
  const results: ReindexConfirmation[] = []

  for (const entry of actionLog.actions) {
    // Only process title-experiment entries that have not yet started cooldown
    if (entry.type !== 'title-experiment') continue
    if (entry.cooldownStartedAt !== undefined) continue

    const deployedAt = new Date(entry.deployedAt)

    // Normalise page path: strip trailing slash if present
    const rawPath = entry.page
    const normPath = rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath

    // Build candidate URL keys as stored by check-indexing-status.ts
    const candidateUrls: string[] = [
      `${siteUrl}${normPath}`,         // en (no trailing slash)
      `${siteUrl}${normPath}/`,         // en (trailing slash variant)
      `${siteUrl}/ko${normPath}`,       // ko (no trailing slash)
      `${siteUrl}/ko${normPath}/`,      // ko (trailing slash variant)
    ]

    // Find the earliest lastCrawlTime that is after deployedAt
    let earliest: Date | null = null
    for (const url of candidateUrls) {
      const statusEntry = indexingStatus[url]
      if (!statusEntry?.lastCrawlTime) continue

      const crawlTime = new Date(statusEntry.lastCrawlTime)
      // Strictly after deployedAt — equal timestamps mean crawled at exact deploy
      // moment, which is unlikely but acceptable to treat as not-yet-confirmed
      if (crawlTime <= deployedAt) continue

      if (earliest === null || crawlTime < earliest) {
        earliest = crawlTime
      }
    }

    if (earliest !== null) {
      results.push({
        actionLogEntryId: entry.id,
        cooldownStartedAt: earliest.toISOString(),
      })
    }
  }

  return results
}
