/**
 * Unmatched Query History
 *
 * Maintains a rolling history of weekly unmatched queries — GSC queries that
 * were observed but do not match any existing tool's keywords or titles.
 *
 * Used to detect recurring unmatched queries that may signal a gap in the tool
 * catalogue, enabling "tool research spec" generation.
 *
 * Mirrors the structure and patterns of topPagesHistory.ts, but tracks
 * query strings instead of page paths.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeeklyUnmatchedQueriesPoint {
  weekStart: string
  /** Unmatched query strings for this week (above minimum impression threshold). */
  queries: string[]
}

export interface UnmatchedQueryHistory {
  /** Oldest first, newest last. Maximum MAX_HISTORY_WEEKS entries. */
  weeks: WeeklyUnmatchedQueriesPoint[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_HISTORY_WEEKS = 12
const DEFAULT_MIN_CONSECUTIVE_WEEKS = 2

const DEFAULT_UNMATCHED_QUERY_HISTORY_PATH = resolve(
  process.cwd(),
  'data',
  'processed',
  'unmatched-query-history.json'
)

// ── I/O ───────────────────────────────────────────────────────────────────────

/** Read unmatched query history. Returns `{ weeks: [] }` if the file does not exist. */
export function readUnmatchedQueryHistory(
  filePath: string = DEFAULT_UNMATCHED_QUERY_HISTORY_PATH
): UnmatchedQueryHistory {
  if (!existsSync(filePath)) {
    return { weeks: [] }
  }
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as UnmatchedQueryHistory
  } catch {
    return { weeks: [] }
  }
}

/** Write unmatched query history (creates directory if needed). */
export function writeUnmatchedQueryHistory(
  history: UnmatchedQueryHistory,
  filePath: string = DEFAULT_UNMATCHED_QUERY_HISTORY_PATH
): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8')
}

// ── Pure Functions ────────────────────────────────────────────────────────────

/**
 * Appends a new weekly point to the history, maintaining a rolling window of
 * MAX_HISTORY_WEEKS (12) weeks. Oldest entries are removed when the limit is exceeded.
 *
 * If a point with the same `weekStart` already exists (e.g. a re-run on the same day),
 * it is replaced in place rather than appended — prevents duplicate weeks.
 */
export function appendUnmatchedQueriesPoint(
  history: UnmatchedQueryHistory,
  point: WeeklyUnmatchedQueriesPoint
): UnmatchedQueryHistory {
  const existingIndex = history.weeks.findIndex((w) => w.weekStart === point.weekStart)

  if (existingIndex !== -1) {
    const weeks = [...history.weeks]
    weeks[existingIndex] = point
    return { weeks }
  }

  const weeks = [...history.weeks, point]
  const trimmed =
    weeks.length > MAX_HISTORY_WEEKS ? weeks.slice(weeks.length - MAX_HISTORY_WEEKS) : weeks
  return { weeks: trimmed }
}

/**
 * Returns queries that appeared in the unmatched queries list for at least
 * `minConsecutiveWeeks` consecutive recent weeks (default 2).
 *
 * Uses the most recent N weeks of the history. If fewer than
 * `minConsecutiveWeeks` data points are available, returns an empty array —
 * avoids premature signals from insufficient data.
 *
 * A query "appears" in a week if it is present in that week's `queries` array.
 * Matching is exact (case-sensitive).
 */
export function findRecurringQueries(
  history: UnmatchedQueryHistory,
  minConsecutiveWeeks: number = DEFAULT_MIN_CONSECUTIVE_WEEKS
): string[] {
  const { weeks } = history

  if (weeks.length < minConsecutiveWeeks) {
    return []
  }

  const recentWeeks = weeks.slice(weeks.length - minConsecutiveWeeks)

  // Build a set for each week's queries
  const querySetsPerWeek: Set<string>[] = recentWeeks.map(
    (w) => new Set(w.queries)
  )

  // Collect all queries across the recent window
  const allQueries = new Set<string>()
  for (const querySet of querySetsPerWeek) {
    for (const q of querySet) {
      allQueries.add(q)
    }
  }

  // Return only queries that appeared in every week of the window
  const recurring: string[] = []
  for (const query of allQueries) {
    if (querySetsPerWeek.every((querySet) => querySet.has(query))) {
      recurring.push(query)
    }
  }

  return recurring
}
