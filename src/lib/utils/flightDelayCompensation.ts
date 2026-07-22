import {
  FLIGHT_COMPENSATION_RULES,
  US_DENIED_BOARDING_RULES,
} from '@/lib/config/flightCompensationRules'
import type { DistanceCategory, RegulationType } from '@/lib/config/flightCompensationRules'

export type DisruptionType = 'delay' | 'cancellation' | 'denied-boarding'

export type FlightDelayInput = {
  regulation: RegulationType
  distanceCategory: DistanceCategory
  delayHours: number
  reason: 'airline-fault' | 'force-majeure'
  /** Optional — defaults to 'delay' for backward compatibility */
  disruptionType?: DisruptionType
}

export type CompensationEstimate = {
  amountRange: { min: number; max: number }
  currency: string
  eligible: boolean
  reason: string
}

/**
 * Estimates flight disruption compensation based on the selected regulation,
 * disruption type, distance category, delay duration, and cause.
 *
 * Returns `eligible: false` when:
 *   - The delay threshold is not met
 *   - The cause is force majeure (EU261 exemption) — EXCEPT for denied boarding
 *   - The selected regulation has no statutory fixed compensation for delays (US DOT)
 *
 * Note: US DOT + denied-boarding is handled by `estimateDeniedBoardingCompensationUs`
 * (requires one-way fare amount). Calling this function with US_DOT + denied-boarding
 * is not the intended path; the UI calls the separate function directly.
 */
export function estimateCompensation(input: FlightDelayInput): CompensationEstimate {
  const { regulation, distanceCategory, delayHours, reason } = input
  const disruptionType = input.disruptionType ?? 'delay'
  const config = FLIGHT_COMPENSATION_RULES[regulation]
  const categoryConfig = config.categories[distanceCategory]

  // US DOT: no statutory fixed compensation for delays or cancellations.
  // Denied boarding is handled separately via estimateDeniedBoardingCompensationUs.
  if (regulation === 'US_DOT') {
    return {
      amountRange: { min: 0, max: 0 },
      currency: 'USD',
      eligible: false,
      reason: config.noCompensationNote.en,
    }
  }

  // EU261 — force majeure exempts airlines from compensation for delays and cancellations,
  // BUT NOT for denied boarding (overbooking). EU261 does not accept force majeure as a
  // defence for involuntary bumping — it is always an airline's commercial decision.
  if (reason === 'force-majeure' && disruptionType !== 'denied-boarding') {
    return {
      amountRange: { min: 0, max: 0 },
      currency: 'EUR',
      eligible: false,
      reason:
        'Under EU261, delays caused by extraordinary circumstances (force majeure) exempt the airline from fixed compensation. ' +
        config.forceMajeureNote.en,
    }
  }

  // EU261 with airline fault (or denied boarding regardless of stated reason) —
  // find the highest applicable distance-based rule.
  const applicableRules = categoryConfig.rules.filter((r) => delayHours >= r.minDelayHours)

  if (applicableRules.length === 0) {
    return {
      amountRange: { min: 0, max: 0 },
      currency: 'EUR',
      eligible: false,
      reason: `The minimum delay threshold for ${categoryConfig.label.en} flights under EU261 has not been met. Compensation requires an arrival delay of at least ${categoryConfig.rules[0]?.minDelayHours ?? 3} hours.`,
    }
  }

  const bestRule = applicableRules[applicableRules.length - 1]!

  return {
    amountRange: { min: bestRule.compensation.min, max: bestRule.compensation.max },
    currency: bestRule.compensation.currency,
    eligible: true,
    reason: bestRule.note.en,
  }
}

/**
 * Calculates US DOT involuntary denied boarding (overbooking) compensation
 * per 14 CFR § 250.5 (verified 2026-07-22).
 *
 * Compensation is based on the one-way fare, not distance, and the delay of
 * the offered alternate transportation vs. original scheduled arrival:
 *   Domestic:      >0–1h late → none | >1–2h late → 200% (cap $1,075) | >2h → 400% (cap $2,150)
 *   International: >0–1h late → none | >1–4h late → 200% (cap $1,075) | >4h → 400% (cap $2,150)
 *
 * Note: "not eligible" (eligible: false) is returned when the alternate transportation
 * arrives within 1 hour of the original scheduled arrival.
 */
export function estimateDeniedBoardingCompensationUs(
  fareAmount: number,
  currency: string,
  /** How many hours late the offered alternate transportation arrives vs. original schedule */
  delayHours: number,
  isInternational: boolean
): CompensationEstimate {
  const rules = isInternational
    ? US_DENIED_BOARDING_RULES.international
    : US_DENIED_BOARDING_RULES.domestic

  // 0–1 h: no compensation required
  if (delayHours <= 1) {
    return {
      amountRange: { min: 0, max: 0 },
      currency,
      eligible: false,
      reason:
        'Under 14 CFR § 250.5, no compensation is required when the offered alternate transportation arrives within 1 hour of the original scheduled arrival.',
    }
  }

  // Find the applicable tier
  const applicableTier = rules.find(
    (r) =>
      delayHours > r.minDelayHoursExclusive &&
      (r.maxDelayHoursInclusive === null || delayHours <= r.maxDelayHoursInclusive)
  )

  if (!applicableTier) {
    // Fallback — should not happen with well-formed rules
    return {
      amountRange: { min: 0, max: 0 },
      currency,
      eligible: false,
      reason: 'No applicable denied boarding compensation rule found.',
    }
  }

  const calculated = Math.round((fareAmount * applicableTier.farePercentage) / 100)
  const capped = Math.min(calculated, applicableTier.capUsd)

  return {
    amountRange: { min: capped, max: capped },
    currency: 'USD',
    eligible: true,
    reason: applicableTier.note.en,
  }
}
