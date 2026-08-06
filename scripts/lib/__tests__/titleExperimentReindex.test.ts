/**
 * @jest-environment node
 */

import type { ActionLog, ActionLogEntry } from '../detectStagnation'
import type { IndexingStatusMap } from '../titleExperimentReindex'
import { findReindexedExperiments } from '../titleExperimentReindex'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SITE_URL = 'https://bitkittools.com'

function makeEntry(overrides: Partial<ActionLogEntry> = {}): ActionLogEntry {
  return {
    id: 'exp-001',
    type: 'title-experiment',
    page: '/beer/bac-calculator',
    deployedAt: '2026-07-01T00:00:00.000Z',
    description: 'A/B test: shorter title',
    ...overrides,
  }
}

function makeActionLog(entries: ActionLogEntry[]): ActionLog {
  return { actions: entries }
}

function makeStatus(overrides: Partial<IndexingStatusMap> = {}): IndexingStatusMap {
  return overrides
}

// ── Basic inclusion / exclusion ───────────────────────────────────────────────

describe('findReindexedExperiments', () => {
  describe('basic inclusion', () => {
    test('returns a confirmation when en URL lastCrawlTime is after deployedAt', () => {
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',  // after deployedAt
        },
      })

      const result = findReindexedExperiments(makeActionLog([makeEntry()]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(1)
      expect(result[0]!.actionLogEntryId).toBe('exp-001')
      expect(result[0]!.cooldownStartedAt).toBe('2026-07-10T08:00:00.000Z')
    })

    test('returns a confirmation when ko URL lastCrawlTime is after deployedAt', () => {
      const entry = makeEntry()
      const indexingStatus = makeStatus({
        [`${SITE_URL}/ko/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-12T08:00:00.000Z',  // after deployedAt
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(1)
      expect(result[0]!.cooldownStartedAt).toBe('2026-07-12T08:00:00.000Z')
    })

    test('uses the earliest crawl time when both en and ko are confirmed', () => {
      const entry = makeEntry()
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',  // earlier
        },
        [`${SITE_URL}/ko/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-12T08:00:00.000Z',  // later
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(1)
      // Should use the earliest crawl time (en URL)
      expect(result[0]!.cooldownStartedAt).toBe('2026-07-10T08:00:00.000Z')
    })
  })

  describe('basic exclusion', () => {
    test('excludes entries where lastCrawlTime is before deployedAt', () => {
      const entry = makeEntry({ deployedAt: '2026-07-15T00:00:00.000Z' })
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-16T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',  // BEFORE deployedAt
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(0)
    })

    test('excludes entries where lastCrawlTime equals deployedAt (strictly after required)', () => {
      const deployedAt = '2026-07-10T08:00:00.000Z'
      const entry = makeEntry({ deployedAt })
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-11T10:00:00.000Z',
          lastCrawlTime: deployedAt,  // EQUAL — not strictly after
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(0)
    })

    test('excludes entries where lastCrawlTime is absent', () => {
      const entry = makeEntry()
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          // lastCrawlTime intentionally absent
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(0)
    })

    test('excludes entries that already have cooldownStartedAt set', () => {
      const entry = makeEntry({ cooldownStartedAt: '2026-07-10T08:00:00.000Z' })
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-12T08:00:00.000Z',
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(0)
    })

    test('excludes entries with a different type', () => {
      const entry = makeEntry({ type: 'content-update' })
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(0)
    })

    test('returns empty array when no matching URL exists in indexingStatus', () => {
      const entry = makeEntry()
      // Completely different URL in status
      const indexingStatus = makeStatus({
        [`${SITE_URL}/developer/json-formatter`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(0)
    })

    test('returns empty array when action log is empty', () => {
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
      })

      const result = findReindexedExperiments(makeActionLog([]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(0)
    })

    test('returns empty array when indexingStatus is empty', () => {
      const entry = makeEntry()
      const result = findReindexedExperiments(makeActionLog([entry]), makeStatus(), SITE_URL)
      expect(result).toHaveLength(0)
    })
  })

  describe('trailing slash normalisation', () => {
    test('matches entry with trailing slash in page field against non-slash URL in status', () => {
      const entry = makeEntry({ page: '/beer/bac-calculator/' })  // trailing slash
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {   // no trailing slash
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(1)
    })

    test('matches entry without trailing slash against URL with trailing slash in status', () => {
      const entry = makeEntry({ page: '/beer/bac-calculator' })  // no trailing slash
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator/`]: {   // trailing slash variant
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(1)
    })
  })

  describe('multiple entries', () => {
    test('processes multiple entries independently', () => {
      const entry1 = makeEntry({ id: 'exp-001', page: '/beer/bac-calculator' })
      const entry2 = makeEntry({ id: 'exp-002', page: '/developer/json-formatter', deployedAt: '2026-07-05T00:00:00.000Z' })
      const entry3 = makeEntry({ id: 'exp-003', page: '/travel/visa-requirement-checker', cooldownStartedAt: '2026-07-08T00:00:00.000Z' })

      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',  // after exp-001 deployedAt
        },
        [`${SITE_URL}/developer/json-formatter`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-03T08:00:00.000Z',  // BEFORE exp-002 deployedAt → excluded
        },
      })

      const result = findReindexedExperiments(
        makeActionLog([entry1, entry2, entry3]),
        indexingStatus,
        SITE_URL
      )

      expect(result).toHaveLength(1)
      expect(result[0]!.actionLogEntryId).toBe('exp-001')
    })

    test('returns confirmations for all qualifying entries', () => {
      const entry1 = makeEntry({ id: 'exp-001', page: '/beer/bac-calculator', deployedAt: '2026-07-01T00:00:00.000Z' })
      const entry2 = makeEntry({ id: 'exp-002', page: '/developer/json-formatter', deployedAt: '2026-07-01T00:00:00.000Z' })

      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
        [`${SITE_URL}/developer/json-formatter`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-11T08:00:00.000Z',
        },
      })

      const result = findReindexedExperiments(
        makeActionLog([entry1, entry2]),
        indexingStatus,
        SITE_URL
      )

      expect(result).toHaveLength(2)
      const ids = result.map((r) => r.actionLogEntryId)
      expect(ids).toContain('exp-001')
      expect(ids).toContain('exp-002')
    })
  })

  describe('output shape', () => {
    test('returned cooldownStartedAt is a valid ISO string', () => {
      const entry = makeEntry()
      const crawlTime = '2026-07-10T08:30:45.000Z'
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: crawlTime,
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result).toHaveLength(1)
      // cooldownStartedAt should be parseable as a valid date
      const parsed = new Date(result[0]!.cooldownStartedAt)
      expect(isNaN(parsed.getTime())).toBe(false)
    })

    test('actionLogEntryId matches the id field of the action log entry', () => {
      const entry = makeEntry({ id: 'my-unique-id' })
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
      })

      const result = findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(result[0]!.actionLogEntryId).toBe('my-unique-id')
    })
  })

  describe('is a pure function', () => {
    test('does not mutate the action log argument', () => {
      const entry = makeEntry()
      const actionLog = makeActionLog([entry])
      const originalActionsLength = actionLog.actions.length

      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
      })

      findReindexedExperiments(actionLog, indexingStatus, SITE_URL)
      expect(actionLog.actions).toHaveLength(originalActionsLength)
      expect(actionLog.actions[0]!.cooldownStartedAt).toBeUndefined()
    })

    test('does not mutate the indexingStatus argument', () => {
      const entry = makeEntry()
      const indexingStatus = makeStatus({
        [`${SITE_URL}/beer/bac-calculator`]: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          lastCheckedAt: '2026-07-15T10:00:00.000Z',
          lastCrawlTime: '2026-07-10T08:00:00.000Z',
        },
      })
      const originalKeys = Object.keys(indexingStatus)

      findReindexedExperiments(makeActionLog([entry]), indexingStatus, SITE_URL)
      expect(Object.keys(indexingStatus)).toEqual(originalKeys)
    })
  })
})
