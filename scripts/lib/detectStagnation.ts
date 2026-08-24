/**
 * Stagnation Detection
 *
 * Maintains a rolling trend log (data/processed/trend.json) of weekly organic
 * sessions/clicks and determines whether the site is stagnating.
 *
 * Also provides action-log helpers for cooldown tracking.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import type { LocalizedText } from '../../src/types/tool'

// ── Trend Types ───────────────────────────────────────────────────────────────

export interface WeeklyTrendPoint {
  /** ISO date (YYYY-MM-DD), the week's report aggregation start date */
  weekStart: string
  organicSessions: number
  organicClicks: number
}

export interface TrendData {
  /** Oldest first, newest last. Maximum 12 entries. */
  weeks: WeeklyTrendPoint[]
}

// ── Action Log Types ──────────────────────────────────────────────────────────

export interface ActionLogEntry {
  id: string
  /** Free-form string, e.g. 'title-experiment', 'content-update' */
  type: string
  page: string
  /** ISO timestamp */
  deployedAt: string
  description: string
  /** ISO timestamp; set once reindex after deployment is confirmed via GSC lastCrawlTime */
  cooldownStartedAt?: string
  // ── title-experiment specific optional fields ──────────────────────────────
  /** Which attempt this is for the page (1–3). Only set for type='title-experiment'. */
  attemptNumber?: number
  /** The original title before any experiments started. Used for rollback. */
  originalTitle?: LocalizedText
  /** The original description before any experiments started. Used for rollback. */
  originalDescription?: LocalizedText
  /** CTR measured at experiment start time — baseline for outcome comparison. */
  baselineCtr?: number
  /**
   * Lifecycle state of this action. 'in-progress' | 'kept' | 'rolled-back'
   * apply to title-experiment entries; 'no-improvement' applies to
   * content-update entries (see Step 0 of report-review.md) — unlike a
   * title experiment, a content-update change is not auto-reverted, so
   * 'no-improvement' just means the CTR check found no gain.
   */
  status?: 'in-progress' | 'kept' | 'rolled-back' | 'no-improvement'
}

export interface ActionLog {
  actions: ActionLogEntry[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_TREND_WEEKS = 12
const MIN_WEEKS_FOR_STAGNATION = 4
const DEFAULT_COOLDOWN_DAYS = 21
/** +5% growth threshold — below this, a metric is considered stagnant */
const GROWTH_THRESHOLD = 0.05

const DEFAULT_TREND_PATH = resolve(process.cwd(), 'data', 'processed', 'trend.json')
const DEFAULT_ACTION_LOG_PATH = resolve(process.cwd(), 'data', 'action-log.json')

// ── Trend I/O ─────────────────────────────────────────────────────────────────

/** Read trend data. Returns `{ weeks: [] }` if the file does not exist. */
export function readTrend(filePath: string = DEFAULT_TREND_PATH): TrendData {
  if (!existsSync(filePath)) {
    return { weeks: [] }
  }
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as TrendData
  } catch {
    return { weeks: [] }
  }
}

/**
 * Pure function: append a new trend point and trim to MAX_TREND_WEEKS.
 * Oldest entry is removed when the limit is exceeded.
 *
 * If a point with the same `weekStart` already exists (e.g. a manual
 * workflow re-run on the same day), it is replaced in place rather than
 * appended again — otherwise a re-run would silently duplicate a week and
 * skew the "last 4 weeks" stagnation window.
 */
export function appendTrendPoint(trend: TrendData, point: WeeklyTrendPoint): TrendData {
  const existingIndex = trend.weeks.findIndex((w) => w.weekStart === point.weekStart)

  if (existingIndex !== -1) {
    const weeks = [...trend.weeks]
    weeks[existingIndex] = point
    return { weeks }
  }

  const weeks = [...trend.weeks, point]
  const trimmed =
    weeks.length > MAX_TREND_WEEKS ? weeks.slice(weeks.length - MAX_TREND_WEEKS) : weeks
  return { weeks: trimmed }
}

/** Write trend data to `data/processed/trend.json` (creates directory if needed). */
export function writeTrend(trend: TrendData, filePath: string = DEFAULT_TREND_PATH): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(trend, null, 2), 'utf-8')
}

// ── Stagnation Logic ──────────────────────────────────────────────────────────

/**
 * Returns true if the site appears to be stagnating based on recent weekly trend.
 *
 * Rules (all applied to the last 4 weeks):
 * 1. If fewer than 4 weeks of data, always returns false (insufficient data).
 * 2. If organicClicks are strictly decreasing week-over-week → true.
 * 3. If all 3 consecutive week-over-week comparisons show BOTH organicSessions
 *    AND organicClicks growth < +5% → true.
 * 4. If any previous week value is 0 (division by zero), that comparison is
 *    treated conservatively as "not stagnant".
 */
export function isStagnant(trend: TrendData): boolean {
  const { weeks } = trend

  // Rule 1: need at least 4 data points
  if (weeks.length < MIN_WEEKS_FOR_STAGNATION) {
    return false
  }

  const last4 = weeks.slice(weeks.length - MIN_WEEKS_FOR_STAGNATION)

  // Rule 2: strictly decreasing clicks
  if (
    last4[1]!.organicClicks < last4[0]!.organicClicks &&
    last4[2]!.organicClicks < last4[1]!.organicClicks &&
    last4[3]!.organicClicks < last4[2]!.organicClicks
  ) {
    return true
  }

  // Rule 3: all 3 consecutive comparisons are stagnant
  for (let i = 0; i < 3; i++) {
    const prev = last4[i]!
    const curr = last4[i + 1]!

    // Rule 4: if any denominator is 0, treat this comparison as NOT stagnant
    if (prev.organicSessions === 0 || prev.organicClicks === 0) {
      return false
    }

    const sessionGrowth = (curr.organicSessions - prev.organicSessions) / prev.organicSessions
    const clickGrowth = (curr.organicClicks - prev.organicClicks) / prev.organicClicks

    // If either metric grows >= 5%, this comparison is NOT stagnant → overall not stagnant
    if (sessionGrowth >= GROWTH_THRESHOLD || clickGrowth >= GROWTH_THRESHOLD) {
      return false
    }
  }

  return true
}

// ── Action Log I/O ────────────────────────────────────────────────────────────

/**
 * Read action log. Returns `{ actions: [] }` if the file does not exist.
 * Does NOT auto-create the file.
 */
export function readActionLog(filePath: string = DEFAULT_ACTION_LOG_PATH): ActionLog {
  if (!existsSync(filePath)) {
    return { actions: [] }
  }
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as ActionLog
  } catch {
    return { actions: [] }
  }
}

/** Write action log to `data/action-log.json` (creates directory if needed). */
export function writeActionLog(log: ActionLog, filePath: string = DEFAULT_ACTION_LOG_PATH): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(log, null, 2), 'utf-8')
}

// ── Cooldown Helpers ──────────────────────────────────────────────────────────

/**
 * Returns true if at least `cooldownDays` have elapsed since `entry.deployedAt`
 * relative to `asOf`.
 *
 * `asOf` is always an explicit parameter — never call `new Date()` internally —
 * so tests can remain deterministic.
 */
export function isCooldownComplete(
  entry: ActionLogEntry,
  asOf: Date,
  cooldownDays: number = DEFAULT_COOLDOWN_DAYS
): boolean {
  const deployedAt = new Date(entry.deployedAt)
  const diffMs = asOf.getTime() - deployedAt.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= cooldownDays
}

/**
 * Returns only entries whose cooldown period has elapsed (>= 21 days by default).
 */
export function filterCooldownComplete(
  entries: ActionLogEntry[],
  asOf: Date,
  cooldownDays: number = DEFAULT_COOLDOWN_DAYS
): ActionLogEntry[] {
  return entries.filter((e) => isCooldownComplete(e, asOf, cooldownDays))
}
