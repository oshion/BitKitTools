import {
  estimateCompensation,
  estimateDeniedBoardingCompensationUs,
} from './flightDelayCompensation'
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
// EU261 — disruption type: cancellation (same logic as delay)
// ────────────────────────────────────────────────────────────────────────────

describe('EU261 — cancellation', () => {
  test('short-haul cancellation, airline-fault, ≥3h → €250 eligible', () => {
    const input: FlightDelayInput = {
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 3,
      reason: 'airline-fault',
      disruptionType: 'cancellation',
    }
    const result = estimateCompensation(input)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(250)
    expect(result.currency).toBe('EUR')
  })

  test('long-haul cancellation, force-majeure → not eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'long',
      delayHours: 5,
      reason: 'force-majeure',
      disruptionType: 'cancellation',
    })
    expect(result.eligible).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EU261 — denied boarding (force majeure exemption does NOT apply)
// ────────────────────────────────────────────────────────────────────────────

describe('EU261 — denied boarding', () => {
  test('short-haul denied-boarding, airline-fault, ≥3h → eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 3,
      reason: 'airline-fault',
      disruptionType: 'denied-boarding',
    })
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(250)
    expect(result.currency).toBe('EUR')
  })

  test('EU261 denied-boarding + force-majeure → still eligible (no force majeure defence for overbooking)', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 5,
      reason: 'force-majeure',
      disruptionType: 'denied-boarding',
    })
    // EU261 does not accept force majeure as a defence for denied boarding
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(250)
  })

  test('EU261 long-haul denied-boarding + force-majeure + ≥4h → €600 (force majeure inapplicable)', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'long',
      delayHours: 4,
      reason: 'force-majeure',
      disruptionType: 'denied-boarding',
    })
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(600)
  })

  test('EU261 denied-boarding + threshold not met → not eligible', () => {
    const result = estimateCompensation({
      regulation: 'EU261',
      distanceCategory: 'short',
      delayHours: 1,
      reason: 'airline-fault',
      disruptionType: 'denied-boarding',
    })
    expect(result.eligible).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// US DOT — delay/cancellation still ineligible for fixed comp (regression)
// ────────────────────────────────────────────────────────────────────────────

describe('US DOT — delay and cancellation regression', () => {
  test('US_DOT + delay → eligible: false (unchanged)', () => {
    const result = estimateCompensation({
      regulation: 'US_DOT',
      distanceCategory: 'short',
      delayHours: 5,
      reason: 'airline-fault',
      disruptionType: 'delay',
    })
    expect(result.eligible).toBe(false)
    expect(result.amountRange.min).toBe(0)
    expect(result.currency).toBe('USD')
  })

  test('US_DOT + cancellation → eligible: false (unchanged)', () => {
    const result = estimateCompensation({
      regulation: 'US_DOT',
      distanceCategory: 'medium',
      delayHours: 5,
      reason: 'airline-fault',
      disruptionType: 'cancellation',
    })
    expect(result.eligible).toBe(false)
    expect(result.amountRange.min).toBe(0)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// estimateDeniedBoardingCompensationUs
// ────────────────────────────────────────────────────────────────────────────

describe('estimateDeniedBoardingCompensationUs', () => {
  // Domestic — 0 to ≤1 h: no compensation
  test('domestic, 0.5h delay → not eligible', () => {
    const result = estimateDeniedBoardingCompensationUs(500, 'USD', 0.5, false)
    expect(result.eligible).toBe(false)
    expect(result.amountRange.min).toBe(0)
    expect(result.amountRange.max).toBe(0)
  })

  // Domestic — 1–2 h: 200% capped at $1,075
  test('domestic, 1.5h, $400 fare → 200% = $800 (under cap)', () => {
    const result = estimateDeniedBoardingCompensationUs(400, 'USD', 1.5, false)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(800)
    expect(result.amountRange.max).toBe(800)
    expect(result.currency).toBe('USD')
  })

  test('domestic, 1.5h, $600 fare → 200% = $1,200 → capped at $1,075', () => {
    const result = estimateDeniedBoardingCompensationUs(600, 'USD', 1.5, false)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(1075)
    expect(result.amountRange.max).toBe(1075)
  })

  // Domestic — 2 h+: 400% capped at $2,150
  test('domestic, 3h, $300 fare → 400% = $1,200 (under cap)', () => {
    const result = estimateDeniedBoardingCompensationUs(300, 'USD', 3, false)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(1200)
    expect(result.amountRange.max).toBe(1200)
  })

  test('domestic, 3h, $1000 fare → 400% = $4,000 → capped at $2,150', () => {
    const result = estimateDeniedBoardingCompensationUs(1000, 'USD', 3, false)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(2150)
    expect(result.amountRange.max).toBe(2150)
  })

  // International — 1–4 h: 200% capped at $1,075
  test('international, 2h, $400 fare → 200% = $800', () => {
    const result = estimateDeniedBoardingCompensationUs(400, 'USD', 2, true)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(800)
  })

  test('international, 3h, $700 fare → 200% = $1,400 → capped at $1,075', () => {
    const result = estimateDeniedBoardingCompensationUs(700, 'USD', 3, true)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(1075)
  })

  // International — 4 h+: 400% capped at $2,150
  test('international, 5h, $300 fare → 400% = $1,200', () => {
    const result = estimateDeniedBoardingCompensationUs(300, 'USD', 5, true)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(1200)
  })

  test('international, 5h, $3000 fare → 400% = $12,000 → capped at $2,150', () => {
    const result = estimateDeniedBoardingCompensationUs(3000, 'USD', 5, true)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(2150)
  })

  // Exactly 1h: no compensation (threshold is exclusive > 1h)
  test('domestic, exactly 1h → not eligible', () => {
    const result = estimateDeniedBoardingCompensationUs(500, 'USD', 1, false)
    expect(result.eligible).toBe(false)
  })

  // Exactly 2h domestic: enters 400% tier (threshold is exclusive > 2h means at 2h it's already 400%)
  // Actually per the rule: > 2h → 400%, so exactly 2h is exclusive: still 200%?
  // Let me re-read: "1–2 h late → 200%", "2 h+ late → 400%"
  // The rule says minDelayHoursExclusive: 2, so 2 is the boundary.
  // At exactly 2h: 2 > 1 (first tier starts) and 2 <= 2 (first tier max) → 200%
  // Wait, I set: domestic[0] = minExclusive:1, maxInclusive:2 → so 2h qualifies for 200%
  // domestic[1] = minExclusive:2 → so >2h qualifies for 400%
  // At exactly 2h: qualifies for 200% (maxInclusive: 2)
  test('domestic, exactly 2h → 200% tier (boundary)', () => {
    const result = estimateDeniedBoardingCompensationUs(400, 'USD', 2, false)
    expect(result.eligible).toBe(true)
    expect(result.amountRange.min).toBe(800) // 200% of 400
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
