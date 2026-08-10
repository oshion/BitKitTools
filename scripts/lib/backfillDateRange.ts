/**
 * Backfill Date Range
 *
 * Pure date-range expansion for scripts/backfill-analytics.ts. Kept separate
 * from the entry-point script (which calls main() unconditionally outside
 * NODE_ENV=test) so the range/validation logic can be unit tested in
 * isolation, following the same pattern as scripts/lib/gscDateWindow.ts.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function assertValidIsoDate(label: string, value: string): void {
  // JS Date silently rolls over out-of-range components (e.g. "2026-02-30" →
  // March 2), so malformed-but-parseable dates are caught by round-tripping
  // through toISOString() rather than relying on Number.isNaN alone.
  const isValid =
    ISO_DATE_RE.test(value) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  if (!isValid) {
    throw new Error(`[backfillDateRange] ${label} must be a valid YYYY-MM-DD date, got: "${value}"`)
  }
}

/**
 * Returns every YYYY-MM-DD date from `start` to `end`, inclusive, ascending.
 * Throws if either date is malformed or if `start` is after `end`.
 */
export function parseDateRange(start: string, end: string): string[] {
  assertValidIsoDate('start', start)
  assertValidIsoDate('end', end)

  const startDate = new Date(`${start}T00:00:00Z`)
  const endDate = new Date(`${end}T00:00:00Z`)

  if (startDate.getTime() > endDate.getTime()) {
    throw new Error(`[backfillDateRange] start (${start}) must not be after end (${end})`)
  }

  const dates: string[] = []
  const cursor = new Date(startDate)
  while (cursor.getTime() <= endDate.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}
