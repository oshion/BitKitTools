/**
 * @jest-environment node
 */

import type { PageLighthouseScore, FlaggedCategory } from '../lighthouseThreshold'
import { findScoresBelowThreshold } from '../lighthouseThreshold'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePage(overrides: Partial<PageLighthouseScore> = {}): PageLighthouseScore {
  return {
    url: 'https://bitkittools.com/',
    performance: 95,
    accessibility: 95,
    bestPractices: 95,
    seo: 100,
    ...overrides,
  }
}

// ── findScoresBelowThreshold ──────────────────────────────────────────────────

describe('findScoresBelowThreshold', () => {
  describe('empty input', () => {
    test('returns empty array when scores array is empty', () => {
      expect(findScoresBelowThreshold([], 90)).toEqual([])
    })
  })

  describe('all scores above threshold', () => {
    test('returns empty array when all scores are above threshold', () => {
      const scores = [makePage({ performance: 95, accessibility: 98, bestPractices: 92, seo: 100 })]
      expect(findScoresBelowThreshold(scores, 90)).toEqual([])
    })

    test('returns empty array when all scores exactly equal the threshold', () => {
      const scores = [makePage({ performance: 90, accessibility: 90, bestPractices: 90, seo: 90 })]
      // score === threshold is NOT flagged (only score < threshold is flagged)
      expect(findScoresBelowThreshold(scores, 90)).toEqual([])
    })
  })

  describe('boundary: score === threshold is passing', () => {
    test('score exactly at threshold (90) passes, score 89 fails', () => {
      const scores = [
        makePage({ url: 'https://example.com/a', performance: 90 }), // exactly threshold → pass
        makePage({ url: 'https://example.com/b', performance: 89 }), // one below → fail
      ]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ url: 'https://example.com/b', category: 'performance', score: 89 })
    })

    test('works with threshold = 50', () => {
      const scores = [makePage({ performance: 50, accessibility: 49 })]
      const result = findScoresBelowThreshold(scores, 50)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ category: 'accessibility', score: 49 })
    })
  })

  describe('single category below threshold', () => {
    test('flags only the performance category when it is below threshold', () => {
      const scores = [makePage({ performance: 75, accessibility: 95, bestPractices: 92, seo: 100 })]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual<FlaggedCategory>({
        url: 'https://bitkittools.com/',
        category: 'performance',
        score: 75,
      })
    })

    test('flags only the accessibility category', () => {
      const scores = [makePage({ accessibility: 82 })]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ category: 'accessibility', score: 82 })
    })

    test('flags only the bestPractices category', () => {
      const scores = [makePage({ bestPractices: 67 })]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ category: 'bestPractices', score: 67 })
    })

    test('flags only the seo category', () => {
      const scores = [makePage({ seo: 80 })]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ category: 'seo', score: 80 })
    })
  })

  describe('multiple categories below threshold on a single page', () => {
    test('flags all categories that are below threshold', () => {
      const scores = [
        makePage({
          url: 'https://bitkittools.com/beer/bac-calculator/',
          performance: 65,
          accessibility: 80,
          bestPractices: 75,
          seo: 95,
        }),
      ]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(3)
      const categories = result.map((r) => r.category).sort()
      expect(categories).toEqual(['accessibility', 'bestPractices', 'performance'])
    })

    test('flags all four categories when all are below threshold', () => {
      const scores = [makePage({ performance: 50, accessibility: 60, bestPractices: 70, seo: 80 })]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(4)
    })
  })

  describe('multiple pages with failures', () => {
    test('flags entries across multiple pages', () => {
      const scores = [
        makePage({ url: 'https://bitkittools.com/', performance: 85 }),
        makePage({ url: 'https://bitkittools.com/developer/json-formatter/', accessibility: 88 }),
        makePage({ url: 'https://bitkittools.com/baby/growth-percentile/', seo: 95 }), // all pass
      ]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(2)
      expect(result.find((r) => r.url.includes('bitkittools.com/') && r.category === 'performance')).toBeDefined()
      expect(result.find((r) => r.url.includes('json-formatter') && r.category === 'accessibility')).toBeDefined()
    })

    test('returns all flagged entries from all pages in order', () => {
      const scores = [
        makePage({ url: 'https://a.com/', performance: 70, accessibility: 80 }),
        makePage({ url: 'https://b.com/', bestPractices: 85 }),
      ]
      const result = findScoresBelowThreshold(scores, 90)
      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({ url: 'https://a.com/', category: 'performance' })
      expect(result[1]).toMatchObject({ url: 'https://a.com/', category: 'accessibility' })
      expect(result[2]).toMatchObject({ url: 'https://b.com/', category: 'bestPractices' })
    })
  })

  describe('threshold variation', () => {
    test('threshold = 0 never flags anything', () => {
      const scores = [makePage({ performance: 0, accessibility: 0, bestPractices: 0, seo: 0 })]
      expect(findScoresBelowThreshold(scores, 0)).toEqual([])
    })

    test('threshold = 100 flags anything below perfect', () => {
      const scores = [makePage({ performance: 99, accessibility: 100, bestPractices: 100, seo: 100 })]
      const result = findScoresBelowThreshold(scores, 100)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ category: 'performance', score: 99 })
    })

    test('adjusting threshold from 90 to 50 changes which entries are flagged', () => {
      const scores = [makePage({ performance: 75, accessibility: 95 })]
      // With threshold 90: performance (75) is flagged
      expect(findScoresBelowThreshold(scores, 90)).toHaveLength(1)
      // With threshold 50: nothing flagged (75 >= 50, 95 >= 50)
      expect(findScoresBelowThreshold(scores, 50)).toHaveLength(0)
    })
  })
})
