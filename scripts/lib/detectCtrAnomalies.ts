/**
 * CTR Anomaly Detection
 *
 * Pure functions that detect pages/queries with abnormally low CTR using
 * two complementary filters:
 *
 *   1. Benchmark filter — always active; compares each sample's CTR against
 *      an industry-average reference table keyed by avgPosition.
 *   2. Percentile filter — self-activates once the dataset is large enough
 *      (minSampleSize); flags the bottom N% of CTRs across the dataset.
 *
 * This module is intentionally policy-free: it answers "is this CTR bad?"
 * and nothing more. YMYL exclusions, concurrent-run limits, and auto-merge
 * decisions are the responsibility of the callers (run-title-experiment.ts,
 * Phase 4 spec generators, etc.).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PageCtrSample {
  /** URL or slug — the caller decides the identifier format */
  page: string
  query: string
  impressions: number
  clicks: number
  avgPosition: number
}

export interface PositionCtrBenchmark {
  position: number
  expectedCtr: number
}

export interface CtrBenchmarkTable {
  byPosition: PositionCtrBenchmark[]
  defaultExpectedCtrBeyondPosition10: number
}

export interface CtrAnomaly {
  page: string
  query: string
  /** Actual CTR: clicks / impressions */
  ctr: number
  /** Both reasons appear when the sample fails both filters */
  reasons: Array<'below-benchmark' | 'below-site-percentile'>
}

// ── Default option constants ───────────────────────────────────────────────────

/** Samples with fewer impressions than this are excluded from all filters */
export const DEFAULT_MIN_IMPRESSIONS = 10

/**
 * A sample's CTR must be at or below this fraction of the expected benchmark
 * CTR to be flagged by the benchmark filter.
 * e.g. 0.5 means "actual CTR ≤ 50% of expected CTR"
 */
export const DEFAULT_RATIO_THRESHOLD = 0.5

/**
 * The percentile filter only activates once this many qualifying samples
 * (impressions ≥ minImpressions) exist. Below this, the filter returns [].
 */
export const DEFAULT_MIN_SAMPLE_SIZE = 20

/**
 * The bottom N% of CTRs (by percentile rank) are flagged by the percentile
 * filter. e.g. 20 means "flag the lowest 20%".
 */
export const DEFAULT_PERCENTILE_THRESHOLD = 20

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute CTR safely; returns 0 when impressions is 0. */
function computeCtr(sample: PageCtrSample): number {
  if (sample.impressions === 0) return 0
  return sample.clicks / sample.impressions
}

/**
 * Look up expected CTR for a given avgPosition.
 * Non-integer positions are rounded to the nearest integer.
 * Positions beyond 10 fall back to `defaultExpectedCtrBeyondPosition10`.
 */
function lookupExpectedCtr(
  avgPosition: number,
  benchmark: CtrBenchmarkTable
): number {
  const rounded = Math.round(avgPosition)
  const entry = benchmark.byPosition.find((b) => b.position === rounded)
  return entry ? entry.expectedCtr : benchmark.defaultExpectedCtrBeyondPosition10
}

/** Unique key for de-duplicating anomalies across filters */
function anomalyKey(anomaly: CtrAnomaly): string {
  return `${anomaly.page}|||${anomaly.query}`
}

// ── Filter: minimum impressions ───────────────────────────────────────────────

/**
 * Returns only samples that meet the minimum-impressions gate.
 * Samples below the threshold are excluded from both the benchmark and
 * percentile filters.
 */
export function filterByMinImpressions(
  samples: PageCtrSample[],
  minImpressions: number
): PageCtrSample[] {
  return samples.filter((s) => s.impressions >= minImpressions)
}

// ── Filter 1: benchmark anomaly detection ─────────────────────────────────────

/**
 * Flags samples whose CTR is at or below `ratioThreshold × expectedCtr`.
 *
 * Samples with fewer than `minImpressions` impressions are excluded before
 * comparison (same gate as `filterByMinImpressions`).
 *
 * Position is rounded to the nearest integer for benchmark lookup; positions
 * beyond 10 use `defaultExpectedCtrBeyondPosition10`.
 *
 * Boundary: `actualCtr <= expectedCtr * ratioThreshold` is flagged (inclusive).
 */
export function detectBenchmarkAnomalies(
  samples: PageCtrSample[],
  benchmark: CtrBenchmarkTable,
  options?: {
    minImpressions?: number
    ratioThreshold?: number
  }
): CtrAnomaly[] {
  const minImpressions = options?.minImpressions ?? DEFAULT_MIN_IMPRESSIONS
  const ratioThreshold = options?.ratioThreshold ?? DEFAULT_RATIO_THRESHOLD

  const qualifying = filterByMinImpressions(samples, minImpressions)

  return qualifying.flatMap((s) => {
    const ctr = computeCtr(s)
    const expectedCtr = lookupExpectedCtr(s.avgPosition, benchmark)
    if (ctr <= expectedCtr * ratioThreshold) {
      return [{ page: s.page, query: s.query, ctr, reasons: ['below-benchmark'] }]
    }
    return []
  })
}

// ── Filter 2: percentile anomaly detection ────────────────────────────────────

/**
 * Flags samples whose CTR falls in the bottom `percentileThreshold`% of the
 * dataset.
 *
 * Returns an empty array (silently, no warnings or errors) when the number of
 * qualifying samples (impressions ≥ minImpressions) is less than
 * `minSampleSize`.
 *
 * Boundary for percentile rank: a sample's rank is its 0-based index in the
 * CTR-ascending-sorted list, expressed as a percentage of (total - 1). A
 * sample is flagged when its percentile rank is strictly below
 * `percentileThreshold`. When there is only one sample, its rank is defined as
 * 0% and it is flagged if percentileThreshold > 0.
 */
export function detectPercentileAnomalies(
  samples: PageCtrSample[],
  options?: {
    minImpressions?: number
    minSampleSize?: number
    percentileThreshold?: number
  }
): CtrAnomaly[] {
  const minImpressions = options?.minImpressions ?? DEFAULT_MIN_IMPRESSIONS
  const minSampleSize = options?.minSampleSize ?? DEFAULT_MIN_SAMPLE_SIZE
  const percentileThreshold = options?.percentileThreshold ?? DEFAULT_PERCENTILE_THRESHOLD

  const qualifying = filterByMinImpressions(samples, minImpressions)

  // Silently return empty when there are not enough samples
  if (qualifying.length < minSampleSize) {
    return []
  }

  // Sort by CTR ascending to compute percentile rank
  const sorted = [...qualifying].sort((a, b) => computeCtr(a) - computeCtr(b))
  const total = sorted.length

  return sorted.flatMap((s, idx) => {
    const percentileRank = total === 1 ? 0 : (idx / (total - 1)) * 100
    if (percentileRank < percentileThreshold) {
      const ctr = computeCtr(s)
      return [{ page: s.page, query: s.query, ctr, reasons: ['below-site-percentile'] }]
    }
    return []
  })
}

// ── Combined detector ─────────────────────────────────────────────────────────

/**
 * Runs both filters and merges the results.
 *
 * De-duplication: when a page+query pair appears in both filters, it produces
 * a single `CtrAnomaly` with both reasons in the `reasons` array.
 *
 * Sorting: entries that appear in both filters (reasons.length === 2) are
 * placed before entries that appear in only one filter.
 */
export function detectCtrAnomalies(
  samples: PageCtrSample[],
  benchmark: CtrBenchmarkTable,
  options?: {
    minImpressions?: number
    ratioThreshold?: number
    minSampleSize?: number
    percentileThreshold?: number
  }
): CtrAnomaly[] {
  const benchmarkAnomalies = detectBenchmarkAnomalies(samples, benchmark, {
    minImpressions: options?.minImpressions,
    ratioThreshold: options?.ratioThreshold,
  })
  const percentileAnomalies = detectPercentileAnomalies(samples, {
    minImpressions: options?.minImpressions,
    minSampleSize: options?.minSampleSize,
    percentileThreshold: options?.percentileThreshold,
  })

  // Build a map keyed by page+query for de-duplication
  const map = new Map<string, CtrAnomaly>()

  for (const anomaly of benchmarkAnomalies) {
    map.set(anomalyKey(anomaly), { ...anomaly })
  }

  for (const anomaly of percentileAnomalies) {
    const key = anomalyKey(anomaly)
    const existing = map.get(key)
    if (existing) {
      // Merge reasons (benchmark anomaly already in map; add percentile reason)
      existing.reasons = [...existing.reasons, 'below-site-percentile']
    } else {
      map.set(key, { ...anomaly })
    }
  }

  const merged = Array.from(map.values())

  // Sort: both-filter matches first, then single-filter matches
  merged.sort((a, b) => b.reasons.length - a.reasons.length)

  return merged
}
