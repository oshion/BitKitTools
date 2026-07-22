import { evaluateLayoverTime } from './layoverCalculator'
import { DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE } from '@/lib/config/airportMctData'

// ─────────────────────────────────────────────────────────────────────────────
// Known airport — ICN (international-international: 90 min)
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateLayoverTime — known airport (ICN)', () => {
  test('comfortable: available ≥ 1.5× MCT', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ICN',
      connectionType: 'international-international',
      availableMinutes: 135, // 90 * 1.5 = 135 → exactly comfortable boundary
    })
    expect(result.mctMinutes).toBe(90)
    expect(result.verdict).toBe('comfortable')
    expect(result.isKnownAirport).toBe(true)
  })

  test('tight: available >= MCT but < 1.5× MCT', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ICN',
      connectionType: 'international-international',
      availableMinutes: 100,
    })
    expect(result.mctMinutes).toBe(90)
    expect(result.verdict).toBe('tight')
    expect(result.isKnownAirport).toBe(true)
  })

  test('below-mct: available < MCT', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ICN',
      connectionType: 'international-international',
      availableMinutes: 60,
    })
    expect(result.mctMinutes).toBe(90)
    expect(result.verdict).toBe('below-mct')
    expect(result.isKnownAirport).toBe(true)
  })

  test('exactly at MCT boundary → tight (not comfortable)', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ICN',
      connectionType: 'international-international',
      availableMinutes: 90,
    })
    expect(result.mctMinutes).toBe(90)
    expect(result.verdict).toBe('tight')
  })

  test('domestic-domestic connection (45 min)', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ICN',
      connectionType: 'domestic-domestic',
      availableMinutes: 68, // 45 * 1.5 = 67.5 → comfortable at 68
    })
    expect(result.mctMinutes).toBe(45)
    expect(result.verdict).toBe('comfortable')
    expect(result.isKnownAirport).toBe(true)
  })

  test('domestic-international connection (90 min)', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ICN',
      connectionType: 'domestic-international',
      availableMinutes: 70,
    })
    expect(result.mctMinutes).toBe(90)
    expect(result.verdict).toBe('below-mct')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Known airport — AMS (all connection types: 40 min)
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateLayoverTime — known airport (AMS)', () => {
  test('international-international: 40 min MCT, comfortable at 60', () => {
    const result = evaluateLayoverTime({
      airportCode: 'AMS',
      connectionType: 'international-international',
      availableMinutes: 60, // 40 * 1.5 = 60 → exactly comfortable boundary
    })
    expect(result.mctMinutes).toBe(40)
    expect(result.verdict).toBe('comfortable')
    expect(result.isKnownAirport).toBe(true)
  })

  test('below-mct at 30 min', () => {
    const result = evaluateLayoverTime({
      airportCode: 'AMS',
      connectionType: 'domestic-domestic',
      availableMinutes: 30,
    })
    expect(result.mctMinutes).toBe(40)
    expect(result.verdict).toBe('below-mct')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Known airport — ATL (I-I: 120 min — highest in dataset)
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateLayoverTime — known airport (ATL)', () => {
  test('international-international: 120 min MCT', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ATL',
      connectionType: 'international-international',
      availableMinutes: 120,
    })
    expect(result.mctMinutes).toBe(120)
    expect(result.verdict).toBe('tight')
    expect(result.isKnownAirport).toBe(true)
  })

  test('comfortable at 180 min (1.5× 120)', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ATL',
      connectionType: 'international-international',
      availableMinutes: 180,
    })
    expect(result.mctMinutes).toBe(120)
    expect(result.verdict).toBe('comfortable')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Known airport — SIN (only I-I defined, D-D not applicable)
// Falls back to default for domestic connection types
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateLayoverTime — known airport with partial data (SIN)', () => {
  test('international-international uses airport-specific value (90)', () => {
    const result = evaluateLayoverTime({
      airportCode: 'SIN',
      connectionType: 'international-international',
      availableMinutes: 90,
    })
    expect(result.mctMinutes).toBe(90)
    expect(result.verdict).toBe('tight')
    expect(result.isKnownAirport).toBe(true)
  })

  test('domestic-domestic not defined → falls back to default (45), still known airport', () => {
    const result = evaluateLayoverTime({
      airportCode: 'SIN',
      connectionType: 'domestic-domestic',
      availableMinutes: 45,
    })
    // SIN is a known airport but this connection type is not defined
    // falls back to default MCT for this connection type
    expect(result.mctMinutes).toBe(DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE['domestic-domestic'])
    expect(result.isKnownAirport).toBe(true) // airport is known, just this connection type isn't
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Unknown airport — falls back to defaults
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateLayoverTime — unknown airport', () => {
  test('unknown airport code → isKnownAirport false, uses default MCT', () => {
    const result = evaluateLayoverTime({
      airportCode: 'XYZ',
      connectionType: 'international-international',
      availableMinutes: 90,
    })
    expect(result.mctMinutes).toBe(DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE['international-international'])
    expect(result.isKnownAirport).toBe(false)
    expect(result.verdict).toBe('tight')
  })

  test('unknown airport, domestic-domestic: uses default 45 min', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ZZZ',
      connectionType: 'domestic-domestic',
      availableMinutes: 50,
    })
    expect(result.mctMinutes).toBe(45)
    expect(result.isKnownAirport).toBe(false)
    expect(result.verdict).toBe('tight')
  })

  test('unknown airport, domestic-international: uses default 60 min, comfortable at 90', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ZZZ',
      connectionType: 'domestic-international',
      availableMinutes: 90, // 60 * 1.5 = 90 → comfortable
    })
    expect(result.mctMinutes).toBe(60)
    expect(result.isKnownAirport).toBe(false)
    expect(result.verdict).toBe('comfortable')
  })

  test('unknown airport, international-domestic: uses default 90 min', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ZZZ',
      connectionType: 'international-domestic',
      availableMinutes: 80,
    })
    expect(result.mctMinutes).toBe(90)
    expect(result.isKnownAirport).toBe(false)
    expect(result.verdict).toBe('below-mct')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Verdict boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('verdict boundary conditions', () => {
  // MCT = 90 (default I-I for unknown airport)
  // comfortable: availableMinutes >= 90 * 1.5 = 135
  // tight:       90 <= availableMinutes < 135
  // below-mct:  availableMinutes < 90

  test('exactly at 1.5× MCT → comfortable', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ZZZ',
      connectionType: 'international-international',
      availableMinutes: 135,
    })
    expect(result.verdict).toBe('comfortable')
  })

  test('one minute above MCT → tight', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ZZZ',
      connectionType: 'international-international',
      availableMinutes: 91,
    })
    expect(result.verdict).toBe('tight')
  })

  test('one minute below MCT → below-mct', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ZZZ',
      connectionType: 'international-international',
      availableMinutes: 89,
    })
    expect(result.verdict).toBe('below-mct')
  })

  test('0 minutes → below-mct', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ZZZ',
      connectionType: 'domestic-domestic',
      availableMinutes: 0,
    })
    expect(result.verdict).toBe('below-mct')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Return shape invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('return shape invariants', () => {
  test('always returns required fields with correct types', () => {
    const result = evaluateLayoverTime({
      airportCode: 'ICN',
      connectionType: 'international-international',
      availableMinutes: 90,
    })
    expect(result).toHaveProperty('mctMinutes')
    expect(result).toHaveProperty('verdict')
    expect(result).toHaveProperty('isKnownAirport')
    expect(typeof result.mctMinutes).toBe('number')
    expect(typeof result.isKnownAirport).toBe('boolean')
    expect(['comfortable', 'tight', 'below-mct']).toContain(result.verdict)
  })

  test('mctMinutes is always a positive integer', () => {
    const testCases = [
      { airportCode: 'ICN', connectionType: 'international-international' as const, availableMinutes: 90 },
      { airportCode: 'AMS', connectionType: 'domestic-domestic' as const, availableMinutes: 60 },
      { airportCode: 'XYZ', connectionType: 'international-domestic' as const, availableMinutes: 120 },
      { airportCode: 'ATL', connectionType: 'domestic-international' as const, availableMinutes: 30 },
    ]
    for (const tc of testCases) {
      const result = evaluateLayoverTime(tc)
      expect(result.mctMinutes).toBeGreaterThan(0)
      expect(Number.isInteger(result.mctMinutes)).toBe(true)
    }
  })

  test('case-insensitive airport code lookup', () => {
    const upper = evaluateLayoverTime({
      airportCode: 'ICN',
      connectionType: 'international-international',
      availableMinutes: 90,
    })
    const lower = evaluateLayoverTime({
      airportCode: 'icn',
      connectionType: 'international-international',
      availableMinutes: 90,
    })
    expect(upper.mctMinutes).toBe(lower.mctMinutes)
    expect(upper.isKnownAirport).toBe(lower.isKnownAirport)
  })
})
