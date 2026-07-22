import {
  calculateStandardDrinks,
  GRAMS_PER_STANDARD_DRINK,
  type DrinkStandard,
} from './standardDrinksCalculator'

// ── GRAMS_PER_STANDARD_DRINK constants ──────────────────────────────────────

describe('GRAMS_PER_STANDARD_DRINK', () => {
  it('US standard is 14 g', () => {
    expect(GRAMS_PER_STANDARD_DRINK['us']).toBe(14)
  })

  it('UK standard is 8 g', () => {
    expect(GRAMS_PER_STANDARD_DRINK['uk']).toBe(8)
  })

  it('AU/SG standard is 10 g', () => {
    expect(GRAMS_PER_STANDARD_DRINK['au-sg']).toBe(10)
  })

  it('Canada standard is 13.45 g', () => {
    expect(GRAMS_PER_STANDARD_DRINK['canada']).toBe(13.45)
  })
})

// ── calculateStandardDrinks — US (14 g per drink) ───────────────────────────

describe('calculateStandardDrinks — US standard (14 g)', () => {
  it('calculates pure alcohol grams correctly for a regular beer', () => {
    // 355 mL × 5% × 0.789 = 14.01 g
    const result = calculateStandardDrinks({ volumeMl: 355, abvPercent: 5, standard: 'us' })
    expect(result.pureAlcoholGrams).toBeCloseTo(14.01, 1)
  })

  it('calculates standard drinks for a regular beer (≈ 1 US drink)', () => {
    const result = calculateStandardDrinks({ volumeMl: 355, abvPercent: 5, standard: 'us' })
    expect(result.standardDrinks).toBeCloseTo(1.0, 1)
  })

  it('calculates calories for a regular beer', () => {
    // 14.01 g × 7 kcal/g ≈ 98 kcal
    const result = calculateStandardDrinks({ volumeMl: 355, abvPercent: 5, standard: 'us' })
    expect(result.caloriesKcal).toBeCloseTo(98.06, 0)
  })

  it('calculates for a glass of wine (150 mL, 12%)', () => {
    // 150 × 0.12 × 0.789 = 14.202 g → 14.202 / 14 ≈ 1.01 drinks
    const result = calculateStandardDrinks({ volumeMl: 150, abvPercent: 12, standard: 'us' })
    expect(result.pureAlcoholGrams).toBeCloseTo(14.2, 1)
    expect(result.standardDrinks).toBeCloseTo(1.01, 1)
  })

  it('calculates for a shot of spirits (44 mL, 40%)', () => {
    // 44 × 0.40 × 0.789 = 13.89 g → 13.89 / 14 ≈ 0.99 drinks
    const result = calculateStandardDrinks({ volumeMl: 44, abvPercent: 40, standard: 'us' })
    expect(result.pureAlcoholGrams).toBeCloseTo(13.89, 1)
    expect(result.standardDrinks).toBeCloseTo(0.99, 1)
  })
})

// ── calculateStandardDrinks — UK (8 g per unit) ─────────────────────────────

describe('calculateStandardDrinks — UK standard (8 g)', () => {
  it('calculates units for a pint of regular lager (568 mL, 4%)', () => {
    // 568 × 0.04 × 0.789 = 17.93 g → 17.93 / 8 ≈ 2.24 units
    const result = calculateStandardDrinks({ volumeMl: 568, abvPercent: 4, standard: 'uk' })
    expect(result.pureAlcoholGrams).toBeCloseTo(17.93, 1)
    expect(result.standardDrinks).toBeCloseTo(2.24, 1)
  })

  it('calculates units for a small glass of wine (125 mL, 13%)', () => {
    // 125 × 0.13 × 0.789 = 12.83 g → 12.83 / 8 ≈ 1.60 units
    const result = calculateStandardDrinks({ volumeMl: 125, abvPercent: 13, standard: 'uk' })
    expect(result.standardDrinks).toBeCloseTo(1.6, 1)
  })
})

// ── calculateStandardDrinks — AU/SG (10 g per drink) ───────────────────────

describe('calculateStandardDrinks — AU/SG standard (10 g)', () => {
  it('calculates for a mid-strength beer (375 mL, 3.5%)', () => {
    // 375 × 0.035 × 0.789 = 10.36 g → 10.36 / 10 ≈ 1.04 drinks
    const result = calculateStandardDrinks({ volumeMl: 375, abvPercent: 3.5, standard: 'au-sg' })
    expect(result.pureAlcoholGrams).toBeCloseTo(10.36, 1)
    expect(result.standardDrinks).toBeCloseTo(1.04, 1)
  })
})

// ── calculateStandardDrinks — Canada (13.45 g per drink) ────────────────────

describe('calculateStandardDrinks — Canada standard (13.45 g)', () => {
  it('calculates for a bottle of domestic beer (341 mL, 5%)', () => {
    // 341 × 0.05 × 0.789 = 13.46 g → 13.46 / 13.45 ≈ 1.0 drink
    const result = calculateStandardDrinks({ volumeMl: 341, abvPercent: 5, standard: 'canada' })
    expect(result.pureAlcoholGrams).toBeCloseTo(13.46, 1)
    expect(result.standardDrinks).toBeCloseTo(1.0, 1)
  })
})

// ── Boundary / edge cases ────────────────────────────────────────────────────

describe('calculateStandardDrinks — boundary cases', () => {
  it('returns 0 standard drinks for 0 mL volume', () => {
    const result = calculateStandardDrinks({ volumeMl: 0, abvPercent: 5, standard: 'us' })
    expect(result.pureAlcoholGrams).toBe(0)
    expect(result.standardDrinks).toBe(0)
    expect(result.caloriesKcal).toBe(0)
  })

  it('returns 0 standard drinks for 0% ABV', () => {
    const result = calculateStandardDrinks({ volumeMl: 355, abvPercent: 0, standard: 'us' })
    expect(result.pureAlcoholGrams).toBe(0)
    expect(result.standardDrinks).toBe(0)
    expect(result.caloriesKcal).toBe(0)
  })
})

// ── Calories calculation ──────────────────────────────────────────────────────

describe('calculateStandardDrinks — calorie calculation', () => {
  it('calories = pureAlcoholGrams × 7', () => {
    // 100 mL × 40% ABV × 0.789 = 31.56 g → 31.56 × 7 = 220.92 kcal
    const result = calculateStandardDrinks({ volumeMl: 100, abvPercent: 40, standard: 'us' })
    expect(result.pureAlcoholGrams).toBeCloseTo(31.56, 1)
    expect(result.caloriesKcal).toBeCloseTo(result.pureAlcoholGrams * 7, 1)
  })

  it('calorie values match pureAlcoholGrams × 7 across all standards', () => {
    const standards: DrinkStandard[] = ['us', 'uk', 'au-sg', 'canada']
    for (const standard of standards) {
      const result = calculateStandardDrinks({ volumeMl: 200, abvPercent: 5, standard })
      expect(result.caloriesKcal).toBeCloseTo(result.pureAlcoholGrams * 7, 1)
    }
  })
})

// ── Return value rounding ─────────────────────────────────────────────────────

describe('calculateStandardDrinks — output rounding', () => {
  it('returns values rounded to 2 decimal places', () => {
    const result = calculateStandardDrinks({ volumeMl: 355, abvPercent: 5, standard: 'us' })
    const dp = (n: number) => (n.toString().split('.')[1] ?? '').length
    expect(dp(result.pureAlcoholGrams)).toBeLessThanOrEqual(2)
    expect(dp(result.standardDrinks)).toBeLessThanOrEqual(2)
    expect(dp(result.caloriesKcal)).toBeLessThanOrEqual(2)
  })
})
