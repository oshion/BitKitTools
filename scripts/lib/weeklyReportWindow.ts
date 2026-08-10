/**
 * Weekly Report Window
 *
 * The weekly report covers a calendar Saturday-to-Friday week, not a naive
 * "most recent 7 processed files" rolling window. The window is anchored so
 * its end never relies on data newer than GSC's ~2-day freshness lag (see
 * gscDateWindow.ts): reference = today - 2 days, then the window's Friday
 * end is the most recent Friday on or before that reference date, and the
 * window's Saturday start is 6 days before that Friday.
 *
 * weekly-report.yml runs Monday 09:00 KST, where today - 2d lands on
 * Saturday and the resulting window is the just-completed Sat-Fri week
 * (e.g. run on Monday 2026-08-10 -> window 2026-08-01..2026-08-07). The same
 * formula degrades gracefully for a manual dispatch on any other weekday,
 * always resolving to the most recent fully-elapsed Sat-Fri week.
 */

/** Date#getDay(): Sunday=0 ... Friday=5, Saturday=6 */
const FRIDAY = 5

export interface WeeklyReportWindow {
  /** YYYY-MM-DD, Saturday */
  start: string
  /** YYYY-MM-DD, Friday */
  end: string
}

export function getWeeklyReportWindow(today: Date): WeeklyReportWindow {
  const reference = new Date(today)
  reference.setDate(reference.getDate() - 2)

  const daysSinceFriday = (reference.getDay() - FRIDAY + 7) % 7
  const end = new Date(reference)
  end.setDate(end.getDate() - daysSinceFriday)

  const start = new Date(end)
  start.setDate(start.getDate() - 6)

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}
