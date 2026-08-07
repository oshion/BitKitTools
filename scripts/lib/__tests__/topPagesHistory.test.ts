/**
 * @jest-environment node
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { TopPagesHistory, WeeklyTopPagesPoint } from '../topPagesHistory'
import {
  appendTopPagesPoint,
  findConsecutiveTopPerformers,
  readTopPagesHistory,
  recordWeeklyTopPages,
  writeTopPagesHistory,
} from '../topPagesHistory'
import type { TopPerformingPage } from '../aggregateWeeklyReport'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTempFile(content?: string): string {
  const dir = join(tmpdir(), 'top-pages-history-test-' + Date.now())
  mkdirSync(dir, { recursive: true })
  const filePath = join(dir, 'top-pages-history.json')
  if (content !== undefined) {
    writeFileSync(filePath, content, 'utf-8')
  }
  return filePath
}

function makePoint(weekStart: string, pages: Array<{ page: string; clicks: number }>): WeeklyTopPagesPoint {
  return { weekStart, pages }
}

// ── readTopPagesHistory ───────────────────────────────────────────────────────

describe('readTopPagesHistory', () => {
  it('returns empty history when file does not exist', () => {
    const filePath = join(tmpdir(), 'nonexistent-top-pages-' + Date.now() + '.json')
    const result = readTopPagesHistory(filePath)
    expect(result).toEqual({ weeks: [] })
  })

  it('reads existing history file', () => {
    const history: TopPagesHistory = {
      weeks: [
        {
          weekStart: '2026-01-05',
          pages: [{ page: '/beer/bac-calculator', clicks: 100 }],
        },
      ],
    }
    const filePath = makeTempFile(JSON.stringify(history))
    const result = readTopPagesHistory(filePath)
    expect(result).toEqual(history)
  })

  it('returns empty history on malformed JSON', () => {
    const filePath = makeTempFile('not-valid-json')
    const result = readTopPagesHistory(filePath)
    expect(result).toEqual({ weeks: [] })
  })
})

// ── writeTopPagesHistory ──────────────────────────────────────────────────────

describe('writeTopPagesHistory', () => {
  it('writes and reads back correctly', () => {
    const history: TopPagesHistory = {
      weeks: [
        {
          weekStart: '2026-01-05',
          pages: [{ page: '/beer/bac-calculator', clicks: 50 }],
        },
      ],
    }
    const filePath = makeTempFile()
    writeTopPagesHistory(history, filePath)
    const result = readTopPagesHistory(filePath)
    expect(result).toEqual(history)
  })

  it('creates directory if it does not exist', () => {
    const dir = join(tmpdir(), 'new-dir-' + Date.now())
    const filePath = join(dir, 'top-pages-history.json')
    const history: TopPagesHistory = { weeks: [] }
    writeTopPagesHistory(history, filePath)
    expect(existsSync(filePath)).toBe(true)
  })
})

// ── appendTopPagesPoint ───────────────────────────────────────────────────────

describe('appendTopPagesPoint', () => {
  it('appends a new point', () => {
    const history: TopPagesHistory = { weeks: [] }
    const point = makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 100 }])
    const result = appendTopPagesPoint(history, point)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]).toEqual(point)
  })

  it('replaces existing point with same weekStart', () => {
    const existing = makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 100 }])
    const history: TopPagesHistory = { weeks: [existing] }
    const updated = makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 150 }])
    const result = appendTopPagesPoint(history, updated)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]!.pages[0]!.clicks).toBe(150)
  })

  it('does not duplicate when same weekStart is appended twice', () => {
    const history: TopPagesHistory = { weeks: [] }
    const point = makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 100 }])
    const result1 = appendTopPagesPoint(history, point)
    const result2 = appendTopPagesPoint(result1, point)
    expect(result2.weeks).toHaveLength(1)
  })

  it('trims to 12 weeks when exceeded', () => {
    let history: TopPagesHistory = { weeks: [] }
    for (let i = 0; i < 13; i++) {
      const weekStart = `2026-${String(i + 1).padStart(2, '0')}-01`
      const point = makePoint(weekStart, [{ page: '/test', clicks: i }])
      history = appendTopPagesPoint(history, point)
    }
    expect(history.weeks).toHaveLength(12)
    // oldest (month 01) should be removed, newest (month 13) should remain
    expect(history.weeks[0]!.weekStart).toBe('2026-02-01')
    expect(history.weeks[11]!.weekStart).toBe('2026-13-01')
  })

  it('keeps oldest first ordering', () => {
    const history: TopPagesHistory = { weeks: [] }
    const point1 = makePoint('2026-01-05', [{ page: '/a', clicks: 10 }])
    const point2 = makePoint('2026-01-12', [{ page: '/b', clicks: 20 }])
    const result = appendTopPagesPoint(appendTopPagesPoint(history, point1), point2)
    expect(result.weeks[0]!.weekStart).toBe('2026-01-05')
    expect(result.weeks[1]!.weekStart).toBe('2026-01-12')
  })

  it('does not mutate original history', () => {
    const history: TopPagesHistory = { weeks: [] }
    const point = makePoint('2026-01-05', [{ page: '/test', clicks: 10 }])
    appendTopPagesPoint(history, point)
    expect(history.weeks).toHaveLength(0)
  })
})

// ── recordWeeklyTopPages ──────────────────────────────────────────────────────

describe('recordWeeklyTopPages', () => {
  function makeTopPage(path: string, clicks: number): TopPerformingPage {
    return { path, clicks, impressions: clicks * 10, ctr: 0.1 }
  }

  it('writes a new point and returns updated history', () => {
    const filePath = makeTempFile()
    const pages = [makeTopPage('/beer/bac-calculator/', 100)]
    const result = recordWeeklyTopPages(pages, '2026-08-04', filePath)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]!.weekStart).toBe('2026-08-04')
    expect(result.weeks[0]!.pages[0]).toEqual({ page: '/beer/bac-calculator/', clicks: 100 })
  })

  it('persists to disk — read back matches returned value', () => {
    const filePath = makeTempFile()
    const pages = [makeTopPage('/developer/json-formatter/', 50)]
    recordWeeklyTopPages(pages, '2026-08-04', filePath)
    const onDisk = readTopPagesHistory(filePath)
    expect(onDisk.weeks).toHaveLength(1)
    expect(onDisk.weeks[0]!.pages[0]).toEqual({ page: '/developer/json-formatter/', clicks: 50 })
  })

  it('does not duplicate when re-run on the same weekStart', () => {
    const filePath = makeTempFile()
    const pages = [makeTopPage('/beer/bac-calculator/', 100)]
    recordWeeklyTopPages(pages, '2026-08-04', filePath)
    recordWeeklyTopPages(pages, '2026-08-04', filePath)
    const onDisk = readTopPagesHistory(filePath)
    expect(onDisk.weeks).toHaveLength(1)
  })

  it('replaces existing entry on same weekStart with new data', () => {
    const filePath = makeTempFile()
    recordWeeklyTopPages([makeTopPage('/beer/bac-calculator/', 100)], '2026-08-04', filePath)
    recordWeeklyTopPages([makeTopPage('/beer/bac-calculator/', 200)], '2026-08-04', filePath)
    const onDisk = readTopPagesHistory(filePath)
    expect(onDisk.weeks).toHaveLength(1)
    expect(onDisk.weeks[0]!.pages[0]!.clicks).toBe(200)
  })

  it('converts TopPerformingPage.path to WeeklyTopPage.page correctly', () => {
    const filePath = makeTempFile()
    const pages: TopPerformingPage[] = [
      { path: '/travel/flight-delay-compensation/', clicks: 80, impressions: 800, ctr: 0.1 },
    ]
    const result = recordWeeklyTopPages(pages, '2026-08-04', filePath)
    expect(result.weeks[0]!.pages[0]!.page).toBe('/travel/flight-delay-compensation/')
    expect(result.weeks[0]!.pages[0]!.clicks).toBe(80)
  })

  it('handles empty topPerformingPages gracefully', () => {
    const filePath = makeTempFile()
    const result = recordWeeklyTopPages([], '2026-08-04', filePath)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]!.pages).toHaveLength(0)
  })
})

// ── findConsecutiveTopPerformers ──────────────────────────────────────────────

describe('findConsecutiveTopPerformers', () => {
  it('returns empty array when fewer than minConsecutiveWeeks data points', () => {
    const history: TopPagesHistory = {
      weeks: [
        makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 100 }]),
        makePoint('2026-01-12', [{ page: '/beer/bac-calculator', clicks: 110 }]),
      ],
    }
    // default minConsecutiveWeeks=3, only 2 weeks
    const result = findConsecutiveTopPerformers(history)
    expect(result).toEqual([])
  })

  it('returns pages appearing in all 3 consecutive weeks', () => {
    const history: TopPagesHistory = {
      weeks: [
        makePoint('2026-01-05', [
          { page: '/beer/bac-calculator', clicks: 100 },
          { page: '/travel/flight-delay', clicks: 50 },
        ]),
        makePoint('2026-01-12', [
          { page: '/beer/bac-calculator', clicks: 110 },
          { page: '/travel/flight-delay', clicks: 55 },
        ]),
        makePoint('2026-01-19', [
          { page: '/beer/bac-calculator', clicks: 120 },
          { page: '/travel/flight-delay', clicks: 60 },
        ]),
      ],
    }
    const result = findConsecutiveTopPerformers(history)
    expect(result).toContain('/beer/bac-calculator')
    expect(result).toContain('/travel/flight-delay')
  })

  it('excludes pages not appearing in all consecutive weeks', () => {
    const history: TopPagesHistory = {
      weeks: [
        makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 100 }]),
        makePoint('2026-01-12', [{ page: '/beer/bac-calculator', clicks: 110 }]),
        makePoint('2026-01-19', [
          // /beer/bac-calculator missing this week
          { page: '/travel/flight-delay', clicks: 60 },
        ]),
      ],
    }
    const result = findConsecutiveTopPerformers(history)
    expect(result).not.toContain('/beer/bac-calculator')
    expect(result).not.toContain('/travel/flight-delay') // only appeared 1 week
  })

  it('uses only the most recent minConsecutiveWeeks weeks', () => {
    // Page appears in weeks 1-2 but not in week 3 (most recent)
    const history: TopPagesHistory = {
      weeks: [
        makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 100 }]),
        makePoint('2026-01-12', [{ page: '/beer/bac-calculator', clicks: 110 }]),
        makePoint('2026-01-19', [{ page: '/other', clicks: 60 }]),
      ],
    }
    const result = findConsecutiveTopPerformers(history)
    expect(result).not.toContain('/beer/bac-calculator')
  })

  it('respects custom minConsecutiveWeeks=2', () => {
    const history: TopPagesHistory = {
      weeks: [
        makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 100 }]),
        makePoint('2026-01-12', [{ page: '/beer/bac-calculator', clicks: 110 }]),
      ],
    }
    const result = findConsecutiveTopPerformers(history, 2)
    expect(result).toContain('/beer/bac-calculator')
  })

  it('returns empty array when minConsecutiveWeeks=2 but only 1 week available', () => {
    const history: TopPagesHistory = {
      weeks: [makePoint('2026-01-05', [{ page: '/beer/bac-calculator', clicks: 100 }])],
    }
    const result = findConsecutiveTopPerformers(history, 2)
    expect(result).toEqual([])
  })

  it('uses last N weeks from a longer history', () => {
    // Page only appears in weeks 3 and 4 (most recent 2)
    const history: TopPagesHistory = {
      weeks: [
        makePoint('2026-01-05', [{ page: '/other', clicks: 50 }]),
        makePoint('2026-01-12', [{ page: '/other', clicks: 55 }]),
        makePoint('2026-01-19', [{ page: '/beer/bac-calculator', clicks: 110 }]),
        makePoint('2026-01-26', [{ page: '/beer/bac-calculator', clicks: 120 }]),
      ],
    }
    const result = findConsecutiveTopPerformers(history, 2)
    expect(result).toContain('/beer/bac-calculator')
  })
})
