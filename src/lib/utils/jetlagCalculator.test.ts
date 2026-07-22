import { calculateJetlag } from './jetlagCalculator'

describe('calculateJetlag', () => {
  // ─── Same timezone ──────────────────────────────────────────────────────────

  test('returns none direction and 0 recovery days when origin and destination are the same', () => {
    const result = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: 0 })
    expect(result.timezonesCrossed).toBe(0)
    expect(result.direction).toBe('none')
    expect(result.estimatedRecoveryDays).toBe(0)
  })

  test('returns none direction when both are the same non-zero offset', () => {
    const result = calculateJetlag({ originUtcOffsetHours: 9, destinationUtcOffsetHours: 9 })
    expect(result.timezonesCrossed).toBe(0)
    expect(result.direction).toBe('none')
    expect(result.estimatedRecoveryDays).toBe(0)
  })

  // ─── Westward travel (destination offset < origin offset on short path) ─────

  test('NYC to LA: UTC-5 → UTC-8, 3 zones westward, 2 recovery days', () => {
    // rawDiff = -8 - (-5) = -3 → westward
    const result = calculateJetlag({ originUtcOffsetHours: -5, destinationUtcOffsetHours: -8 })
    expect(result.timezonesCrossed).toBe(3)
    expect(result.direction).toBe('westward')
    // ceil(3 / 1.5) = 2
    expect(result.estimatedRecoveryDays).toBe(2)
  })

  test('NYC to Tokyo via Pacific: UTC-5 → UTC+9, short path is 10 zones westward', () => {
    // rawDiff = 9 - (-5) = 14 → exceeds 12 → normalizedDiff = 14 - 24 = -10 (westward)
    // Shortest route NYC→Tokyo crosses 10 zones westward (Pacific)
    const result = calculateJetlag({ originUtcOffsetHours: -5, destinationUtcOffsetHours: 9 })
    expect(result.timezonesCrossed).toBe(10)
    expect(result.direction).toBe('westward')
    // ceil(10 / 1.5) = ceil(6.67) = 7
    expect(result.estimatedRecoveryDays).toBe(7)
  })

  // ─── Eastward travel (destination offset > origin offset on short path) ─────

  test('NYC to London: UTC-5 → UTC+0, 5 zones eastward, 5 recovery days', () => {
    // rawDiff = 0 - (-5) = 5 → eastward
    const result = calculateJetlag({ originUtcOffsetHours: -5, destinationUtcOffsetHours: 0 })
    expect(result.timezonesCrossed).toBe(5)
    expect(result.direction).toBe('eastward')
    // ceil(5 * 1.0) = 5
    expect(result.estimatedRecoveryDays).toBe(5)
  })

  test('London to Seoul: UTC+0 → UTC+9, 9 zones eastward, 9 recovery days', () => {
    const result = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: 9 })
    expect(result.timezonesCrossed).toBe(9)
    expect(result.direction).toBe('eastward')
    // ceil(9 * 1.0) = 9
    expect(result.estimatedRecoveryDays).toBe(9)
  })

  test('Tokyo to NYC via Pacific: UTC+9 → UTC-5, short path is 10 zones eastward', () => {
    // rawDiff = -5 - 9 = -14 → below -12 → normalizedDiff = -14 + 24 = 10 (eastward)
    // Shortest route Tokyo→NYC crosses 10 zones eastward (Pacific)
    const result = calculateJetlag({ originUtcOffsetHours: 9, destinationUtcOffsetHours: -5 })
    expect(result.timezonesCrossed).toBe(10)
    expect(result.direction).toBe('eastward')
    // ceil(10 * 1.0) = 10
    expect(result.estimatedRecoveryDays).toBe(10)
  })

  // ─── Short-path correction (date line crossings) ────────────────────────────

  test('uses short westward path when rawDiff > 12 (UTC-10 → UTC+3: raw=13, short=11 west)', () => {
    // rawDiff = 3 - (-10) = 13 → 13 > 12 → normalizedDiff = 13 - 24 = -11 (westward)
    const result = calculateJetlag({ originUtcOffsetHours: -10, destinationUtcOffsetHours: 3 })
    expect(result.timezonesCrossed).toBe(11)
    expect(result.direction).toBe('westward')
    // ceil(11 / 1.5) = ceil(7.33) = 8
    expect(result.estimatedRecoveryDays).toBe(8)
  })

  test('uses short eastward path when rawDiff < -12 (UTC+10 → UTC-10: raw=-20, short=4 east)', () => {
    // rawDiff = -10 - 10 = -20 → -20 < -12 → normalizedDiff = -20 + 24 = 4 (eastward)
    const result = calculateJetlag({ originUtcOffsetHours: 10, destinationUtcOffsetHours: -10 })
    expect(result.timezonesCrossed).toBe(4)
    expect(result.direction).toBe('eastward')
    // ceil(4 * 1.0) = 4
    expect(result.estimatedRecoveryDays).toBe(4)
  })

  // ─── Boundary: exactly 12 hours ─────────────────────────────────────────────

  test('exactly 12-hour difference is treated as eastward (no short-path correction)', () => {
    // rawDiff = 12 → not > 12, not < -12 → normalizedDiff = 12 (eastward)
    const result = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: 12 })
    expect(result.timezonesCrossed).toBe(12)
    expect(result.direction).toBe('eastward')
  })

  // ─── Eastward always harder than westward for same zone count ───────────────

  test('eastward recovery takes longer than westward for the same number of zones', () => {
    const eastward = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: 6 })
    const westward = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: -6 })
    expect(eastward.direction).toBe('eastward')
    expect(westward.direction).toBe('westward')
    expect(eastward.timezonesCrossed).toBe(westward.timezonesCrossed)
    expect(eastward.estimatedRecoveryDays).toBeGreaterThan(westward.estimatedRecoveryDays)
  })

  // ─── Specific recovery day values ──────────────────────────────────────────

  test('westward 6 zones: ceil(6 / 1.5) = 4 days', () => {
    const result = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: -6 })
    expect(result.estimatedRecoveryDays).toBe(4)
  })

  test('eastward 6 zones: ceil(6 × 1.0) = 6 days', () => {
    const result = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: 6 })
    expect(result.estimatedRecoveryDays).toBe(6)
  })

  test('single zone westward: 1 recovery day minimum', () => {
    const result = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: -1 })
    expect(result.timezonesCrossed).toBe(1)
    expect(result.direction).toBe('westward')
    // ceil(1 / 1.5) = ceil(0.67) = 1
    expect(result.estimatedRecoveryDays).toBe(1)
  })

  test('single zone eastward: 1 recovery day', () => {
    const result = calculateJetlag({ originUtcOffsetHours: 0, destinationUtcOffsetHours: 1 })
    expect(result.timezonesCrossed).toBe(1)
    expect(result.direction).toBe('eastward')
    // ceil(1 * 1.0) = 1
    expect(result.estimatedRecoveryDays).toBe(1)
  })
})
