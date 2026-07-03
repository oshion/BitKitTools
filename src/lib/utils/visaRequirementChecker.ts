import { VISA_REQUIREMENTS } from '@/lib/config/visaRequirements'

export type VisaRequirementType = 'visa-free' | 'e-visa' | 'visa-required' | 'unknown'

export type VisaRequirementResult = {
  requirementType: VisaRequirementType
  /** Maximum stay in days. Undefined when not applicable or not clearly bounded. */
  maxStayDays?: number
  /** English-language note with key details, caveats, and action items. */
  note: string
}

const SAME_COUNTRY_NOTE =
  'Please select different countries for your departure and destination.'

const UNKNOWN_NOTE =
  'Visa requirement data for this country combination is not available in our reference database. ' +
  'Please check directly with the relevant embassy, consulate, or an official government travel portal ' +
  'before making any travel plans.'

/**
 * Returns the estimated visa requirement for a given passport holder
 * travelling from `fromCountry` to `toCountry`.
 *
 * Country codes must be ISO 3166-1 alpha-2 (e.g. "KR", "US").
 * Lookup is case-insensitive.
 *
 * Returns `requirementType: 'unknown'` when:
 *   - The same country is supplied for both arguments
 *   - The combination is not present in the static reference table
 *
 * IMPORTANT: This function uses a static data snapshot, not a live
 * government feed. Visa policies change frequently. Always verify with
 * the relevant embassy or consulate before travel.
 */
export function checkVisaRequirement(
  fromCountry: string,
  toCountry: string
): VisaRequirementResult {
  const from = fromCountry.toUpperCase().trim()
  const to = toCountry.toUpperCase().trim()

  if (from === to) {
    return {
      requirementType: 'unknown',
      note: SAME_COUNTRY_NOTE,
    }
  }

  const key = `${from}:${to}`
  const entry = VISA_REQUIREMENTS[key]

  if (!entry) {
    return {
      requirementType: 'unknown',
      note: UNKNOWN_NOTE,
    }
  }

  return {
    requirementType: entry.requirementType,
    maxStayDays: entry.maxStayDays,
    note: entry.note,
  }
}
