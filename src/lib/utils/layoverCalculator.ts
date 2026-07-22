import {
  AIRPORT_MCT_DATA,
  DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE,
} from '@/lib/config/airportMctData'
import type { ConnectionType } from '@/lib/config/airportMctData'

export type { ConnectionType }

export type LayoverVerdict = 'comfortable' | 'tight' | 'below-mct'

export type LayoverEvaluationResult = {
  /** The MCT in minutes used for this evaluation */
  mctMinutes: number
  /** Verdict based on available time vs MCT */
  verdict: LayoverVerdict
  /** Whether the airport was found in our database */
  isKnownAirport: boolean
}

/**
 * Comfort threshold multiplier.
 * availableMinutes >= mctMinutes * COMFORTABLE_THRESHOLD → 'comfortable'
 * availableMinutes >= mctMinutes → 'tight'
 * availableMinutes <  mctMinutes → 'below-mct'
 *
 * 1.5× gives passengers a reasonable buffer above the published minimum.
 * For example, a 90-min MCT airport is "comfortable" at 135+ minutes.
 */
const COMFORTABLE_THRESHOLD = 1.5

/**
 * Evaluates whether a given layover duration is sufficient for a connection
 * at the specified airport and connection type.
 *
 * Lookup strategy:
 * 1. Find the airport by IATA code (case-insensitive).
 * 2. If found, look up the MCT for the requested connection type.
 *    - If that specific connection type is defined, use it (isKnownAirport = true).
 *    - If not defined for that connection type, fall back to the default for that
 *      connection type (isKnownAirport = true, because the airport itself is known).
 * 3. If airport not found at all, use the default MCT (isKnownAirport = false).
 */
export function evaluateLayoverTime(input: {
  airportCode: string
  connectionType: ConnectionType
  availableMinutes: number
}): LayoverEvaluationResult {
  const { connectionType, availableMinutes } = input
  const normalizedCode = input.airportCode.trim().toUpperCase()

  const airportEntry = AIRPORT_MCT_DATA.find((a) => a.code === normalizedCode)

  let mctMinutes: number
  let isKnownAirport: boolean

  if (airportEntry) {
    isKnownAirport = true
    const specificMct = airportEntry.mctMinutesByConnectionType[connectionType]
    mctMinutes =
      specificMct !== undefined
        ? specificMct
        : DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE[connectionType]
  } else {
    isKnownAirport = false
    mctMinutes = DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE[connectionType]
  }

  const verdict: LayoverVerdict =
    availableMinutes < mctMinutes
      ? 'below-mct'
      : availableMinutes >= mctMinutes * COMFORTABLE_THRESHOLD
        ? 'comfortable'
        : 'tight'

  return { mctMinutes, verdict, isKnownAirport }
}
