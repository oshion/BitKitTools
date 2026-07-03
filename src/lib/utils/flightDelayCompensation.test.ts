import { estimateCompensation } from './flightDelayCompensation'
import type { FlightDelayInput } from './flightDelayCompensation'

// ────────────────────────────────────────────────────────────────────────────
// EU261 — airline fault
// ────────────────────────────────────────────────────────────────────────────

describe('EU261 — airline fault', () => {
  test('short-haul ≥3h delay → €250 eligible', () => {
    const input: FlightDelayInput = {
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 3,
      reason: 'airline-fault',
    }
    const result = estimateCompensation(input)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(250)
    expect(result.amountRange.max).toBe(250)
    expect(result.currency).toBe('EUR')
  })

  test('short-haul exactly 3h delay is eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 3,
      reason: 'airline-fault',
    })
    expect(result.eligible).toBe(true)
  })

  test('short-haul <3h delay → not eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 2,
      reason: 'airline-fault',
    })
    expect(result.eligible).toBe(false)
    expect(result.amountRange.min).toBe(0)
    expect(result.amountRange.max).toBe(0)
  })

  test('medium-haul ≥3h delay → €400 eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'medium',
      delayHours: 3,
      reason: 'airline-fault',
    })
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(400)
    expect(result.amountRange.max).toBe(400)
    expect(result.currency).toBe('EUR')
  })

  test('medium-haul 5h delay → still €400', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'medium',
      delayHours: 5,
      reason: 'airline-fault',
    })
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(400)
    expect(result.amountRange.max).toBe(400)
  })

  test('long-haul 3h delay → €300 eligible (50% reduction tier)', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'long',
      delayHours: 3,
      reason: 'airline-fault',
    })
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(300)
    expect(result.amountRange.max).toBe(300)
    expect(result.currency).toBe('EUR')
  })

  test('long-haul exactly 4h delay → €600 tier', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'long',
      delayHours: 4,
      reason: 'airline-fault',
    })
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(600)
    expect(result.amountRange.max).toBe(600)
    expect(result.currency).toBe('EUR')
  })

  test('long-haul 6h delay → €600 tier', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'long',
      delayHours: 6,
      reason: 'airline-fault',
    })
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(600)
    expect(result.amountRange.max).toBe(600)
  })

  test('long-haul <3h delay → not eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'long',
      delayHours: 2,
      reason: 'airline-fault',
    })
    expect(result.eligible).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EU261 — force majeure
// ────────────────────────────────────────────────────────────────────────────

describe('EU261 — force majeure', () => {
  test('short-haul ≥3h but force majeure → not eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 5,
      reason: 'force-majeure',
    })
    expect(result.eligible).toBe(false)
    expect(result.amountRange.min).toBe(0)
    expect(result.amountRange.max).toBe(0)
    expect(result.reason).toContain('extraordinary circumstances')
  })

  test('medium-haul ≥3h but force majeure → not eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'medium',
      delayHours: 4,
      reason: 'force-majeure',
    })
    expect(result.eligible).toBe(false)
  })

  test('long-haul ≥4h but force majeure → not eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'long',
      delayHours: 5,
      reason: 'force-majeure',
    })
    expect(result.eligible).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// US DOT — no statutory fixed compensation
// ────────────────────────────────────────────────────────────────────────────

describe('US DOT', () => {
  test('any distance, any reason → not eligible for fixed statutory compensation', () => {
    const cases: FlightDelayInput[] = [
      { regulation: 'US_DOT', distanceCategory: 'short', delayHours: 3, reason: 'airline-fault' },
      { regulation: 'US_DOT', distanceCategory: 'medium', delayHours: 5, reason: 'airline-fault' },
      { regulation: 'US_DOT', distanceCategory: 'long', delayHours: 6, reason: 'airline-fault' },
      {
        regulation: 'US_DOT',
        distanceCategory: 'short',
        delayHours: 4,
        reason: 'force-majeure',
      },
    ]
    for (const input of cases) {
      const result = estimateCompensation(input)
      expect(result.eligible).toBe(false)
      expect(result.amountRange.min).toBe(0)
      expect(result.amountRange.max).toBe(0)
      expect(result.currency).toBe('USD')
    }
  })

  test('US DOT result includes reason explaining no fixed compensation', () => {
    const result = estimateCompensation({
      regulation: 'US_DOT',
      distanceCategory: 'short',
      delayHours: 5,
      reason: 'airline-fault',
    })
    expect(result.reason.length).toBeGreaterThan(10)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Return shape invariants
// ────────────────────────────────────────────────────────────────────────────

describe('return shape', () => {
  test('always returns required fields', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 3,
      reason: 'airline-fault',
    })
    expect(result).toHaveProperty('amountRange')
    expect(result).toHaveProperty('amountRange.min')
    expect(result).toHaveProperty('amountRange.max')
    expect(result).toHaveProperty('currency')
    expect(result).toHaveProperty('eligible')
    expect(result).toHaveProperty('reason')
    expect(typeof result.eligible).toBe('boolean')
    expect(typeof result.currency).toBe('string')
    expect(typeof result.reason).toBe('string')
  })

  test('min is always ≤ max', () => {
    const inputs: FlightDelayInput[] = [
      { regulation: 'EU261', distanceCategory: 'short', delayHours: 3, reason: 'airline-fault' },
      { regulation: 'EU261', distanceCategory: 'medium', delayHours: 3, reason: 'airline-fault' },
      { regulation: 'EU261', distanceCategory: 'long', delayHours: 3, reason: 'airline-fault' },
      { regulation: 'EU261', distanceCategory: 'long', delayHours: 4, reason: 'airline-fault' },
      {
        regulation: 'EU261',
        distanceCategory: 'short',
        delayHours: 1,
        reason: 'force-majeure',
      },
      { regulation: 'US_DOT', distanceCategory: 'long', delayHours: 5, reason: 'airline-fault' },
    ]
    for (const input of inputs) {
      const result = estimateCompensation(input)
      expect(result.amountRange.min).toBeLessThanOrEqual(result.amountRange.max)
    }
  })
})
