import { checkVisaRequirement } from './visaRequirementChecker'

// ────────────────────────────────────────────────────────────────────────────
// Return shape
// ────────────────────────────────────────────────────────────────────────────

describe('return shape', () => {
  test('always returns required fields', () => {
    const result = checkVisaRequirement('KR', 'JP')
    expect(result).toHaveProperty('requirementType')
    expect(result).toHaveProperty('note')
    expect(['visa-free', 'e-visa', 'visa-required', 'unknown']).toContain(
      result.requirementType
    )
    expect(typeof result.note).toBe('string')
    expect(result.note.length).toBeGreaterThan(0)
  })

  test('maxStayDays is undefined or a positive integer', () => {
    const combinations: [string, string][] = [
      ['KR', 'JP'],
      ['US', 'IN'],
      ['ZZ', 'XX'],
      ['KR', 'US'],
    ]
    for (const [from, to] of combinations) {
      const result = checkVisaRequirement(from, to)
      if (result.maxStayDays !== undefined) {
        expect(result.maxStayDays).toBeGreaterThan(0)
        expect(Number.isInteger(result.maxStayDays)).toBe(true)
      }
    }
  })

  test('note is always a non-empty string for any input', () => {
    const combinations: [string, string][] = [
      ['KR', 'JP'],
      ['US', 'DE'],
      ['GB', 'AU'],
      ['IN', 'US'],
      ['XX', 'YY'],
    ]
    for (const [from, to] of combinations) {
      const result = checkVisaRequirement(from, to)
      expect(typeof result.note).toBe('string')
      expect(result.note.length).toBeGreaterThan(0)
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Known visa-free combinations
// ────────────────────────────────────────────────────────────────────────────

describe('visa-free combinations', () => {
  test('KR → JP: 90-day visa-free', () => {
    const result = checkVisaRequirement('KR', 'JP')
    expect(result.requirementType).toBe('visa-free')
    expect(result.maxStayDays).toBe(90)
  })

  test('US → JP: 90-day visa-free', () => {
    const result = checkVisaRequirement('US', 'JP')
    expect(result.requirementType).toBe('visa-free')
    expect(result.maxStayDays).toBe(90)
  })

  test('KR → DE: Schengen visa-free', () => {
    const result = checkVisaRequirement('KR', 'DE')
    expect(result.requirementType).toBe('visa-free')
    expect(result.maxStayDays).toBe(90)
  })

  test('US → CA: visa-free', () => {
    const result = checkVisaRequirement('US', 'CA')
    expect(result.requirementType).toBe('visa-free')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Known e-visa combinations
// ────────────────────────────────────────────────────────────────────────────

describe('e-visa combinations', () => {
  test('KR → US: ESTA (e-visa)', () => {
    const result = checkVisaRequirement('KR', 'US')
    expect(result.requirementType).toBe('e-visa')
    expect(result.maxStayDays).toBeDefined()
  })

  test('GB → AU: ETA (e-visa)', () => {
    const result = checkVisaRequirement('GB', 'AU')
    expect(result.requirementType).toBe('e-visa')
  })

  test('KR → IN: e-visa', () => {
    const result = checkVisaRequirement('KR', 'IN')
    expect(result.requirementType).toBe('e-visa')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Known visa-required combinations
// ────────────────────────────────────────────────────────────────────────────

describe('visa-required combinations', () => {
  test('IN → US: visa required', () => {
    const result = checkVisaRequirement('IN', 'US')
    expect(result.requirementType).toBe('visa-required')
  })

  test('IN → JP: visa required', () => {
    const result = checkVisaRequirement('IN', 'JP')
    expect(result.requirementType).toBe('visa-required')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Unknown combinations
// ────────────────────────────────────────────────────────────────────────────

describe('unknown combinations', () => {
  test('completely unknown country codes return unknown with a note', () => {
    const result = checkVisaRequirement('ZZ', 'YY')
    expect(result.requirementType).toBe('unknown')
    expect(result.maxStayDays).toBeUndefined()
    expect(result.note.length).toBeGreaterThan(0)
  })

  test('known country as origin but unknown destination returns unknown', () => {
    const result = checkVisaRequirement('KR', 'ZZ')
    expect(result.requirementType).toBe('unknown')
  })

  test('same country returns unknown', () => {
    const result = checkVisaRequirement('KR', 'KR')
    expect(result.requirementType).toBe('unknown')
  })

  test('same country with different case returns unknown', () => {
    const result = checkVisaRequirement('us', 'US')
    expect(result.requirementType).toBe('unknown')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Case-insensitive handling
// ────────────────────────────────────────────────────────────────────────────

describe('case-insensitive lookup', () => {
  test('lowercase codes produce same result as uppercase', () => {
    const upper = checkVisaRequirement('KR', 'JP')
    const lower = checkVisaRequirement('kr', 'jp')
    expect(upper.requirementType).toBe(lower.requirementType)
    expect(upper.maxStayDays).toBe(lower.maxStayDays)
  })

  test('mixed case codes produce same result', () => {
    const normal = checkVisaRequirement('US', 'DE')
    const mixed = checkVisaRequirement('Us', 'De')
    expect(normal.requirementType).toBe(mixed.requirementType)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Symmetry — different from↔to combos can have different results
// ────────────────────────────────────────────────────────────────────────────

describe('asymmetric requirements', () => {
  test('IN→US and US→IN can have different requirements', () => {
    const inToUs = checkVisaRequirement('IN', 'US')
    const usToIn = checkVisaRequirement('US', 'IN')
    // Both are valid results; they just may differ
    expect(['visa-free', 'e-visa', 'visa-required', 'unknown']).toContain(
      inToUs.requirementType
    )
    expect(['visa-free', 'e-visa', 'visa-required', 'unknown']).toContain(
      usToIn.requirementType
    )
  })
})
