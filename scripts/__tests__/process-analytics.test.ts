import {
  REPROCESS_WINDOW_DAYS,
  shouldProcessDate,
  mergePageTotalsIntoPages,
} from '../process-analytics'
import type { ProcessedPage, GscPageTotalsRawData } from '../process-analytics'

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

describe('mergePageTotalsIntoPages', () => {
  function makePage(overrides: Partial<ProcessedPage> = {}): ProcessedPage {
    return {
      path: '/beer/bac-calculator/',
      sessions: 0,
      events: {},
      gscImpressions: 0,
      gscClicks: 0,
      gscAvgPosition: null,
      bounceRate: null,
      ...overrides,
    }
  }

  test('overwrites an existing page entry with authoritative page-total values', () => {
    const pageMap = new Map<string, ProcessedPage>([
      ['/beer/bac-calculator/', makePage({ gscImpressions: 5, gscClicks: 0, gscAvgPosition: 40 })],
    ])
    const raw: GscPageTotalsRawData = {
      rows: [
        {
          keys: ['https://bitkittools.com/beer/bac-calculator/'],
          clicks: 3,
          impressions: 12,
          ctr: 0.25,
          position: 8.5,
        },
      ],
    }

    mergePageTotalsIntoPages(raw, pageMap)

    const entry = pageMap.get('/beer/bac-calculator/')!
    expect(entry.gscImpressions).toBe(12)
    expect(entry.gscClicks).toBe(3)
    expect(entry.gscAvgPosition).toBe(8.5)
  })

  test('creates a new page entry when the page was not already present', () => {
    const pageMap = new Map<string, ProcessedPage>()
    const raw: GscPageTotalsRawData = {
      rows: [
        {
          keys: ['https://bitkittools.com/ko/baby/sleep-schedule/'],
          clicks: 1,
          impressions: 1,
          ctr: 1,
          position: 6,
        },
      ],
    }

    mergePageTotalsIntoPages(raw, pageMap)

    expect(pageMap.has('/ko/baby/sleep-schedule/')).toBe(true)
    expect(pageMap.get('/ko/baby/sleep-schedule/')!.gscClicks).toBe(1)
  })

  test('sets gscAvgPosition to null when impressions is 0', () => {
    const pageMap = new Map<string, ProcessedPage>()
    const raw: GscPageTotalsRawData = {
      rows: [
        {
          keys: ['https://bitkittools.com/developer/json-formatter/'],
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        },
      ],
    }

    mergePageTotalsIntoPages(raw, pageMap)

    expect(pageMap.get('/developer/json-formatter/')!.gscAvgPosition).toBeNull()
  })

  test('leaves pageMap unchanged when rows is empty or missing', () => {
    const pageMap = new Map<string, ProcessedPage>([
      ['/beer/bac-calculator/', makePage({ gscImpressions: 5, gscClicks: 2 })],
    ])

    mergePageTotalsIntoPages({ rows: [] }, pageMap)
    expect(pageMap.get('/beer/bac-calculator/')!.gscClicks).toBe(2)

    mergePageTotalsIntoPages({}, pageMap)
    expect(pageMap.get('/beer/bac-calculator/')!.gscClicks).toBe(2)
  })
})
