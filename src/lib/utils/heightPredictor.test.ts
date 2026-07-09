import {
  calculateMidParentalHeight,
  cmToFeetInches,
  feetInchesToCm,
} from './heightPredictor'

// ── calculateMidParentalHeight ────────────────────────────────────────────────

describe('calculateMidParentalHeight', () => {
  // Male cases
  test('male: average heights → correct predicted height', () => {
    const result = calculateMidParentalHeight({
      sex: 'male',
      motherHeightCm: 165,
      fatherHeightCm: 180,
    })
    // (165 + 180 + 13) / 2 = 179
    expect(result.predictedHeightCm).toBe(179)
  })

  test('male: range is ±8.5cm from predicted', () => {
    const result = calculateMidParentalHeight({
      sex: 'male',
      motherHeightCm: 165,
      fatherHeightCm: 180,
    })
    expect(result.rangeLowCm).toBe(179 - 8.5)
    expect(result.rangeHighCm).toBe(179 + 8.5)
  })

  test('male: equal parent heights → symmetric midpoint', () => {
    const result = calculateMidParentalHeight({
      sex: 'male',
      motherHeightCm: 160,
      fatherHeightCm: 160,
    })
    // (160 + 160 + 13) / 2 = 166.5
    expect(result.predictedHeightCm).toBe(166.5)
    expect(result.rangeLowCm).toBe(166.5 - 8.5)
    expect(result.rangeHighCm).toBe(166.5 + 8.5)
  })

  test('male: very tall parents', () => {
    const result = calculateMidParentalHeight({
      sex: 'male',
      motherHeightCm: 185,
      fatherHeightCm: 200,
    })
    // (185 + 200 + 13) / 2 = 199
    expect(result.predictedHeightCm).toBe(199)
  })

  test('male: short parents', () => {
    const result = calculateMidParentalHeight({
      sex: 'male',
      motherHeightCm: 140,
      fatherHeightCm: 150,
    })
    // (140 + 150 + 13) / 2 = 151.5
    expect(result.predictedHeightCm).toBe(151.5)
  })

  // Female cases
  test('female: average heights → correct predicted height', () => {
    const result = calculateMidParentalHeight({
      sex: 'female',
      motherHeightCm: 165,
      fatherHeightCm: 180,
    })
    // (165 + 180 - 13) / 2 = 166
    expect(result.predictedHeightCm).toBe(166)
  })

  test('female: range is ±8.5cm from predicted', () => {
    const result = calculateMidParentalHeight({
      sex: 'female',
      motherHeightCm: 165,
      fatherHeightCm: 180,
    })
    expect(result.rangeLowCm).toBe(166 - 8.5)
    expect(result.rangeHighCm).toBe(166 + 8.5)
  })

  test('female: equal parent heights → symmetric midpoint', () => {
    const result = calculateMidParentalHeight({
      sex: 'female',
      motherHeightCm: 160,
      fatherHeightCm: 160,
    })
    // (160 + 160 - 13) / 2 = 153.5
    expect(result.predictedHeightCm).toBe(153.5)
  })

  test('female: very tall parents', () => {
    const result = calculateMidParentalHeight({
      sex: 'female',
      motherHeightCm: 185,
      fatherHeightCm: 200,
    })
    // (185 + 200 - 13) / 2 = 186
    expect(result.predictedHeightCm).toBe(186)
  })

  test('female: short parents', () => {
    const result = calculateMidParentalHeight({
      sex: 'female',
      motherHeightCm: 140,
      fatherHeightCm: 150,
    })
    // (140 + 150 - 13) / 2 = 138.5
    expect(result.predictedHeightCm).toBe(138.5)
  })

  test('result always has low < predicted < high', () => {
    const cases: Array<{ sex: 'male' | 'female'; motherHeightCm: number; fatherHeightCm: number }> = [
      { sex: 'male', motherHeightCm: 155, fatherHeightCm: 170 },
      { sex: 'female', motherHeightCm: 155, fatherHeightCm: 170 },
      { sex: 'male', motherHeightCm: 200, fatherHeightCm: 210 },
    ]
    for (const input of cases) {
      const r = calculateMidParentalHeight(input)
      expect(r.rangeLowCm).toBeLessThan(r.predictedHeightCm)
      expect(r.rangeHighCm).toBeGreaterThan(r.predictedHeightCm)
    }
  })
})

// ── Unit conversion ───────────────────────────────────────────────────────────

describe('cmToFeetInches', () => {
  test('175cm → 5 feet 9 inches (approx)', () => {
    const { feet, inches } = cmToFeetInches(175)
    expect(feet).toBe(5)
    expect(inches).toBe(9) // 175/2.54 ≈ 68.9 → 5'8.9" → rounds to 9"
  })

  test('180cm → 5 feet 11 inches (approx)', () => {
    const { feet, inches } = cmToFeetInches(180)
    // 180/2.54 ≈ 70.87 → 5'10.87" → 5ft 11in
    expect(feet).toBe(5)
    expect(inches).toBe(11)
  })

  test('152.4cm → exactly 5 feet 0 inches', () => {
    const { feet, inches } = cmToFeetInches(152.4)
    expect(feet).toBe(5)
    expect(inches).toBe(0)
  })

  test('60.96cm → exactly 2 feet 0 inches', () => {
    const { feet, inches } = cmToFeetInches(60.96)
    expect(feet).toBe(2)
    expect(inches).toBe(0)
  })

  test('handles edge case where inches rounds to 12 (carries into next foot)', () => {
    // 182.88cm = exactly 6'0"
    const { feet, inches } = cmToFeetInches(182.88)
    expect(feet).toBe(6)
    expect(inches).toBe(0)
  })
})

describe('feetInchesToCm', () => {
  test('5ft 0in → 152.4cm', () => {
    expect(feetInchesToCm(5, 0)).toBeCloseTo(152.4, 1)
  })

  test('6ft 0in → 182.88cm', () => {
    expect(feetInchesToCm(6, 0)).toBeCloseTo(182.88, 1)
  })

  test('5ft 6in → 167.64cm', () => {
    expect(feetInchesToCm(5, 6)).toBeCloseTo(167.64, 1)
  })
})

describe('round-trip conversion (cm → ft/in → cm)', () => {
  test('175cm round-trips within 1.5cm', () => {
    const { feet, inches } = cmToFeetInches(175)
    const backCm = feetInchesToCm(feet, inches)
    expect(Math.abs(backCm - 175)).toBeLessThan(1.5)
  })

  test('160cm round-trips within 1.5cm', () => {
    const { feet, inches } = cmToFeetInches(160)
    const backCm = feetInchesToCm(feet, inches)
    expect(Math.abs(backCm - 160)).toBeLessThan(1.5)
  })

  test('190cm round-trips within 1.5cm', () => {
    const { feet, inches } = cmToFeetInches(190)
    const backCm = feetInchesToCm(feet, inches)
    expect(Math.abs(backCm - 190)).toBeLessThan(1.5)
  })
})
