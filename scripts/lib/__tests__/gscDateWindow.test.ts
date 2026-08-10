import { GSC_MIN_LAG_DAYS, getGscBackfillDates } from '../gscDateWindow'

describe('getGscBackfillDates', () => {
  test('returns dates from 2 days ago to windowDays ago, freshest first', () => {
    const today = new Date('2026-08-10T00:00:00.000Z')
    const result = getGscBackfillDates(today, 5)
    expect(result).toEqual([
      '2026-08-08',
      '2026-08-07',
      '2026-08-06',
      '2026-08-05',
    ])
  })

  test('never includes a date newer than GSC_MIN_LAG_DAYS ago', () => {
    const today = new Date('2026-08-10T00:00:00.000Z')
    const result = getGscBackfillDates(today, 5)
    const newest = result[0]!
    const expectedNewest = new Date(today)
    expectedNewest.setDate(expectedNewest.getDate() - GSC_MIN_LAG_DAYS)
    expect(newest).toBe(expectedNewest.toISOString().slice(0, 10))
  })

  test('respects a custom windowDays value', () => {
    const today = new Date('2026-08-10T00:00:00.000Z')
    const result = getGscBackfillDates(today, 3)
    expect(result).toEqual(['2026-08-08', '2026-08-07'])
  })

  test('windowDays smaller than GSC_MIN_LAG_DAYS returns an empty array', () => {
    const today = new Date('2026-08-10T00:00:00.000Z')
    const result = getGscBackfillDates(today, 1)
    expect(result).toEqual([])
  })

  test('handles month boundaries correctly', () => {
    const today = new Date('2026-09-02T00:00:00.000Z')
    const result = getGscBackfillDates(today, 5)
    expect(result).toEqual([
      '2026-08-31',
      '2026-08-30',
      '2026-08-29',
      '2026-08-28',
    ])
  })
})
