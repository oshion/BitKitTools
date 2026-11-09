import type { WeeklyReportData } from './aggregateWeeklyReport'

export interface ParsedReportResponse {
  report: string
  historyEntry: string | null
}

/**
 * Splits the weekly-report model response into the report body and the one-line
 * history entry. Expected format:
 *
 *   ===REPORT=== … ===HISTORY=== … ===END===
 *
 * Fail-soft: without ===REPORT=== the whole text becomes the report. A HISTORY block
 * without ===END=== still counts (the model sometimes drops the closing marker).
 * An omitted or empty HISTORY block returns null so the caller can fall back to
 * buildFallbackHistoryEntry() — the 2026-11-09 report omitted it and history.md
 * silently missed a week.
 */
export function parseReportResponse(text: string): ParsedReportResponse {
  const reportStart = text.indexOf('===REPORT===')
  if (reportStart === -1) return { report: text.trim(), historyEntry: null }

  const afterReport = text.slice(reportStart + '===REPORT==='.length)
  const historyStart = afterReport.indexOf('===HISTORY===')
  if (historyStart === -1) return { report: afterReport.trim(), historyEntry: null }

  const report = afterReport.slice(0, historyStart).trim()
  const afterHistory = afterReport.slice(historyStart + '===HISTORY==='.length)
  const endIndex = afterHistory.indexOf('===END===')
  const historyEntry = (endIndex === -1 ? afterHistory : afterHistory.slice(0, endIndex)).trim()
  return { report, historyEntry: historyEntry === '' ? null : historyEntry }
}

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
 * Deterministic history line used when the model omits the HISTORY block, so
 * data/history.md never skips a week. Only facts from the aggregated data — no
 * interpretation.
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
    '(자동 생성 — 리포트 응답에 HISTORY 블록이 없어 집계값만 기록, /report-review에서 보완)',
  ]
  return `${weekLabel(data.periodStart)}: ${parts.join(' / ')}`
}
