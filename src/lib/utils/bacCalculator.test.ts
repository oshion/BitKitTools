import { calculateBac, lbsToKg, kgToLbs } from './bacCalculator'

describe('calculateBac', () => {
  // ── Zero / edge cases ───────────────────────────────────────────────────────

  it('returns 0 when no drinks are provided', () => {
    const result = calculateBac({
      gender: 'male',
      weightKg: 80,
      drinks: [],
      hoursElapsed: 0,
    })
    expect(result.bacPercent).toBe(0)
    expect(result.isEstimateOnly).toBe(true)
  })

  it('always includes isEstimateOnly: true in the result', () => {
    const result = calculateBac({
      gender: 'male',
      weightKg: 80,
      drinks: [{ abvPercent: 5, volumeMl: 355 }],
      hoursElapsed: 0,
    })
    // The literal type guard — this value must always be true
    expect(result.isEstimateOnly).toBe(true)
  })

  it('returns 0 when weight is 0 (guard against division by zero)', () => {
    const result = calculateBac({
      gender: 'male',
      weightKg: 0,
      drinks: [{ abvPercent: 5, volumeMl: 355 }],
      hoursElapsed: 0,
    })
    expect(result.bacPercent).toBe(0)
  })

  // ── Single standard drink ───────────────────────────────────────────────────

  it('calculates BAC for a 80 kg male after one regular beer (355 mL @ 5%) at t=0', () => {
    // A = 355 * 0.05 * 0.789 = 14.0 g
    // BAC = (14.0 * 100) / (80000 * 0.68) = 1400 / 54400 ≈ 0.026%
    const result = calculateBac({
      gender: 'male',
      weightKg: 80,
      drinks: [{ abvPercent: 5, volumeMl: 355 }],
      hoursElapsed: 0,
    })
    expect(result.bacPercent).toBeCloseTo(0.026, 2)
  })

  it('calculates BAC for a 60 kg female after one glass of wine (150 mL @ 12%) at t=0', () => {
    // A = 150 * 0.12 * 0.789 = 14.2 g
    // BAC = (14.2 * 100) / (60000 * 0.55) = 1420 / 33000 ≈ 0.043%
    const result = calculateBac({
      gender: 'female',
      weightKg: 60,
      drinks: [{ abvPercent: 12, volumeMl: 150 }],
      hoursElapsed: 0,
    })
    expect(result.bacPercent).toBeCloseTo(0.043, 2)
  })

  // ── Elimination over time ───────────────────────────────────────────────────

  it('reduces BAC by elimination rate over time', () => {
    const atT0 = calculateBac({
      gender: 'male',
      weightKg: 80,
      drinks: [{ abvPercent: 5, volumeMl: 355 }],
      hoursElapsed: 0,
    })
    const atT1 = calculateBac({
      gender: 'male',
      weightKg: 80,
      drinks: [{ abvPercent: 5, volumeMl: 355 }],
      hoursElapsed: 1,
    })
    // After 1 hour, BAC drops by ≈ 0.015
    expect(atT0.bacPercent - atT1.bacPercent).toBeCloseTo(0.015, 3)
  })

  it('clamps BAC to 0 when elapsed time exceeds metabolism window', () => {
    // One beer metabolized entirely after ≈ 2 hours
    const result = calculateBac({
      gender: 'male',
      weightKg: 80,
      drinks: [{ abvPercent: 5, volumeMl: 355 }],
      hoursElapsed: 10,
    })
    expect(result.bacPercent).toBe(0)
  })

  it('never returns a negative BAC', () => {
    const result = calculateBac({
      gender: 'female',
      weightKg: 55,
      drinks: [{ abvPercent: 4, volumeMl: 250 }],
      hoursElapsed: 24,
    })
    expect(result.bacPercent).toBeGreaterThanOrEqual(0)
  })

  // ── Gender difference ───────────────────────────────────────────────────────

  it('produces higher BAC for female than male at same weight/drinks (lower r factor)', () => {
    const male = calculateBac({
      gender: 'male',
      weightKg: 70,
      drinks: [{ abvPercent: 5, volumeMl: 500 }],
      hoursElapsed: 0,
    })
    const female = calculateBac({
      gender: 'female',
      weightKg: 70,
      drinks: [{ abvPercent: 5, volumeMl: 500 }],
      hoursElapsed: 0,
    })
    expect(female.bacPercent).toBeGreaterThan(male.bacPercent)
  })

  // ── Multiple drinks ─────────────────────────────────────────────────────────

  it('sums alcohol from multiple drinks correctly', () => {
    const combined = calculateBac({
      gender: 'male',
      weightKg: 80,
      drinks: [
        { abvPercent: 5, volumeMl: 355 },
        { abvPercent: 5, volumeMl: 355 },
      ],
      hoursElapsed: 0,
    })
    const single = calculateBac({
      gender: 'male',
      weightKg: 80,
      drinks: [{ abvPercent: 5, volumeMl: 710 }],
      hoursElapsed: 0,
    })
    expect(combined.bacPercent).toBe(single.bacPercent)
  })

  it('handles a heavy drinking scenario with multiple drink types', () => {
    // 3 beers + 1 shot of spirits for a 70 kg male at t=1
    const result = calculateBac({
      gender: 'male',
      weightKg: 70,
      drinks: [
        { abvPercent: 5, volumeMl: 355 },
        { abvPercent: 5, volumeMl: 355 },
        { abvPercent: 5, volumeMl: 355 },
        { abvPercent: 40, volumeMl: 44 }, // 1.5 oz shot
      ],
      hoursElapsed: 1,
    })
    expect(result.bacPercent).toBeGreaterThan(0.05)
    expect(result.isEstimateOnly).toBe(true)
  })

  // ── Weight sensitivity ──────────────────────────────────────────────────────

  it('produces lower BAC for heavier person with same drinks', () => {
    const light = calculateBac({
      gender: 'male',
      weightKg: 60,
      drinks: [{ abvPercent: 5, volumeMl: 500 }],
      hoursElapsed: 0,
    })
    const heavy = calculateBac({
      gender: 'male',
      weightKg: 100,
      drinks: [{ abvPercent: 5, volumeMl: 500 }],
      hoursElapsed: 0,
    })
    expect(light.bacPercent).toBeGreaterThan(heavy.bacPercent)
  })

  // ── Rounding ────────────────────────────────────────────────────────────────

  it('rounds to 3 decimal places', () => {
    const result = calculateBac({
      gender: 'male',
      weightKg: 75,
      drinks: [{ abvPercent: 5, volumeMl: 330 }],
      hoursElapsed: 0,
    })
    const str = result.bacPercent.toString()
    const decimals = str.includes('.') ? str.split('.')[1]?.length ?? 0 : 0
    expect(decimals).toBeLessThanOrEqual(3)
  })
})

// ── Unit conversion helpers ─────────────────────────────────────────────────

describe('lbsToKg', () => {
  it('converts 160 lbs to approximately 72.6 kg', () => {
    expect(lbsToKg(160)).toBeCloseTo(72.6, 0)
  })

  it('converts 0 lbs to 0 kg', () => {
    expect(lbsToKg(0)).toBe(0)
  })
})

describe('kgToLbs', () => {
  it('converts 80 kg to approximately 176.4 lbs', () => {
    expect(kgToLbs(80)).toBeCloseTo(176.4, 0)
  })

  it('is approximately the inverse of lbsToKg', () => {
    const originalLbs = 154
    const convertedKg = lbsToKg(originalLbs)
    const backToLbs = kgToLbs(convertedKg)
    expect(backToLbs).toBeCloseTo(originalLbs, 0)
  })
})
