import { calculateAbv, calculateDilution } from './homebrewCalculator'

// ── calculateAbv ─────────────────────────────────────────────────────────────

describe('calculateAbv', () => {
  // ── Standard cases ──────────────────────────────────────────────────────────

  it('calculates ABV for a standard session beer (OG 1.050, FG 1.010)', () => {
    // (1.050 - 1.010) * 131.25 = 0.040 * 131.25 = 5.25%
    expect(calculateAbv(1.05, 1.01)).toBe(5.25)
  })

  it('calculates ABV for a light lager (OG 1.040, FG 1.008)', () => {
    // (1.040 - 1.008) * 131.25 = 0.032 * 131.25 = 4.2%
    expect(calculateAbv(1.04, 1.008)).toBeCloseTo(4.2, 1)
  })

  it('calculates ABV for a strong ale (OG 1.080, FG 1.015)', () => {
    // (1.080 - 1.015) * 131.25 = 0.065 * 131.25 = 8.53%
    expect(calculateAbv(1.08, 1.015)).toBeCloseTo(8.53, 1)
  })

  it('calculates ABV for a barleywine (OG 1.110, FG 1.020)', () => {
    // (1.110 - 1.020) * 131.25 = 0.090 * 131.25 = 11.81%
    expect(calculateAbv(1.11, 1.02)).toBeCloseTo(11.81, 1)
  })

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('returns 0 when OG equals FG (no fermentation)', () => {
    expect(calculateAbv(1.05, 1.05)).toBe(0)
  })

  it('returns 0 when FG is greater than OG (invalid input)', () => {
    expect(calculateAbv(1.04, 1.05)).toBe(0)
  })

  it('returns 0 for both OG and FG at 1.000 (water)', () => {
    expect(calculateAbv(1.0, 1.0)).toBe(0)
  })

  // ── Rounding ────────────────────────────────────────────────────────────────

  it('rounds result to 2 decimal places', () => {
    const result = calculateAbv(1.048, 1.012)
    const str = result.toString()
    const decimals = str.includes('.') ? str.split('.')[1]?.length ?? 0 : 0
    expect(decimals).toBeLessThanOrEqual(2)
  })

  it('result is always non-negative', () => {
    expect(calculateAbv(1.05, 1.01)).toBeGreaterThanOrEqual(0)
    expect(calculateAbv(1.01, 1.05)).toBeGreaterThanOrEqual(0)
  })

  // ── Proportionality ─────────────────────────────────────────────────────────

  it('doubling the gravity difference doubles the ABV', () => {
    const abv1 = calculateAbv(1.05, 1.01)  // diff = 0.040
    const abv2 = calculateAbv(1.09, 1.01)  // diff = 0.080
    expect(abv2 / abv1).toBeCloseTo(2, 1)
  })
})

// ── calculateDilution ────────────────────────────────────────────────────────

describe('calculateDilution', () => {
  // ── Standard cases ──────────────────────────────────────────────────────────

  it('calculates water to add for simple 5% to 4% dilution in 20 L batch', () => {
    // finalVolume = (5 / 4) * 20 = 25 L
    // waterToAdd = 25 - 20 = 5 L
    const result = calculateDilution(5, 20, 4)
    expect(result.finalVolumeL).toBe(25)
    expect(result.waterToAddL).toBe(5)
  })

  it('calculates dilution from 8% ABV to 5% in a 10 L batch', () => {
    // finalVolume = (8 / 5) * 10 = 16 L
    // waterToAdd = 16 - 10 = 6 L
    const result = calculateDilution(8, 10, 5)
    expect(result.finalVolumeL).toBe(16)
    expect(result.waterToAddL).toBe(6)
  })

  it('returns correct values for a 6.5% to 4.5% dilution in 19 L', () => {
    // finalVolume = (6.5 / 4.5) * 19 ≈ 27.44 L
    // waterToAdd ≈ 8.44 L
    const result = calculateDilution(6.5, 19, 4.5)
    expect(result.waterToAddL).toBeCloseTo(8.44, 1)
    expect(result.finalVolumeL).toBeCloseTo(27.44, 1)
  })

  // ── Edge cases — no dilution needed ─────────────────────────────────────────

  it('returns zero water when target ABV equals current ABV', () => {
    const result = calculateDilution(5, 20, 5)
    expect(result.waterToAddL).toBe(0)
    expect(result.finalVolumeL).toBe(20)
  })

  it('returns zero water when target ABV is higher than current (cannot concentrate by dilution)', () => {
    const result = calculateDilution(4, 20, 5)
    expect(result.waterToAddL).toBe(0)
    expect(result.finalVolumeL).toBe(20)
  })

  it('returns zero water when current ABV is 0', () => {
    const result = calculateDilution(0, 20, 4)
    expect(result.waterToAddL).toBe(0)
    expect(result.finalVolumeL).toBe(20)
  })

  it('returns zero water when current volume is 0', () => {
    const result = calculateDilution(5, 0, 4)
    expect(result.waterToAddL).toBe(0)
    expect(result.finalVolumeL).toBe(0)
  })

  it('returns zero water when target ABV is 0 (invalid)', () => {
    const result = calculateDilution(5, 20, 0)
    expect(result.waterToAddL).toBe(0)
    expect(result.finalVolumeL).toBe(20)
  })

  // ── Mass balance verification ────────────────────────────────────────────────

  it('satisfies the dilution equation: currentAbv × currentVol = targetAbv × finalVol', () => {
    const currentAbv = 7.5
    const currentVol = 23
    const targetAbv = 5
    const result = calculateDilution(currentAbv, currentVol, targetAbv)

    const lhsAlcohol = currentAbv * currentVol
    const rhsAlcohol = targetAbv * result.finalVolumeL
    expect(lhsAlcohol).toBeCloseTo(rhsAlcohol, 1)
  })

  // ── Rounding ────────────────────────────────────────────────────────────────

  it('rounds results to 2 decimal places', () => {
    const result = calculateDilution(6, 19, 4.3)
    const wStr = result.waterToAddL.toString()
    const fStr = result.finalVolumeL.toString()
    const wDec = wStr.includes('.') ? wStr.split('.')[1]?.length ?? 0 : 0
    const fDec = fStr.includes('.') ? fStr.split('.')[1]?.length ?? 0 : 0
    expect(wDec).toBeLessThanOrEqual(2)
    expect(fDec).toBeLessThanOrEqual(2)
  })

  // ── Water to add is always non-negative ─────────────────────────────────────

  it('waterToAddL is always non-negative', () => {
    expect(calculateDilution(5, 20, 4).waterToAddL).toBeGreaterThanOrEqual(0)
    expect(calculateDilution(5, 20, 6).waterToAddL).toBeGreaterThanOrEqual(0)
    expect(calculateDilution(5, 20, 5).waterToAddL).toBeGreaterThanOrEqual(0)
  })
})
