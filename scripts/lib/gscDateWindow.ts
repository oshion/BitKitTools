/**
 * GSC Backfill Date Window
 *
 * Search Console click counts can continue to be revised for a few days
 * after the initial 2-day freshness lag — impressions settle quickly, but
 * clicks go through additional spam/bot filtering before Google finalizes
 * them. A single one-time fetch at exactly "2 days ago" can permanently miss
 * clicks that Google attributes later, because collect-analytics.ts never
 * re-queries a date once its raw file has been written.
 *
 * This computes a rolling window of dates to re-fetch every run, so each
 * date's raw file gets refreshed with the latest available numbers until it
 * ages out of process-analytics.ts's own REPROCESS_WINDOW_DAYS reprocessing
 * window (after that point, refetching would be pointless since
 * process-analytics.ts would never re-read the updated raw file anyway).
 */

/** GSC data is not reliably queryable before this many days of lag. */
export const GSC_MIN_LAG_DAYS = 2

/**
 * Must stay in sync with REPROCESS_WINDOW_DAYS in scripts/process-analytics.ts.
 * Not imported directly: process-analytics.ts calls main() unconditionally
 * outside of NODE_ENV=test, so importing it as a module would trigger a live
 * run as a side effect.
 */
export const GSC_BACKFILL_WINDOW_DAYS = 5

/**
 * Returns the YYYY-MM-DD dates to (re-)fetch from the GSC API this run:
 * every date from `GSC_MIN_LAG_DAYS` old up to `windowDays` old, relative to
 * `today`, ordered from freshest (smallest lag) to oldest.
 */
export function getGscBackfillDates(
  today: Date,
  windowDays: number = GSC_BACKFILL_WINDOW_DAYS
): string[] {
  const dates: string[] = []
  for (let offset = GSC_MIN_LAG_DAYS; offset <= windowDays; offset++) {
    const d = new Date(today)
    d.setDate(d.getDate() - offset)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}
