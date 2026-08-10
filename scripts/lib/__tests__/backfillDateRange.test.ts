import { parseDateRange } from '../backfillDateRange'

describe('parseDateRange', () => {
  test('returns a single date when start equals end', () => {
    expect(parseDateRange('2026-08-01', '2026-08-01')).toEqual(['2026-08-01'])
  })

  test('returns every date in an ascending inclusive range', () => {
    expect(parseDateRange('2026-08-01', '2026-08-04')).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
    ])
  })

  test('handles a month boundary correctly', () => {
    expect(parseDateRange('2026-07-30', '2026-08-02')).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ])
  })

  test('throws when start is after end', () => {
    expect(() => parseDateRange('2026-08-05', '2026-08-01')).toThrow(
      /must not be after/
    )
  })

  test('throws on a malformed date string', () => {
    expect(() => parseDateRange('2026/08/01', '2026-08-02')).toThrow(
      /valid YYYY-MM-DD/
    )
  })

  test('throws on a calendar-invalid date', () => {
    expect(() => parseDateRange('2026-02-30', '2026-03-01')).toThrow(
      /valid YYYY-MM-DD/
    )
  })
})
