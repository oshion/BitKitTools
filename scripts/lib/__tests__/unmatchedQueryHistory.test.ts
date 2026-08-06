/**
 * @jest-environment node
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type {
  UnmatchedQueryHistory,
  WeeklyUnmatchedQueriesPoint,
} from '../unmatchedQueryHistory'
import {
  appendUnmatchedQueriesPoint,
  findRecurringQueries,
  readUnmatchedQueryHistory,
  writeUnmatchedQueryHistory,
} from '../unmatchedQueryHistory'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTempFile(content?: string): string {
  const dir = join(tmpdir(), 'unmatched-query-history-test-' + Date.now())
  mkdirSync(dir, { recursive: true })
  const filePath = join(dir, 'unmatched-query-history.json')
  if (content !== undefined) {
    writeFileSync(filePath, content, 'utf-8')
  }
  return filePath
}

function makePoint(weekStart: string, queries: string[]): WeeklyUnmatchedQueriesPoint {
  return { weekStart, queries }
}

// ── readUnmatchedQueryHistory ─────────────────────────────────────────────────

describe('readUnmatchedQueryHistory', () => {
  it('returns empty history when file does not exist', () => {
    const filePath = join(tmpdir(), 'nonexistent-unmatched-' + Date.now() + '.json')
    const result = readUnmatchedQueryHistory(filePath)
    expect(result).toEqual({ weeks: [] })
  })

  it('reads existing history file', () => {
    const history: UnmatchedQueryHistory = {
      weeks: [
        {
          weekStart: '2026-01-05',
          queries: ['cocktail calculator', 'car loan calculator'],
        },
      ],
    }
    const filePath = makeTempFile(JSON.stringify(history))
    const result = readUnmatchedQueryHistory(filePath)
    expect(result).toEqual(history)
  })

  it('returns empty history on malformed JSON', () => {
    const filePath = makeTempFile('not-valid-json')
    const result = readUnmatchedQueryHistory(filePath)
    expect(result).toEqual({ weeks: [] })
  })
})

// ── writeUnmatchedQueryHistory ────────────────────────────────────────────────

describe('writeUnmatchedQueryHistory', () => {
  it('writes and reads back correctly', () => {
    const history: UnmatchedQueryHistory = {
      weeks: [
        {
          weekStart: '2026-01-05',
          queries: ['cocktail calculator'],
        },
      ],
    }
    const filePath = makeTempFile()
    writeUnmatchedQueryHistory(history, filePath)
    const result = readUnmatchedQueryHistory(filePath)
    expect(result).toEqual(history)
  })

  it('creates directory if it does not exist', () => {
    const dir = join(tmpdir(), 'new-dir-' + Date.now())
    const filePath = join(dir, 'unmatched-query-history.json')
    const history: UnmatchedQueryHistory = { weeks: [] }
    writeUnmatchedQueryHistory(history, filePath)
    expect(existsSync(filePath)).toBe(true)
  })
})

// ── appendUnmatchedQueriesPoint ───────────────────────────────────────────────

describe('appendUnmatchedQueriesPoint', () => {
  it('appends a new point', () => {
    const history: UnmatchedQueryHistory = { weeks: [] }
    const point = makePoint('2026-01-05', ['cocktail calculator'])
    const result = appendUnmatchedQueriesPoint(history, point)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]).toEqual(point)
  })

  it('replaces existing point with same weekStart', () => {
    const existing = makePoint('2026-01-05', ['cocktail calculator'])
    const history: UnmatchedQueryHistory = { weeks: [existing] }
    const updated = makePoint('2026-01-05', ['cocktail calculator', 'car loan'])
    const result = appendUnmatchedQueriesPoint(history, updated)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]!.queries).toEqual(['cocktail calculator', 'car loan'])
  })

  it('does not duplicate when same weekStart is appended twice', () => {
    const history: UnmatchedQueryHistory = { weeks: [] }
    const point = makePoint('2026-01-05', ['cocktail calculator'])
    const result1 = appendUnmatchedQueriesPoint(history, point)
    const result2 = appendUnmatchedQueriesPoint(result1, point)
    expect(result2.weeks).toHaveLength(1)
  })

  it('trims to 12 weeks when exceeded', () => {
    let history: UnmatchedQueryHistory = { weeks: [] }
    for (let i = 0; i < 13; i++) {
      const weekStart = `2026-${String(i + 1).padStart(2, '0')}-01`
      const point = makePoint(weekStart, [`query-${i}`])
      history = appendUnmatchedQueriesPoint(history, point)
    }
    expect(history.weeks).toHaveLength(12)
    // oldest (month 01) should be removed, newest (month 13) should remain
    expect(history.weeks[0]!.weekStart).toBe('2026-02-01')
    expect(history.weeks[11]!.weekStart).toBe('2026-13-01')
  })

  it('keeps oldest first ordering', () => {
    const history: UnmatchedQueryHistory = { weeks: [] }
    const point1 = makePoint('2026-01-05', ['query-a'])
    const point2 = makePoint('2026-01-12', ['query-b'])
    const result = appendUnmatchedQueriesPoint(appendUnmatchedQueriesPoint(history, point1), point2)
    expect(result.weeks[0]!.weekStart).toBe('2026-01-05')
    expect(result.weeks[1]!.weekStart).toBe('2026-01-12')
  })

  it('does not mutate original history', () => {
    const history: UnmatchedQueryHistory = { weeks: [] }
    const point = makePoint('2026-01-05', ['test query'])
    appendUnmatchedQueriesPoint(history, point)
    expect(history.weeks).toHaveLength(0)
  })

  it('handles empty queries array', () => {
    const history: UnmatchedQueryHistory = { weeks: [] }
    const point = makePoint('2026-01-05', [])
    const result = appendUnmatchedQueriesPoint(history, point)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0]!.queries).toHaveLength(0)
  })
})

// ── findRecurringQueries ──────────────────────────────────────────────────────

describe('findRecurringQueries', () => {
  it('returns empty array when fewer than minConsecutiveWeeks data points (default 2)', () => {
    const history: UnmatchedQueryHistory = {
      weeks: [makePoint('2026-01-05', ['cocktail calculator'])],
    }
    const result = findRecurringQueries(history)
    expect(result).toEqual([])
  })

  it('returns empty array when history is empty', () => {
    const history: UnmatchedQueryHistory = { weeks: [] }
    const result = findRecurringQueries(history)
    expect(result).toEqual([])
  })

  it('returns queries appearing in both recent weeks (default minConsecutiveWeeks=2)', () => {
    const history: UnmatchedQueryHistory = {
      weeks: [
        makePoint('2026-01-05', ['cocktail calculator', 'car loan calculator']),
        makePoint('2026-01-12', ['cocktail calculator', 'mortgage estimator']),
      ],
    }
    const result = findRecurringQueries(history)
    expect(result).toContain('cocktail calculator')
    expect(result).not.toContain('car loan calculator') // only in week 1
    expect(result).not.toContain('mortgage estimator') // only in week 2
  })

  it('excludes query that only appeared in 1 of 2 recent weeks', () => {
    const history: UnmatchedQueryHistory = {
      weeks: [
        makePoint('2026-01-05', ['cocktail calculator']),
        makePoint('2026-01-12', ['car loan calculator']),
      ],
    }
    const result = findRecurringQueries(history)
    expect(result).toHaveLength(0)
  })

  it('uses only the most recent N weeks from a longer history', () => {
    // Query appears in weeks 1-2 but not in week 3 (most recent)
    const history: UnmatchedQueryHistory = {
      weeks: [
        makePoint('2026-01-05', ['cocktail calculator']),
        makePoint('2026-01-12', ['cocktail calculator']),
        makePoint('2026-01-19', ['car loan calculator']),
      ],
    }
    const result = findRecurringQueries(history)
    // Only checks the most recent 2 weeks (weeks 2 and 3)
    expect(result).not.toContain('cocktail calculator') // missing in week 3
    expect(result).not.toContain('car loan calculator') // only in week 3
  })

  it('respects custom minConsecutiveWeeks=3', () => {
    const history: UnmatchedQueryHistory = {
      weeks: [
        makePoint('2026-01-05', ['cocktail calculator']),
        makePoint('2026-01-12', ['cocktail calculator']),
        makePoint('2026-01-19', ['cocktail calculator']),
      ],
    }
    const result = findRecurringQueries(history, 3)
    expect(result).toContain('cocktail calculator')
  })

  it('returns empty when minConsecutiveWeeks=3 but only 2 weeks available', () => {
    const history: UnmatchedQueryHistory = {
      weeks: [
        makePoint('2026-01-05', ['cocktail calculator']),
        makePoint('2026-01-12', ['cocktail calculator']),
      ],
    }
    const result = findRecurringQueries(history, 3)
    expect(result).toEqual([])
  })

  it('returns multiple recurring queries', () => {
    const history: UnmatchedQueryHistory = {
      weeks: [
        makePoint('2026-01-05', ['cocktail calculator', 'car loan calculator']),
        makePoint('2026-01-12', ['cocktail calculator', 'car loan calculator']),
      ],
    }
    const result = findRecurringQueries(history)
    expect(result).toContain('cocktail calculator')
    expect(result).toContain('car loan calculator')
  })

  it('uses last N weeks from longer history when minConsecutiveWeeks=2', () => {
    // Query only appears in the 2 most recent weeks, not earlier
    const history: UnmatchedQueryHistory = {
      weeks: [
        makePoint('2026-01-05', ['other query']),
        makePoint('2026-01-12', ['cocktail calculator']),
        makePoint('2026-01-19', ['cocktail calculator']),
      ],
    }
    const result = findRecurringQueries(history, 2)
    expect(result).toContain('cocktail calculator')
    expect(result).not.toContain('other query')
  })
})
