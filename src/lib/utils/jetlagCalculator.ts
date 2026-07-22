/**
 * Jet Lag Recovery Calculator
 *
 * Scientific basis for recovery coefficients:
 *   The human circadian clock has an intrinsic period slightly longer than 24 hours
 *   (~24.2 h), which makes it easier to delay the clock (westward travel = phase delay)
 *   than to advance it (eastward travel = phase advance). This asymmetry is well-established
 *   in chronobiology literature.
 *
 *   Recovery rate approximations used here:
 *     - Westward travel: ~1.5 hours of clock adjustment per day → ≈ 1 day per 1.5 time zones
 *     - Eastward travel: ~1.0 hour of clock adjustment per day  → ≈ 1 day per time zone
 *
 *   These are widely-cited approximations from sleep medicine. The underlying physiological
 *   principle (east harder than west due to intrinsic period > 24 h) is documented in:
 *     Waterhouse J, Reilly T, Atkinson G, Edwards B.
 *     "Jet lag: trends and coping strategies."
 *     The Lancet. 2007;369(9567):1117–1129. doi:10.1016/S0140-6736(07)60529-7
 *
 *   Exact per-person recovery rates vary significantly based on age, chronotype,
 *   light exposure strategy, and melatonin use. These coefficients are representative
 *   estimates, not clinical predictions.
 *
 * Direction logic:
 *   The function normalises the raw UTC-offset difference to the shortest-path arc
 *   (≤ 12 time zones). This is a simplification — actual flight paths depend on geography,
 *   jet streams, and airline routing, not just time-zone arithmetic. FAQ content should
 *   acknowledge this limitation.
 */

/** Factor: days of recovery per time zone crossed for westward travel (1 / 1.5). */
const WESTWARD_DAYS_PER_ZONE = 1 / 1.5

/** Factor: days of recovery per time zone crossed for eastward travel. */
const EASTWARD_DAYS_PER_ZONE = 1.0

export type JetlagDirection = 'eastward' | 'westward' | 'none'

export type JetlagResult = {
  /** Number of time zones crossed via the shortest path (0–12). */
  timezonesCrossed: number
  /** Direction of travel on the shortest path. */
  direction: JetlagDirection
  /**
   * Estimated days until full circadian re-entrainment.
   * 0 when no time zones are crossed.
   * Eastward values are higher than westward for the same zone count.
   */
  estimatedRecoveryDays: number
}

/**
 * Calculates jet lag severity based on UTC offsets.
 *
 * @param input.originUtcOffsetHours      UTC offset of the departure timezone (e.g. -5 for EST)
 * @param input.destinationUtcOffsetHours UTC offset of the arrival timezone  (e.g. +9 for JST)
 */
export function calculateJetlag(input: {
  originUtcOffsetHours: number
  destinationUtcOffsetHours: number
}): JetlagResult {
  const { originUtcOffsetHours, destinationUtcOffsetHours } = input

  // Raw signed difference: positive = heading east, negative = heading west
  const rawDiff = destinationUtcOffsetHours - originUtcOffsetHours

  // Normalise to [-12, 12] to always take the shortest arc across the date line
  let normalizedDiff = rawDiff
  if (normalizedDiff > 12) normalizedDiff -= 24
  if (normalizedDiff < -12) normalizedDiff += 24

  const timezonesCrossed = Math.abs(normalizedDiff)

  let direction: JetlagDirection
  if (normalizedDiff === 0) {
    direction = 'none'
  } else if (normalizedDiff > 0) {
    direction = 'eastward'
  } else {
    direction = 'westward'
  }

  let estimatedRecoveryDays: number
  if (direction === 'none') {
    estimatedRecoveryDays = 0
  } else if (direction === 'westward') {
    estimatedRecoveryDays = Math.ceil(timezonesCrossed * WESTWARD_DAYS_PER_ZONE)
  } else {
    estimatedRecoveryDays = Math.ceil(timezonesCrossed * EASTWARD_DAYS_PER_ZONE)
  }

  return { timezonesCrossed, direction, estimatedRecoveryDays }
}
