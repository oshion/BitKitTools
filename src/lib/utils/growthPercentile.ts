/**
 * Baby Growth Percentile Calculator
 *
 * Calculates weight and height/length percentiles for children 0–60 months
 * using the LMS (Lambda-Mu-Sigma) method developed by Cole & Green (1992).
 *
 * LMS formula:
 *   z = ((X / M)^L − 1) / (L × S)   when L ≠ 0
 *   z = ln(X / M) / S                 when |L| < 1e-6 (limit as L → 0)
 *
 * Then: percentile = Φ(z) × 100  where Φ is the standard normal CDF.
 *
 * Data sources:
 *   WHO: WHO Child Growth Standards (2006)
 *        https://www.who.int/tools/child-growth-standards/standards
 *   CDC: CDC Growth Charts (Kuczmarski et al., 2002)
 *        https://www.cdc.gov/growthcharts/
 *
 * IMPORTANT: Results are for informational/reference purposes only.
 * Clinical growth assessment must be performed by a qualified healthcare
 * professional. This tool does NOT diagnose any condition.
 */

import {
  type LMSRow,
  type GrowthStandard,
  WHO_WEIGHT_BOYS,
  WHO_WEIGHT_GIRLS,
  WHO_HEIGHT_BOYS,
  WHO_HEIGHT_GIRLS,
  CDC_WEIGHT_BOYS,
  CDC_WEIGHT_GIRLS,
  CDC_HEIGHT_BOYS,
  CDC_HEIGHT_GIRLS,
} from '@/lib/config/growthStandards'

export type GrowthInput = {
  gender: 'male' | 'female'
  /** Age in completed months (0–60) */
  ageMonths: number
  /** Weight in kilograms */
  weightKg: number
  /** Height/length in centimetres */
  heightCm: number
}

export type GrowthPercentileResult = {
  /** Weight-for-age percentile (0–100) */
  weightPercentile: number
  /** Height/length-for-age percentile (0–100) */
  heightPercentile: number
}

// ---------------------------------------------------------------------------
// Internal: LMS interpolation
// ---------------------------------------------------------------------------

/**
 * Linearly interpolates a value between two numbers.
 */
function lerp(t: number, t0: number, t1: number, v0: number, v1: number): number {
  if (t0 === t1) return v0
  return v0 + (v1 - v0) * ((t - t0) / (t1 - t0))
}

/**
 * Returns interpolated L, M, S values for a given age from a lookup table.
 * Clamps age to the table's range [first entry, last entry].
 */
function getLMSForAge(ageMonths: number, table: LMSRow[]): LMSRow {
  if (table.length === 0) {
    return { age: 0, L: 0, M: 1, S: 0.1 }
  }

  const first = table[0]!
  const last = table[table.length - 1]!

  if (ageMonths <= first.age) return first
  if (ageMonths >= last.age) return last

  // Find surrounding rows
  for (let i = 0; i < table.length - 1; i++) {
    const row0 = table[i]!
    const row1 = table[i + 1]!
    if (ageMonths >= row0.age && ageMonths <= row1.age) {
      return {
        age: ageMonths,
        L: lerp(ageMonths, row0.age, row1.age, row0.L, row1.L),
        M: lerp(ageMonths, row0.age, row1.age, row0.M, row1.M),
        S: lerp(ageMonths, row0.age, row1.age, row0.S, row1.S),
      }
    }
  }

  return last
}

// ---------------------------------------------------------------------------
// Internal: LMS → z-score
// ---------------------------------------------------------------------------

/**
 * Converts a measurement X to a z-score using the LMS method.
 * When |L| < 1e-6 the natural-log transformation is applied.
 */
function lmsToZScore(x: number, { L, M, S }: LMSRow): number {
  if (x <= 0 || M <= 0) return 0
  if (Math.abs(L) < 1e-6) {
    return Math.log(x / M) / S
  }
  return (Math.pow(x / M, L) - 1) / (L * S)
}

// ---------------------------------------------------------------------------
// Internal: z-score → percentile (standard normal CDF approximation)
// ---------------------------------------------------------------------------

/**
 * Standard normal CDF approximation (Abramowitz & Stegun 26.2.17).
 * Maximum absolute error: 7.5 × 10^{-8} — more than adequate for clinical
 * reference use where ±0.5 percentile point accuracy is sufficient.
 */
function normCDF(z: number): number {
  const b1 = 0.319381530
  const b2 = -0.356563782
  const b3 = 1.781477937
  const b4 = -1.821255978
  const b5 = 1.330274429
  const p = 0.2316419

  const absZ = Math.abs(z)
  const t = 1 / (1 + p * absZ)
  const phi = Math.exp(-0.5 * absZ * absZ) / Math.sqrt(2 * Math.PI)
  const poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))))
  const cdf = 1 - phi * poly

  return z >= 0 ? cdf : 1 - cdf
}

/**
 * Converts a z-score to a percentile (0–100), clamped to [0.1, 99.9].
 */
function zToPercentile(z: number): number {
  const p = normCDF(z) * 100
  // Clamp to avoid displaying 0th or 100th percentile (LMS approximation
  // breaks down in extreme tails beyond ±3.5 SD)
  return Math.round(Math.min(99.9, Math.max(0.1, p)) * 10) / 10
}

// ---------------------------------------------------------------------------
// Internal: table selection
// ---------------------------------------------------------------------------

function getWeightTable(standard: GrowthStandard, gender: 'male' | 'female'): LMSRow[] {
  if (standard === 'WHO') {
    return gender === 'male' ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS
  }
  return gender === 'male' ? CDC_WEIGHT_BOYS : CDC_WEIGHT_GIRLS
}

function getHeightTable(standard: GrowthStandard, gender: 'male' | 'female'): LMSRow[] {
  if (standard === 'WHO') {
    return gender === 'male' ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS
  }
  return gender === 'male' ? CDC_HEIGHT_BOYS : CDC_HEIGHT_GIRLS
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates weight-for-age and height/length-for-age percentiles.
 *
 * @param input - Child's gender, age, weight, and height
 * @param standard - 'WHO' (international) or 'CDC' (US reference)
 * @returns { weightPercentile, heightPercentile } — each in [0.1, 99.9]
 *
 * @throws never — invalid inputs (negative weight, height out of range, etc.)
 *   return 50 (median) as a safe fallback rather than throwing.
 */
export function calculatePercentile(
  input: GrowthInput,
  standard: GrowthStandard
): GrowthPercentileResult {
  const { gender, ageMonths, weightKg, heightCm } = input

  // Guard against nonsensical inputs — return 50 as a safe fallback
  if (
    weightKg <= 0 ||
    heightCm <= 0 ||
    ageMonths < 0 ||
    ageMonths > 60
  ) {
    return { weightPercentile: 50, heightPercentile: 50 }
  }

  const weightTable = getWeightTable(standard, gender)
  const heightTable = getHeightTable(standard, gender)

  const weightLMS = getLMSForAge(ageMonths, weightTable)
  const heightLMS = getLMSForAge(ageMonths, heightTable)

  const weightZ = lmsToZScore(weightKg, weightLMS)
  const heightZ = lmsToZScore(heightCm, heightLMS)

  return {
    weightPercentile: zToPercentile(weightZ),
    heightPercentile: zToPercentile(heightZ),
  }
}
