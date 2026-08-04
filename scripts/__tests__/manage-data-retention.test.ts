/**
 * @jest-environment node
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import {
  deleteOldRawFiles,
  formatISOWeek,
  getISOWeek,
  rollupOldProcessedFiles,
} from '../manage-data-retention'

// ── Test utilities ────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  const dir = join(tmpdir(), `retention-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function cleanDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Returns a YYYY-MM-DD string for a date `daysAgo` days before `today`. */
function dateDaysAgo(today: Date, daysAgo: number): string {
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function writeRawFile(dir: string, prefix: 'ga4' | 'gsc' | 'clarity', dateStr: string): string {
  const filename = `${prefix}-${dateStr}.json`
  writeFileSync(join(dir, filename), JSON.stringify({ date: dateStr }), 'utf-8')
  return filename
}

interface ProcessedDay {
  date: string
  pages: Array<{
    path: string
    sessions: number
    events: Record<string, number>
    gscImpressions: number
    gscClicks: number
    gscAvgPosition: number | null
  }>
  queries: Array<{
    query: string
    page: string
    country: string
    device: string
    impressions: number
    clicks: number
    ctr: number
    position: number
  }>
  clarity: null
}

function makeProcessedDay(date: string, sessions = 10, impressions = 100): ProcessedDay {
  return {
    date,
    pages: [
      {
        path: '/beer/bac-calculator/',
        sessions,
        events: { page_view: sessions },
        gscImpressions: impressions,
        gscClicks: Math.floor(impressions * 0.05),
        gscAvgPosition: 3.2,
      },
    ],
    queries: [
      {
        query: 'bac calculator',
        page: '/beer/bac-calculator/',
        country: 'US',
        device: 'desktop',
        impressions,
        clicks: Math.floor(impressions * 0.05),
        ctr: 0.05,
        position: 3.2,
      },
    ],
    clarity: null,
  }
}

function writeProcessedFile(dir: string, dateStr: string, sessions = 10, impressions = 100): string {
  const filename = `${dateStr}.json`
  writeFileSync(join(dir, filename), JSON.stringify(makeProcessedDay(dateStr, sessions, impressions), null, 2), 'utf-8')
  return filename
}

// ── ISO week tests ────────────────────────────────────────────────────────────

describe('getISOWeek', () => {
  test('2026-01-01 (Thursday) is week 1 of 2026', () => {
    expect(getISOWeek(new Date('2026-01-01'))).toEqual({ year: 2026, week: 1 })
  })

  test('2026-01-05 (Monday) is week 2 of 2026', () => {
    expect(getISOWeek(new Date('2026-01-05'))).toEqual({ year: 2026, week: 2 })
  })

  test('2025-12-29 (Monday) is week 1 of 2026', () => {
    // 2025-12-29 is Monday of the week containing 2026-01-01 (Thu) — ISO week 1 of 2026
    expect(getISOWeek(new Date('2025-12-29'))).toEqual({ year: 2026, week: 1 })
  })

  test('2025-12-28 (Sunday) is week 52 of 2025', () => {
    expect(getISOWeek(new Date('2025-12-28'))).toEqual({ year: 2025, week: 52 })
  })

  test('2015-01-01 is week 1 of 2015', () => {
    // 2015-01-01 is Thursday
    expect(getISOWeek(new Date('2015-01-01'))).toEqual({ year: 2015, week: 1 })
  })
})

describe('formatISOWeek', () => {
  test('pads week number to 2 digits', () => {
    expect(formatISOWeek(2026, 1)).toBe('2026-W01')
    expect(formatISOWeek(2026, 52)).toBe('2026-W52')
    expect(formatISOWeek(2026, 10)).toBe('2026-W10')
  })
})

// ── deleteOldRawFiles ─────────────────────────────────────────────────────────

describe('deleteOldRawFiles', () => {
  let tmpDir: string
  const today = new Date('2026-08-04T00:00:00Z')

  beforeEach(() => {
    tmpDir = makeTmpDir()
  })

  afterEach(() => {
    cleanDir(tmpDir)
  })

  test('returns [] when raw directory does not exist', () => {
    const result = deleteOldRawFiles(join(tmpDir, 'nonexistent'), today)
    expect(result).toEqual([])
  })

  test('returns [] when there are no raw files', () => {
    const result = deleteOldRawFiles(tmpDir, today)
    expect(result).toEqual([])
  })

  test('does not delete files within 60 days', () => {
    const recent = dateDaysAgo(today, 30)
    writeRawFile(tmpDir, 'ga4', recent)
    writeRawFile(tmpDir, 'gsc', recent)

    const result = deleteOldRawFiles(tmpDir, today)

    expect(result).toEqual([])
    expect(existsSync(join(tmpDir, `ga4-${recent}.json`))).toBe(true)
    expect(existsSync(join(tmpDir, `gsc-${recent}.json`))).toBe(true)
  })

  test('does not delete file exactly at 60-day boundary', () => {
    const boundary = dateDaysAgo(today, 60)
    writeRawFile(tmpDir, 'ga4', boundary)

    const result = deleteOldRawFiles(tmpDir, today)

    expect(result).toEqual([])
    expect(existsSync(join(tmpDir, `ga4-${boundary}.json`))).toBe(true)
  })

  test('deletes files older than 60 days', () => {
    const old = dateDaysAgo(today, 61)
    const veryOld = dateDaysAgo(today, 120)

    writeRawFile(tmpDir, 'ga4', old)
    writeRawFile(tmpDir, 'clarity', veryOld)

    const result = deleteOldRawFiles(tmpDir, today)

    expect(result).toHaveLength(2)
    expect(result).toContain(`ga4-${old}.json`)
    expect(result).toContain(`clarity-${veryOld}.json`)
    expect(existsSync(join(tmpDir, `ga4-${old}.json`))).toBe(false)
    expect(existsSync(join(tmpDir, `clarity-${veryOld}.json`))).toBe(false)
  })

  test('only deletes old files, preserves recent files', () => {
    const recent = dateDaysAgo(today, 10)
    const old = dateDaysAgo(today, 90)

    writeRawFile(tmpDir, 'ga4', recent)
    writeRawFile(tmpDir, 'ga4', old)

    const result = deleteOldRawFiles(tmpDir, today)

    expect(result).toEqual([`ga4-${old}.json`])
    expect(existsSync(join(tmpDir, `ga4-${recent}.json`))).toBe(true)
    expect(existsSync(join(tmpDir, `ga4-${old}.json`))).toBe(false)
  })

  test('ignores files that do not match the raw file pattern', () => {
    writeFileSync(join(tmpDir, 'unrelated.json'), '{}', 'utf-8')
    writeFileSync(join(tmpDir, 'report-2020-01-01.json'), '{}', 'utf-8')

    const result = deleteOldRawFiles(tmpDir, today)

    expect(result).toEqual([])
    expect(existsSync(join(tmpDir, 'unrelated.json'))).toBe(true)
  })
})

// ── rollupOldProcessedFiles ───────────────────────────────────────────────────

describe('rollupOldProcessedFiles', () => {
  let tmpDir: string
  let processedDir: string
  let weeklyDir: string
  const today = new Date('2026-08-04T00:00:00Z')

  beforeEach(() => {
    tmpDir = makeTmpDir()
    processedDir = join(tmpDir, 'processed')
    weeklyDir = join(processedDir, 'weekly')
    mkdirSync(processedDir, { recursive: true })
  })

  afterEach(() => {
    cleanDir(tmpDir)
  })

  test('returns [] when processed directory does not exist', () => {
    const result = rollupOldProcessedFiles(join(tmpDir, 'nonexistent'), weeklyDir, today)
    expect(result).toEqual([])
  })

  test('returns [] when there are no processed files', () => {
    const result = rollupOldProcessedFiles(processedDir, weeklyDir, today)
    expect(result).toEqual([])
  })

  test('does not roll up files within 90 days', () => {
    const recent = dateDaysAgo(today, 30)
    writeProcessedFile(processedDir, recent)

    const result = rollupOldProcessedFiles(processedDir, weeklyDir, today)

    expect(result).toEqual([])
    expect(existsSync(join(processedDir, `${recent}.json`))).toBe(true)
  })

  test('does not roll up file exactly at 90-day boundary', () => {
    const boundary = dateDaysAgo(today, 90)
    writeProcessedFile(processedDir, boundary)

    const result = rollupOldProcessedFiles(processedDir, weeklyDir, today)

    expect(result).toEqual([])
    expect(existsSync(join(processedDir, `${boundary}.json`))).toBe(true)
  })

  test('rolls up files older than 90 days and deletes originals', () => {
    // Use specific dates known to be in the same ISO week
    // 2025-01-06 (Mon) through 2025-01-12 (Sun) = 2025-W02
    const file1 = '2025-01-06'
    const file2 = '2025-01-07'
    const file3 = '2025-01-08'

    writeProcessedFile(processedDir, file1)
    writeProcessedFile(processedDir, file2)
    writeProcessedFile(processedDir, file3)

    const result = rollupOldProcessedFiles(processedDir, weeklyDir, today)

    expect(result).toHaveLength(3)
    expect(result).toContain(`${file1}.json`)
    expect(result).toContain(`${file2}.json`)
    expect(result).toContain(`${file3}.json`)

    // Original files deleted
    expect(existsSync(join(processedDir, `${file1}.json`))).toBe(false)
    expect(existsSync(join(processedDir, `${file2}.json`))).toBe(false)
    expect(existsSync(join(processedDir, `${file3}.json`))).toBe(false)

    // Weekly directory and rollup file created
    expect(existsSync(weeklyDir)).toBe(true)
    const weeklyFiles = readdirSync(weeklyDir)
    expect(weeklyFiles.length).toBe(1)
  })

  test('weekly rollup file has correct structure', () => {
    const file1 = '2025-01-06'
    const file2 = '2025-01-07'

    writeProcessedFile(processedDir, file1, 10, 100)
    writeProcessedFile(processedDir, file2, 20, 200)

    rollupOldProcessedFiles(processedDir, weeklyDir, today)

    const weeklyFiles = readdirSync(weeklyDir)
    expect(weeklyFiles.length).toBe(1)

    const weeklyFilePath = join(weeklyDir, weeklyFiles[0]!)
    const content = JSON.parse(readFileSync(weeklyFilePath, 'utf-8')) as {
      week: string
      dateRange: { start: string; end: string }
      totalSessions: number
      totalGscImpressions: number
      totalGscClicks: number
      avgGscPosition: number | null
      topPages: unknown[]
      topQueries: unknown[]
    }

    expect(content.week).toBe('2025-W02')
    expect(content.dateRange.start).toBe(file1)
    expect(content.dateRange.end).toBe(file2)
    expect(content.totalSessions).toBe(30) // 10 + 20
    expect(content.totalGscImpressions).toBe(300) // 100 + 200
    expect(content.totalGscClicks).toBe(15) // 5 + 10
    expect(content.avgGscPosition).toBeCloseTo(3.2)
    expect(content.topPages).toHaveLength(1) // same path aggregated
    expect(content.topQueries).toHaveLength(1) // same query aggregated
  })

  test('is idempotent — already rolled up weeks are not reprocessed', () => {
    const file1 = '2025-01-06'
    writeProcessedFile(processedDir, file1)

    // First run: creates rollup
    const firstResult = rollupOldProcessedFiles(processedDir, weeklyDir, today)
    expect(firstResult).toHaveLength(1)

    // Manually re-create the processed file to simulate re-run with same data
    writeProcessedFile(processedDir, file1)

    // Second run: rollup already exists, skip
    const secondResult = rollupOldProcessedFiles(processedDir, weeklyDir, today)
    expect(secondResult).toEqual([])

    // Weekly file should still exist (not overwritten)
    const weeklyFiles = readdirSync(weeklyDir)
    expect(weeklyFiles.length).toBe(1)
  })

  test('creates separate weekly files for different weeks', () => {
    // Two different weeks: 2025-W02 and 2025-W03
    writeProcessedFile(processedDir, '2025-01-06') // W02
    writeProcessedFile(processedDir, '2025-01-13') // W03

    const result = rollupOldProcessedFiles(processedDir, weeklyDir, today)

    expect(result).toHaveLength(2)
    const weeklyFiles = readdirSync(weeklyDir).sort()
    expect(weeklyFiles).toEqual(['2025-W02.json', '2025-W03.json'])
  })

  test('preserves recent files while rolling up old ones', () => {
    const oldDate = '2025-01-06'
    const recentDate = dateDaysAgo(today, 30)

    writeProcessedFile(processedDir, oldDate)
    writeProcessedFile(processedDir, recentDate)

    const result = rollupOldProcessedFiles(processedDir, weeklyDir, today)

    expect(result).toEqual([`${oldDate}.json`])
    expect(existsSync(join(processedDir, `${oldDate}.json`))).toBe(false)
    expect(existsSync(join(processedDir, `${recentDate}.json`))).toBe(true)
  })

  test('topPages contains top N pages by gscImpressions', () => {
    // Write a day with 15 distinct pages
    const date = '2025-01-06'
    const pages = Array.from({ length: 15 }, (_, i) => ({
      path: `/tool-${i + 1}/`,
      sessions: i + 1,
      events: { page_view: i + 1 } as Record<string, number>,
      gscImpressions: (i + 1) * 10,
      gscClicks: i + 1,
      gscAvgPosition: 5.0,
    }))
    const dayData = { date, pages, queries: [], clarity: null }
    writeFileSync(join(processedDir, `${date}.json`), JSON.stringify(dayData, null, 2), 'utf-8')

    rollupOldProcessedFiles(processedDir, weeklyDir, today)

    const weeklyFile = readdirSync(weeklyDir)[0]!
    const content = JSON.parse(readFileSync(join(weeklyDir, weeklyFile), 'utf-8')) as {
      topPages: Array<{ path: string; gscImpressions: number }>
    }

    // Should have at most 10 pages (TOP_N)
    expect(content.topPages.length).toBeLessThanOrEqual(10)
    // Top page should have highest impressions
    const sortedImpressions = content.topPages.map((p) => p.gscImpressions)
    const isSorted = sortedImpressions.every(
      (v, i) => i === 0 || v <= (sortedImpressions[i - 1] ?? Infinity)
    )
    expect(isSorted).toBe(true)
  })

  test('handles avgGscPosition null gracefully', () => {
    const date = '2025-01-06'
    const dayData = {
      date,
      pages: [
        {
          path: '/test/',
          sessions: 5,
          events: {},
          gscImpressions: 0, // no impressions → avgGscPosition null
          gscClicks: 0,
          gscAvgPosition: null,
        },
      ],
      queries: [],
      clarity: null,
    }
    writeFileSync(join(processedDir, `${date}.json`), JSON.stringify(dayData, null, 2), 'utf-8')

    rollupOldProcessedFiles(processedDir, weeklyDir, today)

    const weeklyFile = readdirSync(weeklyDir)[0]!
    const content = JSON.parse(readFileSync(join(weeklyDir, weeklyFile), 'utf-8')) as {
      avgGscPosition: number | null
      topPages: Array<{ gscAvgPosition: number | null }>
    }
    expect(content.avgGscPosition).toBeNull()
    expect(content.topPages[0]?.gscAvgPosition).toBeNull()
  })
})
