import { REPROCESS_WINDOW_DAYS, shouldProcessDate } from '../process-analytics'

describe('shouldProcessDate', () => {
  const today = new Date('2026-08-10T12:00:00Z')

  test('never-processed dates are always processed, regardless of age', () => {
    expect(shouldProcessDate('2026-08-09', false, today)).toBe(true)
    expect(shouldProcessDate('2025-01-01', false, today)).toBe(true)
  })

  test('already-processed date within the reprocess window is reprocessed', () => {
    // 3 days ago — within default window (5)
    expect(shouldProcessDate('2026-08-07', true, today)).toBe(true)
  })

  test('already-processed date exactly at the window boundary is reprocessed (inclusive)', () => {
    // 5 days ago — exactly REPROCESS_WINDOW_DAYS
    expect(shouldProcessDate('2026-08-05', true, today)).toBe(true)
    expect(REPROCESS_WINDOW_DAYS).toBe(5)
  })

  test('already-processed date just past the window boundary is skipped', () => {
    // 6 days ago — one day past the default window
    expect(shouldProcessDate('2026-08-04', true, today)).toBe(false)
  })

  test('already-processed old date is skipped (settled)', () => {
    expect(shouldProcessDate('2026-01-01', true, today)).toBe(false)
  })

  test('respects a custom reprocessWindowDays override', () => {
    expect(shouldProcessDate('2026-08-04', true, today, 6)).toBe(true)
    expect(shouldProcessDate('2026-08-04', true, today, 1)).toBe(false)
  })
})
