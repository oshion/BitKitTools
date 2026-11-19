import type { WeeklyReportData } from './aggregateWeeklyReport'

/**
 * "YYYY년 MM월 N주차" for a Sat–Fri window starting at `start` (YYYY-MM-DD). Uses the
 * window's middle day (start + 3) so a window spanning two months is labelled by the
 * month that holds most of it, and N = ceil(day / 7) — consistent with the labels
 * already in data/history.md (10-24~10-30 → 10월 4주차, 10-31~11-06 → 11월 1주차).
 */
export function weekLabel(start: string): string {
  const middle = new Date(`${start}T00:00:00.000Z`)
  middle.setUTCDate(middle.getUTCDate() + 3)
  const year = middle.getUTCFullYear()
  const month = String(middle.getUTCMonth() + 1).padStart(2, '0')
  const week = Math.ceil(middle.getUTCDate() / 7)
  return `${year}년 ${month}월 ${week}주차`
}

/**
 * Weekly line for data/history.md. Only facts from the aggregated data, because later
 * specs read this file; decisions are added by /report-review.
 */
export function buildFallbackHistoryEntry(
  data: Pick<WeeklyReportData, 'periodStart' | 'totals' | 'topPerformingPages'>,
  previousWeek: { organicClicks: number; organicSessions: number } | undefined
): string {
  const change = (current: number, previous: number | undefined, unit: string): string =>
    previous === undefined ? `${current}${unit}` : `${previous}→${current}${unit}`

  const clickPages = data.topPerformingPages
    .filter((p) => p.clicks > 0)
    .map((p) => `${p.path} ${p.clicks}`)
    .join('·')

  const parts = [
    `클릭 ${change(data.totals.clicks, previousWeek?.organicClicks, '건')}, 노출 ${data.totals.impressions}회, 세션 ${change(data.totals.sessions, previousWeek?.organicSessions, '건')}`,
    `클릭 발생: ${clickPages || '없음'}`,
    '(자동 생성 — 집계값만 기록, 해석과 결정은 /report-review에서 보완)',
  ]
  return `${weekLabel(data.periodStart)}: ${parts.join(' / ')}`
}
