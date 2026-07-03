import { FLIGHT_COMPENSATION_RULES } from '@/lib/config/flightCompensationRules'
import type { DistanceCategory, RegulationType } from '@/lib/config/flightCompensationRules'

export type FlightDelayInput = {
  regulation: RegulationType
  distanceCategory: DistanceCategory
  delayHours: number
  reason: 'airline-fault' | 'force-majeure'
}

export type CompensationEstimate = {
  amountRange: { min: number; max: number }
  currency: string
  eligible: boolean
  reason: string
}

/**
 * Estimates flight delay compensation based on the selected regulation,
 * distance category, delay duration, and cause of delay.
 *
 * Returns `eligible: false` when:
 *   - The delay threshold is not met
 *   - The cause is force majeure (EU261 exemption)
 *   - The selected regulation has no statutory fixed compensation (US DOT)
 */
export function estimateCompensation(input: FlightDelayInput): CompensationEstimate {
  const { regulation, distanceCategory, delayHours, reason } = input
  const config = FLIGHT_COMPENSATION_RULES[regulation]
  const categoryConfig = config.categories[distanceCategory]

  // US DOT: no statutory fixed compensation exists
  if (regulation === 'US_DOT') {
    return {
      amountRange: { min: 0, max: 0 },
      currency: 'USD',
      eligible: false,
      reason: config.noCompensationNote.en,
    }
  }

  // Force majeure: EU261 exempts airlines from fixed compensation
  if (reason === 'force-majeure') {
    return {
      amountRange: { min: 0, max: 0 },
      currency: 'EUR',
      eligible: false,
      reason:
        'Under EU261, delays caused by extraordinary circumstances (force majeure) exempt the airline from fixed compensation. ' +
        config.forceMajeureNote.en,
    }
  }

  // EU261 with airline fault — find the highest applicable rule
  // Rules are sorted ascending by minDelayHours; pick the highest threshold met
  const applicableRules = categoryConfig.rules.filter((r) => delayHours >= r.minDelayHours)

  if (applicableRules.length === 0) {
    // Delay threshold not met
    return {
      amountRange: { min: 0, max: 0 },
      currency: 'EUR',
      eligible: false,
      reason: `The minimum delay threshold for ${categoryConfig.label.en} flights under EU261 has not been met. Compensation requires an arrival delay of at least ${categoryConfig.rules[0]?.minDelayHours ?? 3} hours.`,
    }
  }

  // Take the highest-tier rule that applies (last in the sorted array)
  const bestRule = applicableRules[applicableRules.length - 1]!

  return {
    amountRange: { min: bestRule.compensation.min, max: bestRule.compensation.max },
    currency: bestRule.compensation.currency,
    eligible: true,
    reason: bestRule.note.en,
  }
}
