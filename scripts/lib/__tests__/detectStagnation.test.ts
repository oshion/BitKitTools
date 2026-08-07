/**
 * @jest-environment node
 */

import { existsSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import type { ActionLogEntry, TrendData, WeeklyTrendPoint } from '../detectStagnation'
import {
  appendTrendPoint,
  filterCooldownComplete,
  isCooldownComplete,
  isStagnant,
  readActionLog,
  readTrend,
  writeTrend,
} from '../detectStagnation'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a fresh, OS-guaranteed-unique temp directory. `Date.now()`-based
 * "unique" paths collide on fast CI runners when two tests execute within
 * the same millisecond (observed as a flaky failure on ubuntu-latest where
 * a prior test's written action-log.json was reused as another test's
 * "nonexistent" path).
 */
function uniqueTestDir(): string {
  return mkdtempSync(join(tmpdir(), 'bitkittools-test-'))
}

function makeTrendPoint(overrides: Partial<WeeklyTrendPoint> = {}): WeeklyTrendPoint {
  return {
    weekStart: '2026-01-05',
    organicSessions: 100,
    organicClicks: 50,
    ...overrides,
  }
}

function makeActionEntry(overrides: Partial<ActionLogEntry> = {}): ActionLogEntry {
  return {
    id: 'act-001',
    type: 'title-experiment',
    page: '/beer/bac-calculator/',
    deployedAt: '2026-01-01T00:00:00.000Z',
    description: 'A/B test title',
    ...overrides,
  }
}

/** Trend with 4 clearly stagnant weeks (each grows ~2% for both metrics) */
function makeStagnantTrend(): TrendData {
  return {
    weeks: [
      { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 50 },
      { weekStart: '2026-01-12', organicSessions: 102, organicClicks: 51 }, // +2% / +2%
      { weekStart: '2026-01-19', organicSessions: 104, organicClicks: 52 }, // +1.96% / +1.96%
      { weekStart: '2026-01-26', organicSessions: 106, organicClicks: 53 }, // +1.92% / +1.92%
    ],
  }
}

/** Trend with 4 weeks where sessions grow > 5% in one comparison */
function makeHealthyTrend(): TrendData {
  return {
    weeks: [
      { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 50 },
      { weekStart: '2026-01-12', organicSessions: 110, organicClicks: 55 }, // +10% / +10%
      { weekStart: '2026-01-19', organicSessions: 112, organicClicks: 56 }, // +1.8% / +1.8%
      { weekStart: '2026-01-26', organicSessions: 114, organicClicks: 57 }, // +1.8% / +1.8%
    ],
  }
}

// ── isStagnant ────────────────────────────────────────────────────────────────

describe('isStagnant', () => {
  describe('insufficient data', () => {
    test('returns false when weeks array is empty', () => {
      expect(isStagnant({ weeks: [] })).toBe(false)
    })

    test('returns false when fewer than 4 weeks (1 week)', () => {
      expect(isStagnant({ weeks: [makeTrendPoint()] })).toBe(false)
    })

    test('returns false when fewer than 4 weeks (2 weeks)', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 50 },
          { weekStart: '2026-01-12', organicSessions: 100, organicClicks: 50 },
        ],
      }
      expect(isStagnant(trend)).toBe(false)
    })

    test('returns false when exactly 3 weeks', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 50 },
          { weekStart: '2026-01-12', organicSessions: 100, organicClicks: 50 },
          { weekStart: '2026-01-19', organicSessions: 100, organicClicks: 50 },
        ],
      }
      expect(isStagnant(trend)).toBe(false)
    })
  })

  describe('stagnation detection with 4 weeks', () => {
    test('returns true when all 3 comparisons show < 5% growth for both metrics', () => {
      expect(isStagnant(makeStagnantTrend())).toBe(true)
    })

    test('returns false when one comparison shows >= 5% session growth', () => {
      expect(isStagnant(makeHealthyTrend())).toBe(false)
    })

    test('returns false when one comparison shows >= 5% click growth only', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 50 },
          { weekStart: '2026-01-12', organicSessions: 102, organicClicks: 60 }, // sessions +2%, clicks +20%
          { weekStart: '2026-01-19', organicSessions: 104, organicClicks: 61 },
          { weekStart: '2026-01-26', organicSessions: 106, organicClicks: 62 },
        ],
      }
      expect(isStagnant(trend)).toBe(false)
    })

    test('returns false when one comparison shows >= 5% session growth only', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 50 },
          { weekStart: '2026-01-12', organicSessions: 110, organicClicks: 51 }, // sessions +10%, clicks +2%
          { weekStart: '2026-01-19', organicSessions: 112, organicClicks: 52 },
          { weekStart: '2026-01-26', organicSessions: 114, organicClicks: 53 },
        ],
      }
      expect(isStagnant(trend)).toBe(false)
    })

    test('returns true for exactly 4.9% growth (below 5% threshold)', () => {
      // 102/100 - 1 = 2%, 51/50 - 1 = 2% — well below threshold
      // Manually set to just below 5%: 104.9/100 - 1 = 4.9%
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 1000, organicClicks: 1000 },
          { weekStart: '2026-01-12', organicSessions: 1049, organicClicks: 1049 }, // +4.9%
          { weekStart: '2026-01-19', organicSessions: 1098, organicClicks: 1098 }, // ~+4.7%
          { weekStart: '2026-01-26', organicSessions: 1146, organicClicks: 1146 }, // ~+4.4%
        ],
      }
      expect(isStagnant(trend)).toBe(true)
    })

    test('uses only the last 4 weeks when more than 4 are available', () => {
      // First weeks show healthy growth, last 4 are stagnant
      const stagnantLast4 = makeStagnantTrend()
      const trend: TrendData = {
        weeks: [
          { weekStart: '2025-12-01', organicSessions: 10, organicClicks: 5 }, // old, healthy growth before
          { weekStart: '2025-12-08', organicSessions: 200, organicClicks: 100 }, // huge jump
          ...stagnantLast4.weeks,
        ],
      }
      // Even though early weeks had big jump, last 4 weeks are stagnant
      expect(isStagnant(trend)).toBe(true)
    })
  })

  describe('declining clicks trend', () => {
    test('returns true when clicks strictly decrease over 4 weeks', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 100 },
          { weekStart: '2026-01-12', organicSessions: 105, organicClicks: 90 }, // clicks -10%
          { weekStart: '2026-01-19', organicSessions: 110, organicClicks: 80 }, // clicks -11%
          { weekStart: '2026-01-26', organicSessions: 115, organicClicks: 70 }, // clicks -12.5%
        ],
      }
      expect(isStagnant(trend)).toBe(true)
    })

    test('returns false when clicks dip then recover (not strictly decreasing)', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 100 },
          { weekStart: '2026-01-12', organicSessions: 102, organicClicks: 90 },
          { weekStart: '2026-01-19', organicSessions: 104, organicClicks: 95 }, // slightly up
          { weekStart: '2026-01-26', organicSessions: 106, organicClicks: 92 },
        ],
      }
      // Not strictly decreasing, and growth < 5% on sessions/clicks → stagnant via rule 3
      // Actually sessions are slowly growing > 5%? Let's check: 102/100=+2%, 104/102=+1.96%, 106/104=+1.92%, all <5%
      // clicks: 90/100=-10%, 95/90=+5.6% (this comparison has click growth >= 5%), so rule 3 fails
      expect(isStagnant(trend)).toBe(false)
    })

    test('returns false when clicks are stable (equal values, not strictly decreasing)', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 50 },
          { weekStart: '2026-01-12', organicSessions: 100, organicClicks: 50 }, // same
          { weekStart: '2026-01-19', organicSessions: 100, organicClicks: 50 }, // same
          { weekStart: '2026-01-26', organicSessions: 100, organicClicks: 50 }, // same
        ],
      }
      // Not strictly decreasing, but 0% growth → stagnant via rule 3 (0% < 5%)
      expect(isStagnant(trend)).toBe(true)
    })
  })

  describe('zero denominator handling', () => {
    test('returns false (conservative) when previous sessions is 0', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 0, organicClicks: 50 }, // sessions = 0
          { weekStart: '2026-01-12', organicSessions: 0, organicClicks: 51 },
          { weekStart: '2026-01-19', organicSessions: 0, organicClicks: 52 },
          { weekStart: '2026-01-26', organicSessions: 0, organicClicks: 53 },
        ],
      }
      expect(isStagnant(trend)).toBe(false)
    })

    test('returns false (conservative) when previous clicks is 0', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 0 }, // clicks = 0
          { weekStart: '2026-01-12', organicSessions: 101, organicClicks: 0 },
          { weekStart: '2026-01-19', organicSessions: 102, organicClicks: 0 },
          { weekStart: '2026-01-26', organicSessions: 103, organicClicks: 0 },
        ],
      }
      expect(isStagnant(trend)).toBe(false)
    })

    test('does not crash when previous week values are zero', () => {
      const trend: TrendData = {
        weeks: [
          { weekStart: '2026-01-05', organicSessions: 0, organicClicks: 0 },
          { weekStart: '2026-01-12', organicSessions: 0, organicClicks: 0 },
          { weekStart: '2026-01-19', organicSessions: 0, organicClicks: 0 },
          { weekStart: '2026-01-26', organicSessions: 0, organicClicks: 0 },
        ],
      }
      expect(() => isStagnant(trend)).not.toThrow()
      expect(isStagnant(trend)).toBe(false)
    })
  })
})

// ── appendTrendPoint ──────────────────────────────────────────────────────────

describe('appendTrendPoint', () => {
  test('appends a point to an empty trend', () => {
    const trend: TrendData = { weeks: [] }
    const point = makeTrendPoint({ weekStart: '2026-01-05' })
    const result = appendTrendPoint(trend, point)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]).toEqual(point)
  })

  test('appends a point to a non-empty trend', () => {
    const existing = makeTrendPoint({ weekStart: '2026-01-05' })
    const trend: TrendData = { weeks: [existing] }
    const newPoint = makeTrendPoint({ weekStart: '2026-01-12' })
    const result = appendTrendPoint(trend, newPoint)
    expect(result.weeks).toHaveLength(2)
    expect(result.weeks[1]).toEqual(newPoint)
  })

  test('keeps at most 12 weeks — removes oldest when over limit', () => {
    const weeks: WeeklyTrendPoint[] = Array.from({ length: 12 }, (_, i) =>
      makeTrendPoint({ weekStart: `2026-${String(i + 1).padStart(2, '0')}-01` })
    )
    const trend: TrendData = { weeks }
    const newPoint = makeTrendPoint({ weekStart: '2027-01-01' })
    const result = appendTrendPoint(trend, newPoint)
    expect(result.weeks).toHaveLength(12)
    // The oldest (index 0 = '2026-01-01') should be removed
    expect(result.weeks[0]!.weekStart).toBe('2026-02-01')
    // The newest should be the newly added point
    expect(result.weeks[11]!.weekStart).toBe('2027-01-01')
  })

  test('with 11 weeks, appending stays at 12 (no trimming)', () => {
    const weeks: WeeklyTrendPoint[] = Array.from({ length: 11 }, (_, i) =>
      makeTrendPoint({ weekStart: `2026-${String(i + 1).padStart(2, '0')}-01` })
    )
    const trend: TrendData = { weeks }
    const result = appendTrendPoint(trend, makeTrendPoint({ weekStart: '2026-12-01' }))
    expect(result.weeks).toHaveLength(12)
  })

  test('is a pure function — does not mutate the original trend', () => {
    const trend: TrendData = { weeks: [makeTrendPoint()] }
    const originalLength = trend.weeks.length
    appendTrendPoint(trend, makeTrendPoint({ weekStart: '2026-01-12' }))
    expect(trend.weeks).toHaveLength(originalLength)
  })

  test('replaces an existing point with the same weekStart instead of duplicating it', () => {
    const existing = makeTrendPoint({ weekStart: '2026-08-02', organicSessions: 0, organicClicks: 0 })
    const trend: TrendData = { weeks: [existing] }
    const rerun = makeTrendPoint({ weekStart: '2026-08-02', organicSessions: 3, organicClicks: 1 })
    const result = appendTrendPoint(trend, rerun)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]).toEqual(rerun)
  })

  test('replacing a weekStart in the middle of the list keeps other weeks and order intact', () => {
    const weeks: WeeklyTrendPoint[] = [
      makeTrendPoint({ weekStart: '2026-07-19' }),
      makeTrendPoint({ weekStart: '2026-07-26', organicSessions: 5 }),
      makeTrendPoint({ weekStart: '2026-08-02' }),
    ]
    const trend: TrendData = { weeks }
    const rerun = makeTrendPoint({ weekStart: '2026-07-26', organicSessions: 99 })
    const result = appendTrendPoint(trend, rerun)
    expect(result.weeks).toHaveLength(3)
    expect(result.weeks.map((w) => w.weekStart)).toEqual(['2026-07-19', '2026-07-26', '2026-08-02'])
    expect(result.weeks[1]!.organicSessions).toBe(99)
  })
})

// ── isCooldownComplete / filterCooldownComplete ───────────────────────────────

describe('isCooldownComplete', () => {
  const deployedAt = '2026-01-01T00:00:00.000Z'
  const entry = makeActionEntry({ deployedAt })

  test('returns false when fewer than 21 days have elapsed', () => {
    const asOf = new Date('2026-01-20T00:00:00.000Z') // 19 days later
    expect(isCooldownComplete(entry, asOf)).toBe(false)
  })

  test('returns false when exactly 20 days have elapsed', () => {
    const asOf = new Date('2026-01-21T00:00:00.000Z') // 20 days later
    expect(isCooldownComplete(entry, asOf)).toBe(false)
  })

  test('returns true when exactly 21 days have elapsed', () => {
    const asOf = new Date('2026-01-22T00:00:00.000Z') // 21 days later
    expect(isCooldownComplete(entry, asOf)).toBe(true)
  })

  test('returns true when more than 21 days have elapsed', () => {
    const asOf = new Date('2026-03-01T00:00:00.000Z') // ~59 days later
    expect(isCooldownComplete(entry, asOf)).toBe(true)
  })

  test('respects custom cooldownDays parameter', () => {
    const asOf = new Date('2026-01-08T00:00:00.000Z') // 7 days later
    expect(isCooldownComplete(entry, asOf, 7)).toBe(true)
    expect(isCooldownComplete(entry, asOf, 8)).toBe(false)
  })

  test('boundary: exactly 21 days including partial day (hours matter)', () => {
    // 20 days + 23 hours = 20.958 days → not complete
    const asOf20h = new Date('2026-01-21T23:00:00.000Z') // 20d 23h
    expect(isCooldownComplete(entry, asOf20h)).toBe(false)
    // 21 days exactly
    const asOf21d = new Date('2026-01-22T00:00:00.000Z') // 21d 0h
    expect(isCooldownComplete(entry, asOf21d)).toBe(true)
  })
})

describe('filterCooldownComplete', () => {
  test('returns empty array when no entries', () => {
    const asOf = new Date('2026-02-01T00:00:00.000Z')
    expect(filterCooldownComplete([], asOf)).toEqual([])
  })

  test('returns only entries whose cooldown has elapsed', () => {
    const asOf = new Date('2026-01-22T00:00:00.000Z') // 2026-01-22
    const old = makeActionEntry({ id: 'old', deployedAt: '2026-01-01T00:00:00.000Z' }) // 21d ✓
    const recent = makeActionEntry({ id: 'recent', deployedAt: '2026-01-10T00:00:00.000Z' }) // 12d ✗
    const result = filterCooldownComplete([old, recent], asOf)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('old')
  })

  test('returns all entries when all cooldowns have elapsed', () => {
    const asOf = new Date('2026-06-01T00:00:00.000Z')
    const entries = [
      makeActionEntry({ id: 'a', deployedAt: '2026-01-01T00:00:00.000Z' }),
      makeActionEntry({ id: 'b', deployedAt: '2026-02-01T00:00:00.000Z' }),
    ]
    expect(filterCooldownComplete(entries, asOf)).toHaveLength(2)
  })

  test('returns empty array when no cooldowns have elapsed', () => {
    const asOf = new Date('2026-01-05T00:00:00.000Z') // only 4 days after deployment
    const entries = [makeActionEntry({ deployedAt: '2026-01-01T00:00:00.000Z' })]
    expect(filterCooldownComplete(entries, asOf)).toHaveLength(0)
  })
})

// ── readTrend / writeTrend / readActionLog (file I/O with tmpdir) ─────────────

describe('readTrend', () => {
  test('returns { weeks: [] } when file does not exist', () => {
    const nonexistent = join(uniqueTestDir(), 'trend.json')
    expect(readTrend(nonexistent)).toEqual({ weeks: [] })
  })

  test('returns { weeks: [] } when file is malformed JSON', () => {
    const dir = uniqueTestDir()
    const filePath = join(dir, 'trend.json')
    writeFileSync(filePath, 'not valid json', 'utf-8')
    expect(readTrend(filePath)).toEqual({ weeks: [] })
  })
})

describe('writeTrend + readTrend round-trip', () => {
  test('writes and reads back the same data', () => {
    const dir = uniqueTestDir()
    const filePath = join(dir, 'trend.json')
    const trend: TrendData = {
      weeks: [
        { weekStart: '2026-01-05', organicSessions: 100, organicClicks: 50 },
        { weekStart: '2026-01-12', organicSessions: 110, organicClicks: 55 },
      ],
    }
    writeTrend(trend, filePath)
    const result = readTrend(filePath)
    expect(result).toEqual(trend)
  })

  test('creates intermediate directories if they do not exist', () => {
    const dir = resolve(uniqueTestDir(), 'nested', 'deep')
    const filePath = join(dir, 'trend.json')
    const trend: TrendData = { weeks: [] }
    expect(() => writeTrend(trend, filePath)).not.toThrow()
    expect(readTrend(filePath)).toEqual(trend)
  })
})

describe('readActionLog', () => {
  test('returns { actions: [] } when file does not exist', () => {
    const nonexistent = join(uniqueTestDir(), 'action-log.json')
    expect(readActionLog(nonexistent)).toEqual({ actions: [] })
  })

  test('returns { actions: [] } when file is malformed JSON', () => {
    const dir = uniqueTestDir()
    const filePath = join(dir, 'action-log.json')
    writeFileSync(filePath, '{ broken', 'utf-8')
    expect(readActionLog(filePath)).toEqual({ actions: [] })
  })

  test('reads a valid action log', () => {
    const dir = uniqueTestDir()
    const filePath = join(dir, 'action-log.json')
    const log = { actions: [makeActionEntry()] }
    writeFileSync(filePath, JSON.stringify(log), 'utf-8')
    expect(readActionLog(filePath)).toEqual(log)
  })

  test('does NOT auto-create the file when it does not exist', () => {
    const nonexistent = join(uniqueTestDir(), 'action-log.json')
    readActionLog(nonexistent)
    expect(existsSync(nonexistent)).toBe(false)
  })
})
