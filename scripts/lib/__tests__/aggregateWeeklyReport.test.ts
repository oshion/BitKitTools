/**
 * @jest-environment node
 */

import type { ProcessedDay, ProcessedPage, ProcessedQuery } from '../../process-analytics'
import { aggregateWeeklyReport, buildTitleExperimentSection } from '../aggregateWeeklyReport'
import type { ActionLog } from '../detectStagnation'

// ── Test Fixtures ─────────────────────────────────────────────────────────────

function makePage(overrides: Partial<ProcessedPage> = {}): ProcessedPage {
  return {
    path: '/beer/bac-calculator/',
    sessions: 10,
    events: { page_view: 10 },
    gscImpressions: 100,
    gscClicks: 5,
    gscAvgPosition: 3.0,
    bounceRate: null,
    ...overrides,
  }
}

function makeQuery(overrides: Partial<ProcessedQuery> = {}): ProcessedQuery {
  return {
    query: 'bac calculator',
    page: '/beer/bac-calculator/',
    country: 'US',
    device: 'desktop',
    impressions: 50,
    clicks: 3,
    ctr: 0.06,
    position: 3.0,
    ...overrides,
  }
}

function makeDay(date: string, overrides: Partial<ProcessedDay> = {}): ProcessedDay {
  return {
    date,
    pages: [makePage()],
    queries: [makeQuery()],
    clarity: null,
    ...overrides,
  }
}

// ── Empty / Edge Cases ────────────────────────────────────────────────────────

describe('aggregateWeeklyReport — empty/edge inputs', () => {
  test('empty array returns zeroed totals and empty arrays', () => {
    const result = aggregateWeeklyReport([])
    expect(result.periodStart).toBe('')
    expect(result.periodEnd).toBe('')
    expect(result.totals).toEqual({ impressions: 0, clicks: 0, sessions: 0 })
    expect(result.topPerformingPages).toEqual([])
    expect(result.zeroCtrPages).toEqual([])
    expect(result.highBouncePages).toEqual([])
    expect(result.ctrDeviations).toEqual([])
    expect(result.risingQueries).toEqual([])
    expect(result.fallingQueries).toEqual([])
  })

  test('single day returns correct totals but empty rising/falling queries', () => {
    const result = aggregateWeeklyReport([makeDay('2026-08-01')])
    expect(result.periodStart).toBe('2026-08-01')
    expect(result.periodEnd).toBe('2026-08-01')
    expect(result.totals.sessions).toBe(10)
    expect(result.totals.impressions).toBe(100)
    expect(result.risingQueries).toEqual([])
    expect(result.fallingQueries).toEqual([])
  })
})

// ── periodStart / periodEnd ───────────────────────────────────────────────────

describe('aggregateWeeklyReport — period boundaries', () => {
  test('sets periodStart to earliest date regardless of input order', () => {
    const days = [
      makeDay('2026-08-03'),
      makeDay('2026-08-01'), // earliest
      makeDay('2026-08-02'),
    ]
    const result = aggregateWeeklyReport(days)
    expect(result.periodStart).toBe('2026-08-01')
    expect(result.periodEnd).toBe('2026-08-03')
  })
})

// ── topPerformingPages ───────────────────────────────────────────────────────

describe('aggregateWeeklyReport — topPerformingPages', () => {
  test('includes only pages with clicks > 0', () => {
    const day = makeDay('2026-08-01', {
      pages: [
        makePage({ path: '/has-clicks/', gscImpressions: 100, gscClicks: 5 }),
        makePage({ path: '/zero-clicks/', gscImpressions: 50, gscClicks: 0 }),
      ],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.topPerformingPages).toHaveLength(1)
    expect(result.topPerformingPages[0]!.path).toBe('/has-clicks/')
  })

  test('orders by clicks descending and computes ctr', () => {
    const day = makeDay('2026-08-01', {
      pages: [
        makePage({ path: '/a/', gscImpressions: 100, gscClicks: 2 }),
        makePage({ path: '/b/', gscImpressions: 100, gscClicks: 10 }),
        makePage({ path: '/c/', gscImpressions: 100, gscClicks: 5 }),
      ],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.topPerformingPages.map((p) => p.path)).toEqual(['/b/', '/c/', '/a/'])
    expect(result.topPerformingPages[0]!.ctr).toBeCloseTo(0.1)
  })

  test('returns at most 5 entries', () => {
    const pages = Array.from({ length: 8 }, (_, i) =>
      makePage({ path: `/page-${i}/`, gscImpressions: 100, gscClicks: i + 1 })
    )
    const day = makeDay('2026-08-01', { pages, queries: [] })
    const result = aggregateWeeklyReport([day])
    expect(result.topPerformingPages).toHaveLength(5)
  })

  test('sums clicks across multiple days for the same page', () => {
    const days = [
      makeDay('2026-08-01', {
        pages: [makePage({ path: '/beer/bac-calculator/', gscImpressions: 50, gscClicks: 2 })],
        queries: [],
      }),
      makeDay('2026-08-02', {
        pages: [makePage({ path: '/beer/bac-calculator/', gscImpressions: 50, gscClicks: 3 })],
        queries: [],
      }),
    ]
    const result = aggregateWeeklyReport(days)
    expect(result.topPerformingPages[0]!.clicks).toBe(5)
    expect(result.topPerformingPages[0]!.impressions).toBe(100)
  })
})

// ── zeroCtrPages ─────────────────────────────────────────────────────────────

describe('aggregateWeeklyReport — zeroCtrPages', () => {
  test('includes pages with impressions > 0 and clicks === 0', () => {
    const day = makeDay('2026-08-01', {
      pages: [
        makePage({ path: '/has-clicks/', gscImpressions: 100, gscClicks: 5 }),
        makePage({ path: '/zero-ctr/', gscImpressions: 50, gscClicks: 0 }),
        makePage({ path: '/no-impressions/', gscImpressions: 0, gscClicks: 0 }),
      ],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.zeroCtrPages).toHaveLength(1)
    expect(result.zeroCtrPages[0]!.path).toBe('/zero-ctr/')
  })

  test('orders by impressions descending', () => {
    const day = makeDay('2026-08-01', {
      pages: [
        makePage({ path: '/a/', gscImpressions: 30, gscClicks: 0 }),
        makePage({ path: '/b/', gscImpressions: 100, gscClicks: 0 }),
        makePage({ path: '/c/', gscImpressions: 50, gscClicks: 0 }),
      ],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.zeroCtrPages.map((p) => p.path)).toEqual(['/b/', '/c/', '/a/'])
  })

  test('returns at most 10 entries', () => {
    const pages = Array.from({ length: 15 }, (_, i) =>
      makePage({ path: `/page-${i}/`, gscImpressions: i + 1, gscClicks: 0 })
    )
    const day = makeDay('2026-08-01', { pages, queries: [] })
    const result = aggregateWeeklyReport([day])
    expect(result.zeroCtrPages).toHaveLength(10)
  })

  test('does not include pages with no impressions', () => {
    const day = makeDay('2026-08-01', {
      pages: [makePage({ path: '/no-impr/', gscImpressions: 0, gscClicks: 0 })],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.zeroCtrPages).toEqual([])
  })
})

// ── highBouncePages ───────────────────────────────────────────────────────────

describe('aggregateWeeklyReport — highBouncePages', () => {
  test('excludes pages with sessions < 5 (noise filter)', () => {
    const day = makeDay('2026-08-01', {
      pages: [
        makePage({ path: '/low-sessions/', sessions: 2, bounceRate: 1.0 }),
        makePage({ path: '/high-sessions/', sessions: 10, bounceRate: 0.8 }),
      ],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    const paths = result.highBouncePages.map((p) => p.path)
    expect(paths).not.toContain('/low-sessions/')
    expect(paths).toContain('/high-sessions/')
  })

  test('includes page with exactly 5 sessions', () => {
    const day = makeDay('2026-08-01', {
      pages: [makePage({ path: '/exactly-5/', sessions: 5, bounceRate: 0.7 })],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.highBouncePages).toHaveLength(1)
    expect(result.highBouncePages[0]!.path).toBe('/exactly-5/')
  })

  test('excludes pages with null bounceRate', () => {
    const day = makeDay('2026-08-01', {
      pages: [makePage({ path: '/no-bounce/', sessions: 20, bounceRate: null })],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.highBouncePages).toEqual([])
  })

  test('orders by bounceRate descending', () => {
    const day = makeDay('2026-08-01', {
      pages: [
        makePage({ path: '/a/', sessions: 10, bounceRate: 0.4 }),
        makePage({ path: '/b/', sessions: 10, bounceRate: 0.9 }),
        makePage({ path: '/c/', sessions: 10, bounceRate: 0.7 }),
      ],
      queries: [],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.highBouncePages.map((p) => p.path)).toEqual(['/b/', '/c/', '/a/'])
  })

  test('returns at most 10 entries', () => {
    const pages = Array.from({ length: 15 }, (_, i) =>
      makePage({ path: `/page-${i}/`, sessions: 10, bounceRate: (i + 1) / 20 })
    )
    const day = makeDay('2026-08-01', { pages, queries: [] })
    const result = aggregateWeeklyReport([day])
    expect(result.highBouncePages).toHaveLength(10)
  })

  test('aggregates bounceRate weighted by sessions across multiple days', () => {
    // Day 1: 10 sessions, bounceRate=0.8 → contribution 8
    // Day 2: 10 sessions, bounceRate=0.4 → contribution 4
    // Expected weighted avg: (8 + 4) / 20 = 0.6
    const days = [
      makeDay('2026-08-01', {
        pages: [makePage({ sessions: 10, bounceRate: 0.8 })],
        queries: [],
      }),
      makeDay('2026-08-02', {
        pages: [makePage({ sessions: 10, bounceRate: 0.4 })],
        queries: [],
      }),
    ]
    const result = aggregateWeeklyReport(days)
    expect(result.highBouncePages).toHaveLength(1)
    expect(result.highBouncePages[0]!.bounceRate).toBeCloseTo(0.6)
  })
})

// ── ctrDeviations ────────────────────────────────────────────────────────────

describe('aggregateWeeklyReport — ctrDeviations', () => {
  test('excludes segments with impressions < 10 (noise filter)', () => {
    const day = makeDay('2026-08-01', {
      pages: [makePage({ path: '/test/', gscImpressions: 200, gscClicks: 20 })],
      queries: [
        // 9 impressions on a segment — below threshold
        makeQuery({ page: '/test/', country: 'KR', device: 'desktop', impressions: 9, clicks: 0 }),
        // 50 impressions on the main segment
        makeQuery({ page: '/test/', country: 'US', device: 'desktop', impressions: 50, clicks: 5 }),
      ],
    })
    const result = aggregateWeeklyReport([day])
    const krDeviations = result.ctrDeviations.filter(
      (d) => d.segmentType === 'country' && d.segment === 'KR'
    )
    expect(krDeviations).toHaveLength(0)
  })

  test('excludes segments with deviationRatio between 0.5 and 2.0 (non-significant)', () => {
    // Overall CTR: 10/100 = 0.1
    // Segment CTR: 7/100 = 0.07 → ratio 0.7 (between 0.5 and 2.0, should be excluded)
    const day = makeDay('2026-08-01', {
      pages: [makePage({ path: '/test/', gscImpressions: 100, gscClicks: 10 })],
      queries: [
        makeQuery({
          page: '/test/',
          country: 'US',
          device: 'desktop',
          impressions: 100,
          clicks: 7,
        }),
      ],
    })
    const result = aggregateWeeklyReport([day])
    expect(result.ctrDeviations).toHaveLength(0)
  })

  test('includes segment with deviationRatio < 0.5 (significantly low CTR)', () => {
    // Overall CTR: 10/100 = 0.1
    // Country KR: 1/30 ≈ 0.033 → ratio ≈ 0.33 < 0.5 → include
    const day = makeDay('2026-08-01', {
      pages: [makePage({ path: '/test/', gscImpressions: 100, gscClicks: 10 })],
      queries: [
        makeQuery({ page: '/test/', country: 'KR', device: 'desktop', impressions: 30, clicks: 1 }),
        makeQuery({ page: '/test/', country: 'US', device: 'desktop', impressions: 70, clicks: 9 }),
      ],
    })
    const result = aggregateWeeklyReport([day])
    const krCountry = result.ctrDeviations.find(
      (d) => d.segmentType === 'country' && d.segment === 'KR'
    )
    expect(krCountry).toBeDefined()
    expect(krCountry!.deviationRatio).toBeLessThan(0.5)
  })

  test('includes segment with deviationRatio >= 2.0 (significantly high CTR)', () => {
    // Overall CTR: 10/100 = 0.1
    // Device mobile: 8/20 = 0.4 → ratio = 4.0 >= 2.0 → include
    const day = makeDay('2026-08-01', {
      pages: [makePage({ path: '/test/', gscImpressions: 100, gscClicks: 10 })],
      queries: [
        makeQuery({
          page: '/test/',
          country: 'US',
          device: 'mobile',
          impressions: 20,
          clicks: 8,
        }),
        makeQuery({
          page: '/test/',
          country: 'US',
          device: 'desktop',
          impressions: 80,
          clicks: 2,
        }),
      ],
    })
    const result = aggregateWeeklyReport([day])
    const mobileDeviation = result.ctrDeviations.find(
      (d) => d.segmentType === 'device' && d.segment === 'mobile'
    )
    expect(mobileDeviation).toBeDefined()
    expect(mobileDeviation!.deviationRatio).toBeGreaterThanOrEqual(2.0)
  })

  test('segmentType is correctly set to country or device', () => {
    // Make a clear country deviation (ratio < 0.5)
    const day = makeDay('2026-08-01', {
      pages: [makePage({ path: '/test/', gscImpressions: 100, gscClicks: 10 })],
      queries: [
        makeQuery({ page: '/test/', country: 'JP', device: 'desktop', impressions: 20, clicks: 0 }),
        makeQuery({ page: '/test/', country: 'US', device: 'desktop', impressions: 80, clicks: 10 }),
      ],
    })
    const result = aggregateWeeklyReport([day])
    const countryDeviations = result.ctrDeviations.filter((d) => d.segmentType === 'country')
    expect(countryDeviations.length).toBeGreaterThan(0)
    countryDeviations.forEach((d) => expect(d.segmentType).toBe('country'))
  })
})

// ── risingQueries / fallingQueries ────────────────────────────────────────────

describe('aggregateWeeklyReport — risingQueries / fallingQueries', () => {
  test('excludes queries that only appear on one day (cannot compare)', () => {
    // "only-early" appears only in day1, "only-late" appears only in day2
    const day1 = makeDay('2026-08-01', {
      pages: [],
      queries: [makeQuery({ query: 'only-early', page: '/a/', impressions: 10, position: 5 })],
    })
    const day2 = makeDay('2026-08-02', {
      pages: [],
      queries: [makeQuery({ query: 'only-late', page: '/b/', impressions: 10, position: 3 })],
    })
    const result = aggregateWeeklyReport([day1, day2])
    const allQueries = [...result.risingQueries, ...result.fallingQueries]
    expect(allQueries.find((q) => q.query === 'only-early')).toBeUndefined()
    expect(allQueries.find((q) => q.query === 'only-late')).toBeUndefined()
  })

  test('positionChange is positive when rank improved (lower position number)', () => {
    // Position 10 → 3: positionChange = 10 - 3 = 7 (positive = improved)
    const day1 = makeDay('2026-08-01', {
      pages: [],
      queries: [makeQuery({ query: 'rising', page: '/page/', impressions: 10, position: 10 })],
    })
    const day2 = makeDay('2026-08-02', {
      pages: [],
      queries: [makeQuery({ query: 'rising', page: '/page/', impressions: 10, position: 3 })],
    })
    const result = aggregateWeeklyReport([day1, day2])
    expect(result.risingQueries).toHaveLength(1)
    expect(result.risingQueries[0]!.positionChange).toBeCloseTo(7)
    expect(result.risingQueries[0]!.earliestPosition).toBeCloseTo(10)
    expect(result.risingQueries[0]!.latestPosition).toBeCloseTo(3)
  })

  test('positionChange is negative when rank fell (higher position number)', () => {
    // Position 3 → 10: positionChange = 3 - 10 = -7 (negative = fell)
    const day1 = makeDay('2026-08-01', {
      pages: [],
      queries: [makeQuery({ query: 'falling', page: '/page/', impressions: 10, position: 3 })],
    })
    const day2 = makeDay('2026-08-02', {
      pages: [],
      queries: [makeQuery({ query: 'falling', page: '/page/', impressions: 10, position: 10 })],
    })
    const result = aggregateWeeklyReport([day1, day2])
    expect(result.fallingQueries).toHaveLength(1)
    expect(result.fallingQueries[0]!.positionChange).toBeCloseTo(-7)
  })

  test('uses impressions-weighted average position when multiple rows per (query, page) on same day', () => {
    // Same query/page appears twice on day1 with different positions
    // Row 1: impressions=10, position=5 → weight 50
    // Row 2: impressions=30, position=1 → weight 30
    // Weighted avg = (10*5 + 30*1) / 40 = (50 + 30) / 40 = 2.0
    const day1 = makeDay('2026-08-01', {
      pages: [],
      queries: [
        makeQuery({ query: 'test', page: '/page/', country: 'US', impressions: 10, position: 5 }),
        makeQuery({ query: 'test', page: '/page/', country: 'KR', impressions: 30, position: 1 }),
      ],
    })
    const day2 = makeDay('2026-08-02', {
      pages: [],
      queries: [makeQuery({ query: 'test', page: '/page/', impressions: 40, position: 2 })],
    })
    const result = aggregateWeeklyReport([day1, day2])
    const allQueries = [...result.risingQueries, ...result.fallingQueries]
    const entry = allQueries.find((q) => q.query === 'test' && q.page === '/page/')
    expect(entry).toBeDefined()
    expect(entry!.earliestPosition).toBeCloseTo(2.0)
  })

  test('risingQueries is sorted by positionChange descending', () => {
    // query-a: 10 → 2, change = 8
    // query-b: 10 → 4, change = 6
    const day1 = makeDay('2026-08-01', {
      pages: [],
      queries: [
        makeQuery({ query: 'query-a', page: '/a/', impressions: 10, position: 10 }),
        makeQuery({ query: 'query-b', page: '/b/', impressions: 10, position: 10 }),
      ],
    })
    const day2 = makeDay('2026-08-02', {
      pages: [],
      queries: [
        makeQuery({ query: 'query-a', page: '/a/', impressions: 10, position: 2 }),
        makeQuery({ query: 'query-b', page: '/b/', impressions: 10, position: 4 }),
      ],
    })
    const result = aggregateWeeklyReport([day1, day2])
    expect(result.risingQueries[0]!.query).toBe('query-a')
    expect(result.risingQueries[1]!.query).toBe('query-b')
  })

  test('fallingQueries is sorted by positionChange ascending (most fallen first)', () => {
    // query-c: 2 → 10, change = -8 (fell most)
    // query-d: 2 → 5, change = -3 (fell less)
    const day1 = makeDay('2026-08-01', {
      pages: [],
      queries: [
        makeQuery({ query: 'query-c', page: '/c/', impressions: 10, position: 2 }),
        makeQuery({ query: 'query-d', page: '/d/', impressions: 10, position: 2 }),
      ],
    })
    const day2 = makeDay('2026-08-02', {
      pages: [],
      queries: [
        makeQuery({ query: 'query-c', page: '/c/', impressions: 10, position: 10 }),
        makeQuery({ query: 'query-d', page: '/d/', impressions: 10, position: 5 }),
      ],
    })
    const result = aggregateWeeklyReport([day1, day2])
    expect(result.fallingQueries[0]!.query).toBe('query-c')
    expect(result.fallingQueries[1]!.query).toBe('query-d')
  })

  test('returns at most 10 entries each for rising and falling', () => {
    const day1Queries = Array.from({ length: 15 }, (_, i) =>
      makeQuery({ query: `q${i}`, page: `/p${i}/`, impressions: 10, position: 15 - i })
    )
    const day2Queries = Array.from({ length: 15 }, (_, i) =>
      makeQuery({ query: `q${i}`, page: `/p${i}/`, impressions: 10, position: i + 1 })
    )
    const day1 = makeDay('2026-08-01', { pages: [], queries: day1Queries })
    const day2 = makeDay('2026-08-02', { pages: [], queries: day2Queries })
    const result = aggregateWeeklyReport([day1, day2])
    expect(result.risingQueries.length).toBeLessThanOrEqual(10)
    expect(result.fallingQueries.length).toBeLessThanOrEqual(10)
  })

  test('does not include queries with 0-impression rows in position calculation', () => {
    // If impressions=0, the position contribution is 0 and total impressions stays 0
    // The function should skip accumulation for 0-impression queries (no division by zero)
    const day1 = makeDay('2026-08-01', {
      pages: [],
      queries: [
        makeQuery({ query: 'present', page: '/page/', impressions: 10, position: 5 }),
        makeQuery({ query: 'zero-impr', page: '/page2/', impressions: 0, position: 1 }),
      ],
    })
    const day2 = makeDay('2026-08-02', {
      pages: [],
      queries: [
        makeQuery({ query: 'present', page: '/page/', impressions: 10, position: 2 }),
        makeQuery({ query: 'zero-impr', page: '/page2/', impressions: 0, position: 1 }),
      ],
    })
    // Should not throw
    expect(() => aggregateWeeklyReport([day1, day2])).not.toThrow()
    const result = aggregateWeeklyReport([day1, day2])
    const zeroEntry = [...result.risingQueries, ...result.fallingQueries].find(
      (q) => q.query === 'zero-impr'
    )
    // zero-impression queries cannot produce a valid weighted avg → excluded
    expect(zeroEntry).toBeUndefined()
  })
})

// ── buildTitleExperimentSection ───────────────────────────────────────────────

describe('buildTitleExperimentSection', () => {
  const NOW = new Date('2026-08-06T00:00:00Z')

  function makeLog(overrides: Partial<ActionLog['actions'][number]>[] = []): ActionLog {
    return {
      actions: overrides.map((o) => ({
        id: 'test-id',
        type: 'title-experiment',
        page: '/beer/bac-calculator/',
        deployedAt: '2026-08-01T00:00:00Z',
        description: 'Test experiment',
        ...o,
      })),
    }
  }

  test('returns null when action log has no entries', () => {
    expect(buildTitleExperimentSection({ actions: [] }, NOW)).toBeNull()
  })

  test('returns null when no entries have type=title-experiment', () => {
    const log: ActionLog = {
      actions: [
        {
          id: 'x',
          type: 'content-update',
          page: '/beer/bac-calculator/',
          deployedAt: '2026-08-01T00:00:00Z',
          description: 'not an experiment',
        },
      ],
    }
    expect(buildTitleExperimentSection(log, NOW)).toBeNull()
  })

  test('returns section header when there is at least one title-experiment entry', () => {
    const log = makeLog([{}])
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).not.toBeNull()
    expect(result).toContain('## 🔤 진행 중인 타이틀 실험')
  })

  test('shows 재색인 대기 중 when entry has no status', () => {
    const log = makeLog([{ page: '/beer/bac-calculator/', deployedAt: '2026-08-01T00:00:00Z' }])
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).toContain('재색인 대기 중')
  })

  test('shows 쿨다운 진행 중 with elapsed days for in-progress status using cooldownStartedAt', () => {
    // cooldownStartedAt 5 days before NOW
    const log = makeLog([
      {
        page: '/beer/bac-calculator/',
        deployedAt: '2026-07-25T00:00:00Z',
        cooldownStartedAt: '2026-08-01T00:00:00Z',
        status: 'in-progress',
      },
    ])
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).toContain('쿨다운 진행 중 (5일 경과)')
  })

  test('falls back to deployedAt for elapsed days when cooldownStartedAt is absent on in-progress', () => {
    // deployedAt 3 days before NOW, no cooldownStartedAt
    const log = makeLog([
      {
        page: '/beer/bac-calculator/',
        deployedAt: '2026-08-03T00:00:00Z',
        status: 'in-progress',
      },
    ])
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).toContain('쿨다운 진행 중 (3일 경과)')
  })

  test('shows kept for kept status', () => {
    const log = makeLog([
      {
        page: '/developer/json-formatter/',
        deployedAt: '2026-07-20T00:00:00Z',
        status: 'kept',
      },
    ])
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).toContain('kept')
  })

  test('shows rolled-back for rolled-back status', () => {
    const log = makeLog([
      {
        page: '/travel/visa-requirement-checker/',
        deployedAt: '2026-07-15T00:00:00Z',
        status: 'rolled-back',
      },
    ])
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).toContain('rolled-back')
  })

  test('includes page, deploy date (YYYY-MM-DD), and attempt number in each line', () => {
    const log = makeLog([
      {
        page: '/beer/bac-calculator/',
        deployedAt: '2026-08-01T00:00:00Z',
        attemptNumber: 2,
      },
    ])
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).toContain('/beer/bac-calculator/')
    expect(result).toContain('2026-08-01')
    expect(result).toContain('2회차')
  })

  test('shows 회차 미상 when attemptNumber is absent', () => {
    const log = makeLog([{ page: '/beer/bac-calculator/' }])
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).toContain('회차 미상')
  })

  test('lists all title-experiment entries and ignores other types', () => {
    const log: ActionLog = {
      actions: [
        {
          id: 'a',
          type: 'title-experiment',
          page: '/page-a/',
          deployedAt: '2026-08-01T00:00:00Z',
          description: 'exp a',
          attemptNumber: 1,
        },
        {
          id: 'b',
          type: 'content-update',
          page: '/page-b/',
          deployedAt: '2026-08-01T00:00:00Z',
          description: 'not exp',
        },
        {
          id: 'c',
          type: 'title-experiment',
          page: '/page-c/',
          deployedAt: '2026-08-02T00:00:00Z',
          description: 'exp c',
          attemptNumber: 1,
          status: 'kept',
        },
      ],
    }
    const result = buildTitleExperimentSection(log, NOW)
    expect(result).toContain('/page-a/')
    expect(result).not.toContain('/page-b/')
    expect(result).toContain('/page-c/')
  })
})

// ── Totals ────────────────────────────────────────────────────────────────────

describe('aggregateWeeklyReport — totals', () => {
  test('sums impressions, clicks, sessions across all days and pages', () => {
    const days = [
      makeDay('2026-08-01', {
        pages: [
          makePage({ sessions: 5, gscImpressions: 100, gscClicks: 3 }),
          makePage({ path: '/other/', sessions: 10, gscImpressions: 200, gscClicks: 8 }),
        ],
        queries: [],
      }),
      makeDay('2026-08-02', {
        pages: [makePage({ sessions: 7, gscImpressions: 150, gscClicks: 6 })],
        queries: [],
      }),
    ]
    const result = aggregateWeeklyReport(days)
    expect(result.totals.sessions).toBe(5 + 10 + 7)
    expect(result.totals.impressions).toBe(100 + 200 + 150)
    expect(result.totals.clicks).toBe(3 + 8 + 6)
  })
})
