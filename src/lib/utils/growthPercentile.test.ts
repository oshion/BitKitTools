import { calculatePercentile } from './growthPercentile'
import {
  WHO_WEIGHT_BOYS,
  WHO_WEIGHT_GIRLS,
  WHO_HEIGHT_BOYS,
  WHO_HEIGHT_GIRLS,
} from '@/lib/config/growthStandards'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * For LMS method: when input x = M (median), z = ((M/M)^L - 1) / (L*S) = 0
 * So percentile should be exactly 50.
 */

// ---------------------------------------------------------------------------
// calculatePercentile — WHO standard, boys
// ---------------------------------------------------------------------------

describe('calculatePercentile — WHO boys', () => {
  it('returns 50th percentile for weight at the exact WHO median (newborn)', () => {
    const medianWeight = WHO_WEIGHT_BOYS[0].M  // 3.3464 kg at age 0
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 0, weightKg: medianWeight, heightCm: 50 },
      'WHO'
    )
    expect(result.weightPercentile).toBeCloseTo(50, 0)
  })

  it('returns 50th percentile for weight at 12-month WHO median', () => {
    // WHO boys 12m median: 9.6479 kg
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 12, weightKg: 9.6479, heightCm: 76 },
      'WHO'
    )
    expect(result.weightPercentile).toBeCloseTo(50, 0)
  })

  it('returns 50th percentile for height at the exact WHO median (newborn)', () => {
    const medianHeight = WHO_HEIGHT_BOYS[0].M  // 49.8842 cm at age 0
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 0, weightKg: 3.5, heightCm: medianHeight },
      'WHO'
    )
    expect(result.heightPercentile).toBeCloseTo(50, 0)
  })

  it('returns 50th percentile for height at 24-month WHO median', () => {
    // WHO boys 24m median: 87.8161 cm
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 24, weightKg: 12, heightCm: 87.8161 },
      'WHO'
    )
    expect(result.heightPercentile).toBeCloseTo(50, 0)
  })

  it('weight above median → percentile above 50', () => {
    const median = WHO_WEIGHT_BOYS[2].M  // 6-month median: 7.934 kg
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 6, weightKg: median + 2, heightCm: 68 },
      'WHO'
    )
    expect(result.weightPercentile).toBeGreaterThan(50)
  })

  it('weight below median → percentile below 50', () => {
    const median = WHO_WEIGHT_BOYS[2].M  // 6-month median: 7.934 kg
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 6, weightKg: median - 2, heightCm: 68 },
      'WHO'
    )
    expect(result.weightPercentile).toBeLessThan(50)
  })

  it('returns a value between 0.1 and 99.9 (clamped range)', () => {
    // Extreme high weight
    const high = calculatePercentile(
      { gender: 'male', ageMonths: 12, weightKg: 25, heightCm: 76 },
      'WHO'
    )
    expect(high.weightPercentile).toBeLessThanOrEqual(99.9)

    // Extreme low weight
    const low = calculatePercentile(
      { gender: 'male', ageMonths: 12, weightKg: 4, heightCm: 76 },
      'WHO'
    )
    expect(low.weightPercentile).toBeGreaterThanOrEqual(0.1)
  })
})

// ---------------------------------------------------------------------------
// calculatePercentile — WHO standard, girls
// ---------------------------------------------------------------------------

describe('calculatePercentile — WHO girls', () => {
  it('returns 50th percentile for weight at the exact WHO median (newborn girl)', () => {
    const medianWeight = WHO_WEIGHT_GIRLS[0].M  // 3.2322 kg at age 0
    const result = calculatePercentile(
      { gender: 'female', ageMonths: 0, weightKg: medianWeight, heightCm: 49 },
      'WHO'
    )
    expect(result.weightPercentile).toBeCloseTo(50, 0)
  })

  it('returns 50th percentile for height at 12-month WHO girls median', () => {
    const medianHeight = WHO_HEIGHT_GIRLS[4].M  // 74.015 cm at 12m
    const result = calculatePercentile(
      { gender: 'female', ageMonths: 12, weightKg: 9, heightCm: medianHeight },
      'WHO'
    )
    expect(result.heightPercentile).toBeCloseTo(50, 0)
  })

  it('girls vs boys: same weight at 6 months → girls score higher (girls weigh less)', () => {
    const weight = 7.93  // close to boys median, above girls median
    const boyResult = calculatePercentile(
      { gender: 'male', ageMonths: 6, weightKg: weight, heightCm: 68 },
      'WHO'
    )
    const girlResult = calculatePercentile(
      { gender: 'female', ageMonths: 6, weightKg: weight, heightCm: 66 },
      'WHO'
    )
    expect(girlResult.weightPercentile).toBeGreaterThan(boyResult.weightPercentile)
  })
})

// ---------------------------------------------------------------------------
// calculatePercentile — CDC standard
// ---------------------------------------------------------------------------

describe('calculatePercentile — CDC standard', () => {
  it('returns approximately 50th percentile for CDC median weight at 12 months (boys)', () => {
    // CDC boys 12m median: 9.8694 kg
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 12, weightKg: 9.8694, heightCm: 76 },
      'CDC'
    )
    expect(result.weightPercentile).toBeCloseTo(50, 0)
  })

  it('CDC and WHO give similar (but not identical) results for same input', () => {
    const whoResult = calculatePercentile(
      { gender: 'male', ageMonths: 24, weightKg: 12, heightCm: 87 },
      'WHO'
    )
    const cdcResult = calculatePercentile(
      { gender: 'male', ageMonths: 24, weightKg: 12, heightCm: 87 },
      'CDC'
    )
    // Both should be in a similar range (not more than 20 percentile points apart)
    expect(Math.abs(whoResult.weightPercentile - cdcResult.weightPercentile)).toBeLessThan(20)
    // But they should not be identical
    // (CDC population is slightly heavier so 12kg at 24m scores higher on CDC)
    expect(whoResult.weightPercentile).not.toBe(cdcResult.weightPercentile)
  })
})

// ---------------------------------------------------------------------------
// calculatePercentile — interpolation between data points
// ---------------------------------------------------------------------------

describe('calculatePercentile — interpolation', () => {
  it('handles ages between tabulated data points (e.g., 7 months)', () => {
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 7, weightKg: 8.1, heightCm: 69 },
      'WHO'
    )
    expect(result.weightPercentile).toBeGreaterThan(0.1)
    expect(result.weightPercentile).toBeLessThan(99.9)
    expect(result.heightPercentile).toBeGreaterThan(0.1)
    expect(result.heightPercentile).toBeLessThan(99.9)
  })

  it('handles age 30 months (between 24m and 36m data points)', () => {
    const result = calculatePercentile(
      { gender: 'female', ageMonths: 30, weightKg: 12.5, heightCm: 90 },
      'WHO'
    )
    expect(result.weightPercentile).toBeGreaterThan(0.1)
    expect(result.weightPercentile).toBeLessThan(99.9)
  })

  it('age 0 months uses first data point without error', () => {
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 0, weightKg: 3.0, heightCm: 48 },
      'WHO'
    )
    expect(result.weightPercentile).toBeGreaterThan(0.1)
    expect(result.weightPercentile).toBeLessThan(99.9)
  })

  it('age 60 months uses last data point without error', () => {
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 60, weightKg: 18, heightCm: 110 },
      'WHO'
    )
    expect(result.weightPercentile).toBeGreaterThan(0.1)
    expect(result.weightPercentile).toBeLessThan(99.9)
  })
})

// ---------------------------------------------------------------------------
// calculatePercentile — invalid/edge inputs
// ---------------------------------------------------------------------------

describe('calculatePercentile — invalid/edge inputs', () => {
  it('returns safe fallback (50) for zero weight', () => {
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 12, weightKg: 0, heightCm: 76 },
      'WHO'
    )
    expect(result.weightPercentile).toBe(50)
  })

  it('returns safe fallback (50) for negative weight', () => {
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 12, weightKg: -1, heightCm: 76 },
      'WHO'
    )
    expect(result.weightPercentile).toBe(50)
  })

  it('returns safe fallback (50) for age > 60 months', () => {
    const result = calculatePercentile(
      { gender: 'male', ageMonths: 61, weightKg: 20, heightCm: 115 },
      'WHO'
    )
    expect(result.weightPercentile).toBe(50)
    expect(result.heightPercentile).toBe(50)
  })

  it('returns safe fallback (50) for negative age', () => {
    const result = calculatePercentile(
      { gender: 'male', ageMonths: -1, weightKg: 3, heightCm: 50 },
      'WHO'
    )
    expect(result.weightPercentile).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// Monotonicity: increasing weight → increasing percentile
// ---------------------------------------------------------------------------

describe('calculatePercentile — monotonicity', () => {
  it('weight percentile increases as weight increases (boys, 12m, WHO)', () => {
    const weights = [7, 8, 9, 10, 11, 12, 13]
    const percentiles = weights.map((w) =>
      calculatePercentile(
        { gender: 'male', ageMonths: 12, weightKg: w, heightCm: 76 },
        'WHO'
      ).weightPercentile
    )
    for (let i = 1; i < percentiles.length; i++) {
      expect(percentiles[i]).toBeGreaterThan(percentiles[i - 1])
    }
  })

  it('height percentile increases as height increases (girls, 24m, WHO)', () => {
    const heights = [80, 84, 86, 88, 90, 94]
    const percentiles = heights.map((h) =>
      calculatePercentile(
        { gender: 'female', ageMonths: 24, weightKg: 11, heightCm: h },
        'WHO'
      ).heightPercentile
    )
    for (let i = 1; i < percentiles.length; i++) {
      expect(percentiles[i]).toBeGreaterThan(percentiles[i - 1])
    }
  })
})
