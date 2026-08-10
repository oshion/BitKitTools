import { parseArgs } from '../backfill-analytics'

describe('parseArgs', () => {
  test('parses --start and --end flags', () => {
    expect(parseArgs(['--start', '2026-08-01', '--end', '2026-08-09'])).toEqual({
      start: '2026-08-01',
      end: '2026-08-09',
    })
  })

  test('works regardless of flag order', () => {
    expect(parseArgs(['--end', '2026-08-09', '--start', '2026-08-01'])).toEqual({
      start: '2026-08-01',
      end: '2026-08-09',
    })
  })

  test('throws when --start is missing', () => {
    expect(() => parseArgs(['--end', '2026-08-09'])).toThrow(/Usage/)
  })

  test('throws when --end is missing', () => {
    expect(() => parseArgs(['--start', '2026-08-01'])).toThrow(/Usage/)
  })

  test('throws when both flags are missing', () => {
    expect(() => parseArgs([])).toThrow(/Usage/)
  })
})
