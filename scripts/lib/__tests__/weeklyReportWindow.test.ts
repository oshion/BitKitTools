import { getWeeklyReportWindow } from '../weeklyReportWindow'

describe('getWeeklyReportWindow', () => {
  test('Monday cron run resolves to the just-completed Sat-Fri week', () => {
    // 2026-08-10 is a Monday; today - 2d = Saturday 08-08.
    const today = new Date('2026-08-10T00:00:00.000Z')
    expect(getWeeklyReportWindow(today)).toEqual({
      start: '2026-08-01',
      end: '2026-08-07',
    })
  })

  test('advances by exactly one week on the following Monday', () => {
    const today = new Date('2026-08-17T00:00:00.000Z')
    expect(getWeeklyReportWindow(today)).toEqual({
      start: '2026-08-08',
      end: '2026-08-14',
    })
  })

  test('a mid-week manual dispatch resolves to the same completed window as the prior Monday', () => {
    // Wednesday, before the new week's Friday is 2 days old yet.
    const today = new Date('2026-08-12T00:00:00.000Z')
    expect(getWeeklyReportWindow(today)).toEqual({
      start: '2026-08-01',
      end: '2026-08-07',
    })
  })

  test('rolls over to the new week as soon as its Friday is 2+ days old', () => {
    // Sunday 08-16: today - 2d = Friday 08-14, the new week's own end date.
    const today = new Date('2026-08-16T00:00:00.000Z')
    expect(getWeeklyReportWindow(today)).toEqual({
      start: '2026-08-08',
      end: '2026-08-14',
    })
  })

  test('handles a month boundary correctly', () => {
    const today = new Date('2026-09-07T00:00:00.000Z')
    expect(getWeeklyReportWindow(today)).toEqual({
      start: '2026-08-29',
      end: '2026-09-04',
    })
  })

  test('window always spans exactly 7 days, Saturday to Friday', () => {
    const today = new Date('2026-08-10T00:00:00.000Z')
    const { start, end } = getWeeklyReportWindow(today)
    const startDate = new Date(`${start}T00:00:00.000Z`)
    const endDate = new Date(`${end}T00:00:00.000Z`)
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

    expect(diffDays).toBe(6)
    expect(startDate.getUTCDay()).toBe(6) // Saturday
    expect(endDate.getUTCDay()).toBe(5) // Friday
  })
})
