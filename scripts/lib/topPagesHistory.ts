/**
 * Top Pages History
 *
 * Maintains a rolling history of weekly top-performing pages.
 * Used to detect pages that are consistently top performers over multiple weeks,
 * enabling "growth spec" generation for already-proven pages.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeeklyTopPage {
  page: string
  clicks: number
}

export interface WeeklyTopPagesPoint {
  weekStart: string
  pages: WeeklyTopPage[]
}

export interface TopPagesHistory {
  /** Oldest first, newest last. Maximum MAX_HISTORY_WEEKS entries. */
  weeks: WeeklyTopPagesPoint[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_HISTORY_WEEKS = 12
const DEFAULT_MIN_CONSECUTIVE_WEEKS = 3

const DEFAULT_TOP_PAGES_HISTORY_PATH = resolve(
  process.cwd(),
  'data',
  'processed',
  'top-pages-history.json'
)

// ── I/O ───────────────────────────────────────────────────────────────────────

/** Read top pages history. Returns `{ weeks: [] }` if the file does not exist. */
export function readTopPagesHistory(filePath: string = DEFAULT_TOP_PAGES_HISTORY_PATH): TopPagesHistory {
  if (!existsSync(filePath)) {
    return { weeks: [] }
  }
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as TopPagesHistory
  } catch {
    return { weeks: [] }
  }
}

/** Write top pages history (creates directory if needed). */
export function writeTopPagesHistory(
  history: TopPagesHistory,
  filePath: string = DEFAULT_TOP_PAGES_HISTORY_PATH
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
export function appendTopPagesPoint(
  history: TopPagesHistory,
  point: WeeklyTopPagesPoint
): TopPagesHistory {
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
 * Returns pages that appeared in the top performers list for at least
 * `minConsecutiveWeeks` consecutive weeks (using the most recent N weeks).
 *
 * If fewer than `minConsecutiveWeeks` data points are available, returns an
 * empty array — avoids premature signals from insufficient data.
 */
export function findConsecutiveTopPerformers(
  history: TopPagesHistory,
  minConsecutiveWeeks: number = DEFAULT_MIN_CONSECUTIVE_WEEKS
): string[] {
  const { weeks } = history

  if (weeks.length < minConsecutiveWeeks) {
    return []
  }

  const recentWeeks = weeks.slice(weeks.length - minConsecutiveWeeks)

  // Build a set for each week's pages
  const pageSetsPerWeek: Set<string>[] = recentWeeks.map(
    (w) => new Set(w.pages.map((p) => p.page))
  )

  // Collect all pages across the recent window
  const allPages = new Set<string>()
  for (const pageSet of pageSetsPerWeek) {
    for (const page of pageSet) {
      allPages.add(page)
    }
  }

  // Return only pages that appeared in every week of the window
  const consecutive: string[] = []
  for (const page of allPages) {
    if (pageSetsPerWeek.every((pageSet) => pageSet.has(page))) {
      consecutive.push(page)
    }
  }

  return consecutive
}
