import {
  fahrenheitFromCelsius,
  celsiusFromFahrenheit,
  correctGravity,
} from './hydrometerCorrection'

// ── fahrenheitFromCelsius ─────────────────────────────────────────────────────

describe('fahrenheitFromCelsius', () => {
  it('converts 0°C to 32°F (freezing point)', () => {
    expect(fahrenheitFromCelsius(0)).toBe(32)
  })

  it('converts 100°C to 212°F (boiling point)', () => {
    expect(fahrenheitFromCelsius(100)).toBe(212)
  })

  it('converts 15°C to 59°F (hydrometer 59°F preset)', () => {
    expect(fahrenheitFromCelsius(15)).toBe(59)
  })

  it('converts 20°C to 68°F (hydrometer 68°F preset)', () => {
    expect(fahrenheitFromCelsius(20)).toBe(68)
  })
})

// ── celsiusFromFahrenheit ─────────────────────────────────────────────────────

describe('celsiusFromFahrenheit', () => {
  it('converts 32°F to 0°C (freezing point)', () => {
    expect(celsiusFromFahrenheit(32)).toBe(0)
  })

  it('converts 212°F to 100°C (boiling point)', () => {
    expect(celsiusFromFahrenheit(212)).toBe(100)
  })

  it('converts 59°F to 15°C (hydrometer 59°F preset)', () => {
    expect(celsiusFromFahrenheit(59)).toBe(15)
  })

  it('converts 68°F to 20°C (hydrometer 68°F preset)', () => {
    expect(celsiusFromFahrenheit(68)).toBe(20)
  })
})

// ── Celsius ↔ Fahrenheit round-trip ─────────────────────────────────────────

describe('temperature conversion round-trip accuracy', () => {
  it('celsius → fahrenheit → celsius returns original value (20°C)', () => {
    const result = celsiusFromFahrenheit(fahrenheitFromCelsius(20))
    expect(result).toBeCloseTo(20, 10)
  })

  it('celsius → fahrenheit → celsius returns original value (37.5°C)', () => {
    const result = celsiusFromFahrenheit(fahrenheitFromCelsius(37.5))
    expect(result).toBeCloseTo(37.5, 10)
  })

  it('fahrenheit → celsius → fahrenheit returns original value (75°F)', () => {
    const result = fahrenheitFromCelsius(celsiusFromFahrenheit(75))
    expect(result).toBeCloseTo(75, 10)
  })
})

// ── correctGravity ────────────────────────────────────────────────────────────

describe('correctGravity — no correction when sample temp equals calibration temp', () => {
  it('returns delta ≈ 0 when sampleTempF === calibrationTempF (59°F preset)', () => {
    const { deltaFromMeasured } = correctGravity({
      measuredGravity: 1.05,
      sampleTempF: 59,
      calibrationTempF: 59,
    })
    expect(Math.abs(deltaFromMeasured)).toBeLessThan(0.0001)
  })

  it('returns correctedGravity ≈ measuredGravity when temps are equal (68°F preset)', () => {
    const { correctedGravity } = correctGravity({
      measuredGravity: 1.052,
      sampleTempF: 68,
      calibrationTempF: 68,
    })
    expect(correctedGravity).toBeCloseTo(1.052, 4)
  })

  it('returns delta ≈ 0 for any gravity when temps are equal (60°F)', () => {
    const { deltaFromMeasured } = correctGravity({
      measuredGravity: 1.080,
      sampleTempF: 60,
      calibrationTempF: 60,
    })
    expect(Math.abs(deltaFromMeasured)).toBeLessThan(0.0001)
  })
})

describe('correctGravity — sample temp above calibration temp', () => {
  it('returns correctedGravity > measuredGravity when sampleTemp > calibrationTemp', () => {
    const { correctedGravity } = correctGravity({
      measuredGravity: 1.052,
      sampleTempF: 75,
      calibrationTempF: 60,
    })
    expect(correctedGravity).toBeGreaterThan(1.052)
  })

  it('returns positive deltaFromMeasured when sampleTemp > calibrationTemp', () => {
    const { deltaFromMeasured } = correctGravity({
      measuredGravity: 1.052,
      sampleTempF: 75,
      calibrationTempF: 60,
    })
    expect(deltaFromMeasured).toBeGreaterThan(0)
  })

  // Specific known value: MG=1.052, ST=75°F, CT=60°F → CG≈1.0537
  // Derived from the correction polynomial published in brewing references
  it('matches expected corrected gravity for screen-doc example (1.052 at 75°F, calibrated at 60°F)', () => {
    const { correctedGravity, deltaFromMeasured } = correctGravity({
      measuredGravity: 1.052,
      sampleTempF: 75,
      calibrationTempF: 60,
    })
    expect(correctedGravity).toBe(1.0537)
    expect(deltaFromMeasured).toBeCloseTo(0.0017, 3)
  })
})

describe('correctGravity — sample temp below calibration temp', () => {
  it('returns correctedGravity < measuredGravity when sampleTemp < calibrationTemp', () => {
    const { correctedGravity } = correctGravity({
      measuredGravity: 1.060,
      sampleTempF: 50,
      calibrationTempF: 60,
    })
    expect(correctedGravity).toBeLessThan(1.060)
  })

  it('returns negative deltaFromMeasured when sampleTemp < calibrationTemp', () => {
    const { deltaFromMeasured } = correctGravity({
      measuredGravity: 1.060,
      sampleTempF: 50,
      calibrationTempF: 60,
    })
    expect(deltaFromMeasured).toBeLessThan(0)
  })
})

describe('correctGravity — rounding and precision', () => {
  it('rounds correctedGravity to 4 decimal places', () => {
    const { correctedGravity } = correctGravity({
      measuredGravity: 1.052,
      sampleTempF: 73,
      calibrationTempF: 60,
    })
    const str = correctedGravity.toString()
    const decimals = str.includes('.') ? str.split('.')[1]?.length ?? 0 : 0
    expect(decimals).toBeLessThanOrEqual(4)
  })

  it('rounds deltaFromMeasured to 4 decimal places', () => {
    const { deltaFromMeasured } = correctGravity({
      measuredGravity: 1.048,
      sampleTempF: 80,
      calibrationTempF: 68,
    })
    const str = deltaFromMeasured.toString()
    const decimals = str.includes('.') ? str.split('.')[1]?.length ?? 0 : 0
    expect(decimals).toBeLessThanOrEqual(4)
  })
})

describe('correctGravity — 59°F and 68°F calibration presets', () => {
  it('produces larger correction when sample is far above the 59°F preset calibration', () => {
    const { deltaFromMeasured: delta59 } = correctGravity({
      measuredGravity: 1.052,
      sampleTempF: 80,
      calibrationTempF: 59,
    })
    const { deltaFromMeasured: delta68 } = correctGravity({
      measuredGravity: 1.052,
      sampleTempF: 80,
      calibrationTempF: 68,
    })
    // When calibration is lower (59°F), the gap from sample to calibration is
    // larger (80-59 > 80-68), so the correction should be larger
    expect(delta59).toBeGreaterThan(delta68)
  })

  it('returns positive correction for typical warm measurement with 59°F calibration', () => {
    const { deltaFromMeasured } = correctGravity({
      measuredGravity: 1.050,
      sampleTempF: 70,
      calibrationTempF: 59,
    })
    expect(deltaFromMeasured).toBeGreaterThan(0)
  })

  it('returns positive correction for typical warm measurement with 68°F calibration', () => {
    const { deltaFromMeasured } = correctGravity({
      measuredGravity: 1.050,
      sampleTempF: 77,
      calibrationTempF: 68,
    })
    expect(deltaFromMeasured).toBeGreaterThan(0)
  })
})

describe('correctGravity — celsius input path (via conversion)', () => {
  it('produces same result whether temperature is supplied in °F or converted from °C', () => {
    // 25°C = 77°F, 15°C = 59°F
    const resultF = correctGravity({
      measuredGravity: 1.048,
      sampleTempF: 77,
      calibrationTempF: 59,
    })
    const resultC = correctGravity({
      measuredGravity: 1.048,
      sampleTempF: fahrenheitFromCelsius(25),
      calibrationTempF: fahrenheitFromCelsius(15),
    })
    expect(resultF.correctedGravity).toBe(resultC.correctedGravity)
    expect(resultF.deltaFromMeasured).toBe(resultC.deltaFromMeasured)
  })
})
