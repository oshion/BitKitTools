/**
 * @jest-environment node
 */

import type {
  CtrBenchmarkTable,
  PageCtrSample,
} from '../detectCtrAnomalies'
import {
  DEFAULT_MIN_IMPRESSIONS,
  DEFAULT_MIN_SAMPLE_SIZE,
  DEFAULT_PERCENTILE_THRESHOLD,
  DEFAULT_RATIO_THRESHOLD,
  detectBenchmarkAnomalies,
  detectCtrAnomalies,
  detectPercentileAnomalies,
  filterByMinImpressions,
} from '../detectCtrAnomalies'

// ── Test fixtures ─────────────────────────────────────────────────────────────

const BENCHMARK: CtrBenchmarkTable = {
  byPosition: [
    { position: 1, expectedCtr: 0.28 },
    { position: 2, expectedCtr: 0.15 },
    { position: 3, expectedCtr: 0.11 },
    { position: 4, expectedCtr: 0.08 },
    { position: 5, expectedCtr: 0.07 },
    { position: 6, expectedCtr: 0.05 },
    { position: 7, expectedCtr: 0.04 },
    { position: 8, expectedCtr: 0.03 },
    { position: 9, expectedCtr: 0.03 },
    { position: 10, expectedCtr: 0.02 },
  ],
  defaultExpectedCtrBeyondPosition10: 0.01,
}

function makeSample(overrides: Partial<PageCtrSample> = {}): PageCtrSample {
  return {
    page: '/developer/json-formatter',
    query: 'json formatter',
    impressions: 100,
    clicks: 10,
    avgPosition: 3,
    ...overrides,
  }
}

/** Build N samples with healthy CTRs (not anomalous under default thresholds) */
function makeHealthySamples(
  n: number,
  baseOverrides: Partial<PageCtrSample> = {}
): PageCtrSample[] {
  return Array.from({ length: n }, (_, i) => ({
    page: `/tool-${i}`,
    query: `query-${i}`,
    impressions: 100,
    clicks: 20, // CTR = 20%, well above any benchmark threshold at position 3
    avgPosition: 3,
    ...baseOverrides,
  }))
}

// ── filterByMinImpressions ────────────────────────────────────────────────────

describe('filterByMinImpressions', () => {
  test('returns all samples when all meet the threshold', () => {
    const samples = [makeSample({ impressions: 10 }), makeSample({ impressions: 50 })]
    expect(filterByMinImpressions(samples, 10)).toHaveLength(2)
  })

  test('excludes samples strictly below the threshold', () => {
    const samples = [makeSample({ impressions: 9 }), makeSample({ impressions: 10 })]
    const result = filterByMinImpressions(samples, 10)
    expect(result).toHaveLength(1)
    expect(result[0]!.impressions).toBe(10)
  })

  test('returns empty array when all samples are below threshold', () => {
    const samples = [makeSample({ impressions: 1 }), makeSample({ impressions: 5 })]
    expect(filterByMinImpressions(samples, 10)).toHaveLength(0)
  })

  test('returns empty array for empty input', () => {
    expect(filterByMinImpressions([], 10)).toHaveLength(0)
  })

  test('sample exactly at threshold is included (boundary: inclusive)', () => {
    const sample = makeSample({ impressions: DEFAULT_MIN_IMPRESSIONS })
    expect(filterByMinImpressions([sample], DEFAULT_MIN_IMPRESSIONS)).toHaveLength(1)
  })
})

// ── detectBenchmarkAnomalies ──────────────────────────────────────────────────

describe('detectBenchmarkAnomalies', () => {
  describe('impression gate', () => {
    test('excludes samples with fewer than minImpressions', () => {
      const sample = makeSample({
        impressions: 9,
        clicks: 0,
        avgPosition: 1, // position 1, expected 0.28, CTR=0 — would be flagged without gate
      })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK, { minImpressions: 10 })
      expect(result).toHaveLength(0)
    })

    test('includes samples exactly at minImpressions', () => {
      const sample = makeSample({
        impressions: 10,
        clicks: 0, // CTR=0, position 1, expected 0.28 → flagged
        avgPosition: 1,
      })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK, { minImpressions: 10 })
      expect(result).toHaveLength(1)
    })
  })

  describe('benchmark comparison', () => {
    test('flags sample when CTR is at or below ratioThreshold × expectedCtr', () => {
      // position 3 → expected 0.11; threshold 0.5 → ceiling = 0.055
      // CTR = 5/100 = 0.05 ≤ 0.055 → flagged
      const sample = makeSample({ impressions: 100, clicks: 5, avgPosition: 3 })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK, { ratioThreshold: 0.5 })
      expect(result).toHaveLength(1)
      expect(result[0]!.reasons).toContain('below-benchmark')
    })

    test('does NOT flag sample when CTR is above ratioThreshold × expectedCtr', () => {
      // position 3 → expected 0.11; threshold 0.5 → ceiling = 0.055
      // CTR = 6/100 = 0.06 > 0.055 → not flagged
      const sample = makeSample({ impressions: 100, clicks: 6, avgPosition: 3 })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK, { ratioThreshold: 0.5 })
      expect(result).toHaveLength(0)
    })

    test('boundary: CTR exactly equal to ratioThreshold × expectedCtr is flagged', () => {
      // position 3 → expected 0.11; threshold 0.5 → ceiling = 0.055
      // CTR = 5.5/100 = 0.055 === 0.055 → flagged (inclusive)
      const sample = makeSample({ impressions: 100, clicks: 5.5, avgPosition: 3 })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK, { ratioThreshold: 0.5 })
      expect(result).toHaveLength(1)
    })

    test('uses defaultExpectedCtrBeyondPosition10 for positions > 10', () => {
      // position 11 → uses default 0.01; threshold 0.5 → ceiling = 0.005
      // CTR = 0/100 = 0 ≤ 0.005 → flagged
      const sample = makeSample({ impressions: 100, clicks: 0, avgPosition: 11 })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK)
      expect(result).toHaveLength(1)

      // CTR = 1/100 = 0.01 > 0.005 → not flagged
      const goodSample = makeSample({ impressions: 100, clicks: 1, avgPosition: 11 })
      const good = detectBenchmarkAnomalies([goodSample], BENCHMARK)
      expect(good).toHaveLength(0)
    })

    test('rounds non-integer avgPosition to nearest integer for benchmark lookup', () => {
      // 3.4 rounds to 3, expected 0.11; threshold 0.5 → ceiling = 0.055
      // CTR = 5/100 = 0.05 ≤ 0.055 → flagged
      const sample = makeSample({ impressions: 100, clicks: 5, avgPosition: 3.4 })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK, { ratioThreshold: 0.5 })
      expect(result).toHaveLength(1)
    })

    test('rounds 3.6 to 4, expected 0.08; threshold 0.5 → ceiling 0.04 — CTR 0.05 not flagged', () => {
      // 3.6 rounds to 4, expected 0.08; threshold 0.5 → ceiling = 0.04
      // CTR = 5/100 = 0.05 > 0.04 → not flagged
      const sample = makeSample({ impressions: 100, clicks: 5, avgPosition: 3.6 })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK, { ratioThreshold: 0.5 })
      expect(result).toHaveLength(0)
    })

    test('returns empty array for empty input', () => {
      expect(detectBenchmarkAnomalies([], BENCHMARK)).toHaveLength(0)
    })

    test('result includes correct page, query, and ctr fields', () => {
      const sample = makeSample({ page: '/foo', query: 'bar', impressions: 100, clicks: 0, avgPosition: 1 })
      const [anomaly] = detectBenchmarkAnomalies([sample], BENCHMARK)
      expect(anomaly!.page).toBe('/foo')
      expect(anomaly!.query).toBe('bar')
      expect(anomaly!.ctr).toBeCloseTo(0)
    })
  })

  describe('uses default constants when options are omitted', () => {
    test('DEFAULT_MIN_IMPRESSIONS gate applies without explicit option', () => {
      const below = makeSample({ impressions: DEFAULT_MIN_IMPRESSIONS - 1, clicks: 0, avgPosition: 1 })
      expect(detectBenchmarkAnomalies([below], BENCHMARK)).toHaveLength(0)
      const at = makeSample({ impressions: DEFAULT_MIN_IMPRESSIONS, clicks: 0, avgPosition: 1 })
      expect(detectBenchmarkAnomalies([at], BENCHMARK)).toHaveLength(1)
    })

    test('DEFAULT_RATIO_THRESHOLD applies without explicit option', () => {
      // position 3 → 0.11 * 0.5 = 0.055 ceiling
      const flagged = makeSample({ impressions: 100, clicks: 5, avgPosition: 3 })
      expect(detectBenchmarkAnomalies([flagged], BENCHMARK)).toHaveLength(1)
      const ok = makeSample({ impressions: 100, clicks: 6, avgPosition: 3 })
      expect(detectBenchmarkAnomalies([ok], BENCHMARK)).toHaveLength(0)
    })
  })
})

// ── detectPercentileAnomalies ─────────────────────────────────────────────────

describe('detectPercentileAnomalies', () => {
  describe('minSampleSize gate', () => {
    test('returns empty array silently when samples < minSampleSize', () => {
      const samples = makeHealthySamples(DEFAULT_MIN_SAMPLE_SIZE - 1)
      const result = detectPercentileAnomalies(samples)
      expect(result).toHaveLength(0)
    })

    test('returns empty array when there are zero samples', () => {
      expect(detectPercentileAnomalies([])).toHaveLength(0)
    })

    test('returns empty array when fewer than minSampleSize samples pass impression gate', () => {
      // 25 samples but all have low impressions — none pass the gate
      const lowImpression = Array.from({ length: 25 }, (_, i) =>
        makeSample({ page: `/p${i}`, query: `q${i}`, impressions: 1, clicks: 0 })
      )
      const result = detectPercentileAnomalies(lowImpression, {
        minImpressions: 10,
        minSampleSize: 20,
      })
      expect(result).toHaveLength(0)
    })

    test('activates when qualifying samples reach exactly minSampleSize', () => {
      // 20 samples, all with 100 impressions but one has CTR=0 (clearly lowest)
      const samples: PageCtrSample[] = [
        makeSample({ page: '/low', query: 'q', impressions: 100, clicks: 0 }),
        ...makeHealthySamples(DEFAULT_MIN_SAMPLE_SIZE - 1),
      ]
      const result = detectPercentileAnomalies(samples, { percentileThreshold: DEFAULT_PERCENTILE_THRESHOLD })
      // At least the 0-CTR sample should be in the bottom 20%
      expect(result.length).toBeGreaterThan(0)
      expect(result.some((a) => a.page === '/low')).toBe(true)
    })
  })

  describe('percentile ranking', () => {
    test('flags samples in the bottom percentileThreshold%', () => {
      // 20 samples: 1 with CTR=0, rest with CTR=0.2
      const samples: PageCtrSample[] = [
        makeSample({ page: '/zero', query: 'zero', impressions: 100, clicks: 0 }),
        ...makeHealthySamples(19),
      ]
      const result = detectPercentileAnomalies(samples, {
        minSampleSize: 20,
        percentileThreshold: 10, // bottom 10%
      })
      expect(result.some((a) => a.page === '/zero')).toBe(true)
    })

    test('does not flag samples well above the threshold', () => {
      // All identical CTR=0.2. Ranks: idx/(total-1)*100.
      // 20 samples: idx=0 → 0%, idx=1 → 5.26%, idx=2 → 10.53%
      // Bottom 10% (strictly below) → indices 0 and 1 are flagged (0% and 5.26%).
      const samples = makeHealthySamples(20)
      const result = detectPercentileAnomalies(samples, {
        minSampleSize: 20,
        percentileThreshold: 10,
      })
      expect(result).toHaveLength(2)
      // The rest (indices 2–19) are NOT flagged
      const flaggedPages = new Set(result.map((a) => a.page))
      samples.slice(2).forEach((s) => expect(flaggedPages.has(s.page)).toBe(false))
    })

    test('reason is below-site-percentile for flagged samples', () => {
      const samples: PageCtrSample[] = [
        makeSample({ page: '/low', query: 'q', impressions: 100, clicks: 0 }),
        ...makeHealthySamples(19),
      ]
      const [anomaly] = detectPercentileAnomalies(samples, {
        minSampleSize: 20,
        percentileThreshold: 10,
      })
      expect(anomaly!.reasons).toEqual(['below-site-percentile'])
    })

    test('includes ctr field with computed value', () => {
      const samples: PageCtrSample[] = [
        makeSample({ page: '/low', query: 'q', impressions: 200, clicks: 4 }), // CTR = 0.02
        ...makeHealthySamples(19),
      ]
      const result = detectPercentileAnomalies(samples, {
        minSampleSize: 20,
        percentileThreshold: 10,
      })
      const low = result.find((a) => a.page === '/low')
      expect(low).toBeDefined()
      expect(low!.ctr).toBeCloseTo(0.02)
    })
  })

  describe('impression filtering before percentile calculation', () => {
    test('low-impression samples are excluded before percentile calculation', () => {
      // 1 sample with low impressions (should be excluded), 20 qualifying
      const samples: PageCtrSample[] = [
        makeSample({ page: '/low-imp', query: 'q', impressions: 5, clicks: 0 }), // below gate
        ...makeHealthySamples(20),
      ]
      const result = detectPercentileAnomalies(samples, {
        minImpressions: 10,
        minSampleSize: 20,
      })
      // /low-imp is excluded before the percentile calculation
      expect(result.every((a) => a.page !== '/low-imp')).toBe(true)
    })
  })
})

// ── detectCtrAnomalies ────────────────────────────────────────────────────────

describe('detectCtrAnomalies', () => {
  describe('de-duplication and merging of reasons', () => {
    test('a sample flagged by both filters gets both reasons in one anomaly', () => {
      // Position 1 → expected 0.28; CTR = 0 → benchmark-flagged.
      // Make it the lowest in a dataset of 20 → percentile-flagged too.
      const lowestSample = makeSample({
        page: '/both',
        query: 'both-query',
        impressions: 100,
        clicks: 0,
        avgPosition: 1,
      })
      const samples = [lowestSample, ...makeHealthySamples(19)]

      const result = detectCtrAnomalies(samples, BENCHMARK, {
        minSampleSize: 20,
        percentileThreshold: 10,
      })

      const bothAnomaly = result.find((a) => a.page === '/both')
      expect(bothAnomaly).toBeDefined()
      expect(bothAnomaly!.reasons).toContain('below-benchmark')
      expect(bothAnomaly!.reasons).toContain('below-site-percentile')
      expect(bothAnomaly!.reasons).toHaveLength(2)
    })

    test('a sample flagged by benchmark only has one reason', () => {
      // Only 5 qualifying samples → percentile filter inactive
      const low = makeSample({ page: '/bench-only', query: 'q', impressions: 100, clicks: 0, avgPosition: 1 })
      const others = makeHealthySamples(4)
      const result = detectCtrAnomalies([low, ...others], BENCHMARK, {
        minSampleSize: 20,
      })
      const anomaly = result.find((a) => a.page === '/bench-only')
      expect(anomaly).toBeDefined()
      expect(anomaly!.reasons).toEqual(['below-benchmark'])
    })
  })

  describe('sorting: dual-filter matches appear first', () => {
    test('samples in both filters come before single-filter samples', () => {
      // lowestSample — flagged by both
      const lowestSample = makeSample({
        page: '/both',
        query: 'q0',
        impressions: 100,
        clicks: 0,
        avgPosition: 1,
      })
      // secondSample — benchmark-flagged only (CTR=0.02 at position 3;
      // expected = 0.11 * 0.5 = 0.055; 0.02 ≤ 0.055 → flagged)
      // but its CTR is higher than /both (0 vs 0.02), so not in bottom 10%
      const secondSample = makeSample({
        page: '/bench-only',
        query: 'q1',
        impressions: 100,
        clicks: 2,
        avgPosition: 3,
      })
      const healthy = makeHealthySamples(18)
      const samples = [lowestSample, secondSample, ...healthy]

      const result = detectCtrAnomalies(samples, BENCHMARK, {
        minSampleSize: 20,
        percentileThreshold: 10,
      })

      const bothIdx = result.findIndex((a) => a.page === '/both')
      const benchIdx = result.findIndex((a) => a.page === '/bench-only')
      expect(bothIdx).toBeLessThan(benchIdx)
    })
  })

  describe('passes all options to sub-filters', () => {
    test('respects minImpressions override', () => {
      const low = makeSample({ impressions: 9, clicks: 0, avgPosition: 1 })
      const result = detectCtrAnomalies([low], BENCHMARK, { minImpressions: 10 })
      expect(result).toHaveLength(0)
    })

    test('respects minSampleSize override — percentile filter stays inactive', () => {
      // 10 samples: all below benchmark (CTR=0 at position 1)
      const samples = Array.from({ length: 10 }, (_, i) =>
        makeSample({ page: `/p${i}`, query: `q${i}`, clicks: 0, avgPosition: 1, impressions: 100 })
      )
      const result = detectCtrAnomalies(samples, BENCHMARK, { minSampleSize: 20 })
      // All should be benchmark-flagged, none percentile-flagged
      expect(result.every((a) => a.reasons.length === 1)).toBe(true)
      expect(result.every((a) => a.reasons[0] === 'below-benchmark')).toBe(true)
    })

    test('returns empty array for empty input', () => {
      expect(detectCtrAnomalies([], BENCHMARK)).toHaveLength(0)
    })
  })

  describe('uses default constants when no options provided', () => {
    test('impression gate uses DEFAULT_MIN_IMPRESSIONS', () => {
      const below = makeSample({ impressions: DEFAULT_MIN_IMPRESSIONS - 1, clicks: 0, avgPosition: 1 })
      expect(detectCtrAnomalies([below], BENCHMARK)).toHaveLength(0)
    })

    test('ratio threshold uses DEFAULT_RATIO_THRESHOLD', () => {
      // position 3 → 0.11 * DEFAULT_RATIO_THRESHOLD (0.5) = 0.055
      const flagged = makeSample({ impressions: 100, clicks: 5, avgPosition: 3 })
      const result = detectCtrAnomalies([flagged], BENCHMARK)
      expect(result).toHaveLength(1)
    })

    test('percentile filter uses DEFAULT_MIN_SAMPLE_SIZE (inactive below it)', () => {
      const samples = makeHealthySamples(DEFAULT_MIN_SAMPLE_SIZE - 1)
      // None should be flagged by percentile (dataset too small)
      const result = detectCtrAnomalies(samples, BENCHMARK)
      expect(result.every((a) => !a.reasons.includes('below-site-percentile'))).toBe(true)
    })

    test('percentile filter uses DEFAULT_PERCENTILE_THRESHOLD once active', () => {
      const low = makeSample({ page: '/low', query: 'q', clicks: 0, avgPosition: 1, impressions: 100 })
      const samples = [low, ...makeHealthySamples(DEFAULT_MIN_SAMPLE_SIZE - 1)]
      const result = detectCtrAnomalies(samples, BENCHMARK)
      // /low is CTR=0 → benchmark and percentile flagged
      const anomaly = result.find((a) => a.page === '/low')
      expect(anomaly!.reasons).toContain('below-site-percentile')
    })
  })

  describe('real-world benchmark file values', () => {
    test('position > 10 falls back to defaultExpectedCtrBeyondPosition10', () => {
      // position 15 → default 0.01; threshold 0.5 → ceiling = 0.005
      // CTR = 0/100 = 0 ≤ 0.005 → flagged
      const sample = makeSample({ impressions: 100, clicks: 0, avgPosition: 15 })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK)
      expect(result).toHaveLength(1)
    })

    test('position 10 uses position-10 expectedCtr (0.02)', () => {
      // position 10 → expected 0.02; threshold 0.5 → ceiling = 0.01
      // CTR = 1/100 = 0.01 ≤ 0.01 → flagged (boundary)
      const sample = makeSample({ impressions: 100, clicks: 1, avgPosition: 10 })
      const result = detectBenchmarkAnomalies([sample], BENCHMARK, { ratioThreshold: DEFAULT_RATIO_THRESHOLD })
      expect(result).toHaveLength(1)

      // CTR = 2/100 = 0.02 > 0.01 → not flagged
      const goodSample = makeSample({ impressions: 100, clicks: 2, avgPosition: 10 })
      const good = detectBenchmarkAnomalies([goodSample], BENCHMARK, { ratioThreshold: DEFAULT_RATIO_THRESHOLD })
      expect(good).toHaveLength(0)
    })
  })
})
