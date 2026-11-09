import { parseReportResponse, weekLabel, buildFallbackHistoryEntry } from '../reportResponse'
import type { WeeklyReportData } from '../aggregateWeeklyReport'

describe('parseReportResponse', () => {
  it('splits report and history when all delimiters are present', () => {
    const text = '===REPORT===\n# 리포트\n===HISTORY===\n2026년 요약\n===END==='
    expect(parseReportResponse(text)).toEqual({ report: '# 리포트', historyEntry: '2026년 요약' })
  })

  it('keeps the history entry when ===END=== is missing', () => {
    const text = '===REPORT===\n# 리포트\n===HISTORY===\n2026년 요약'
    expect(parseReportResponse(text)).toEqual({ report: '# 리포트', historyEntry: '2026년 요약' })
  })

  it('returns null history when the model omitted the HISTORY block', () => {
    const text = '===REPORT===\n# 리포트 본문만'
    expect(parseReportResponse(text)).toEqual({ report: '# 리포트 본문만', historyEntry: null })
  })

  it('falls back to the full text when there are no delimiters at all', () => {
    expect(parseReportResponse('그냥 텍스트')).toEqual({ report: '그냥 텍스트', historyEntry: null })
  })

  it('treats an empty HISTORY block as missing', () => {
    expect(parseReportResponse('===REPORT===\nA\n===HISTORY===\n \n===END===').historyEntry).toBeNull()
  })
})

describe('weekLabel', () => {
  // The label follows the month that holds most of the Sat-Fri window (its middle day),
  // matching the labels already written in data/history.md.
  it.each([
    ['2026-10-17', '2026년 10월 3주차'],
    ['2026-10-24', '2026년 10월 4주차'],
    ['2026-10-31', '2026년 11월 1주차'],
  ])('labels the window starting %s as %s', (start, label) => {
    expect(weekLabel(start)).toBe(label)
  })
})

describe('buildFallbackHistoryEntry', () => {
  const data = {
    periodStart: '2026-10-31',
    periodEnd: '2026-11-06',
    totals: { impressions: 383, clicks: 5, sessions: 26 },
    topPerformingPages: [
      { path: '/baby/temperament-quiz/', clicks: 3, impressions: 38, ctr: 0.0789 },
      { path: '/baby/height-predictor/', clicks: 1, impressions: 19, ctr: 0.0526 },
      { path: '/beer/bac-calculator/', clicks: 0, impressions: 29, ctr: 0 },
    ],
  } as unknown as WeeklyReportData

  it('summarizes the week deterministically with week-over-week numbers', () => {
    const entry = buildFallbackHistoryEntry(data, { organicClicks: 5, organicSessions: 8 })
    expect(entry.startsWith('2026년 11월 1주차:')).toBe(true)
    expect(entry).toContain('클릭 5→5건')
    expect(entry).toContain('노출 383회')
    expect(entry).toContain('세션 8→26건')
    expect(entry).toContain('/baby/temperament-quiz/ 3')
    expect(entry).toContain('/baby/height-predictor/ 1')
    expect(entry).not.toContain('bac-calculator')
    expect(entry).toContain('자동 생성')
  })

  it('omits the previous value when there is no previous week', () => {
    const entry = buildFallbackHistoryEntry(data, undefined)
    expect(entry).toContain('클릭 5건')
    expect(entry).toContain('세션 26건')
  })
})
