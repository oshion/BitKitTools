/**
 * Hydrometer Temperature Correction Calculator
 *
 * A hydrometer is calibrated to read accurately at a specific reference
 * temperature (typically 59°F/15°C or 68°F/20°C). When the sample temperature
 * differs from the calibration temperature, the reading must be corrected.
 *
 * Correction formula: CG = MG × f(ST) / f(CT)
 *
 * where:
 *   CG = Corrected Gravity
 *   MG = Measured Gravity (the raw hydrometer reading)
 *   ST = Sample Temperature in °F
 *   CT = Calibration Temperature in °F
 *
 *   f(T) = 1.00130346 − 0.000134722124·T + 0.00000204052596·T²
 *          − 0.00000000232820948·T³
 *
 * This polynomial correction factor is the standard formula widely used in
 * the homebrewing community. It models the thermal expansion of water across
 * brewing-relevant temperatures. While its exact academic derivation is
 * attributed to early National Bureau of Standards research on water density,
 * it is best described as the brewing industry's established standard correction
 * method — used by Brewer's Friend, MoreBeer, and other authoritative sources.
 *
 * Note: This tool is independent from the Homebrew Recipe Calculator. Although
 * both relate to specific gravity, they serve different purposes and must NOT
 * share components or logic (architecture isolation rule, CLAUDE.md rule 8).
 */

/**
 * Converts Celsius to Fahrenheit.
 */
export function fahrenheitFromCelsius(celsius: number): number {
  return celsius * (9 / 5) + 32
}

/**
 * Converts Fahrenheit to Celsius.
 */
export function celsiusFromFahrenheit(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9
}

/**
 * Computes the temperature correction polynomial f(T) at a given temperature
 * in degrees Fahrenheit.
 *
 * f(T) = 1.00130346 − 0.000134722124·T + 0.00000204052596·T²
 *        − 0.00000000232820948·T³
 */
function correctionFactor(tempF: number): number {
  return (
    1.00130346 -
    0.000134722124 * tempF +
    0.00000204052596 * tempF * tempF -
    0.00000000232820948 * tempF * tempF * tempF
  )
}

export type CorrectGravityInput = {
  /** Raw hydrometer reading (e.g. 1.052) */
  measuredGravity: number
  /** Actual temperature of the sample at the time of measurement, in °F */
  sampleTempF: number
  /** Temperature at which the hydrometer is calibrated, in °F */
  calibrationTempF: number
}

export type CorrectGravityResult = {
  /** Temperature-corrected specific gravity, rounded to 4 decimal places */
  correctedGravity: number
  /** Difference between corrected and measured gravity (positive = reading was too low) */
  deltaFromMeasured: number
}

/**
 * Applies a temperature correction to a hydrometer reading.
 *
 * Returns both the corrected gravity and the signed delta from the original
 * reading so the UI can show "how much did the temperature affect the result".
 */
export function correctGravity(input: CorrectGravityInput): CorrectGravityResult {
  const { measuredGravity, sampleTempF, calibrationTempF } = input

  const fSample = correctionFactor(sampleTempF)
  const fCalib = correctionFactor(calibrationTempF)

  const raw = measuredGravity * (fSample / fCalib)

  // Round to 4 decimal places (standard hydrometer precision)
  const correctedGravity = Math.round(raw * 10000) / 10000
  const deltaFromMeasured = Math.round((correctedGravity - measuredGravity) * 10000) / 10000

  return { correctedGravity, deltaFromMeasured }
}
