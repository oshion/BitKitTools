/**
 * BAC Calculator — Widmark formula implementation
 *
 * Source: Widmark EMP (1932). "Die theoretischen Grundlagen und die praktische
 * Verwendbarkeit der gerichtlich-medizinischen Alkoholbestimmung."
 * Urban & Schwarzenberg, Berlin/Vienna.
 *
 * ⚠️  YMYL / Legal notice:
 * The result is an estimate only. Individual variation in alcohol metabolism
 * (food intake, medications, metabolic rate, etc.) can cause actual BAC to
 * differ significantly from the calculated value. This must never be used to
 * judge fitness to drive or operate machinery (ADR-014).
 */

export type BacInput = {
  gender: 'male' | 'female'
  weightKg: number
  drinks: Array<{ abvPercent: number; volumeMl: number }>
  hoursElapsed: number
}

/**
 * Calculates estimated Blood Alcohol Concentration using the Widmark formula.
 *
 * Returns `isEstimateOnly: true` as a literal type — this is intentional.
 * The literal prevents callers from treating the result as authoritative
 * and discourages "if (bac < threshold) show('safe')" UI patterns (ADR-014).
 *
 * Formula: BAC (%) = (A × 100) / (W × r) − (β × t)
 *   A  = total alcohol consumed (grams)
 *   W  = body weight (grams)
 *   r  = Widmark factor (male: 0.68, female: 0.55)
 *   β  = elimination rate (0.015 g/dL per hour)
 *   t  = hours elapsed since drinking started
 */
export function calculateBac(input: BacInput): { bacPercent: number; isEstimateOnly: true } {
  const ETHANOL_DENSITY = 0.789 // g/mL
  const ELIMINATION_RATE = 0.015 // g/dL per hour
  const WIDMARK_FACTOR = input.gender === 'male' ? 0.68 : 0.55

  const totalAlcoholG = input.drinks.reduce((sum, drink) => {
    return sum + drink.volumeMl * (drink.abvPercent / 100) * ETHANOL_DENSITY
  }, 0)

  if (totalAlcoholG === 0 || input.weightKg <= 0) {
    return { bacPercent: 0, isEstimateOnly: true }
  }

  const weightG = input.weightKg * 1000

  // Widmark formula — result is BAC in percentage (g/dL expressed as %)
  const rawBac = (totalAlcoholG * 100) / (weightG * WIDMARK_FACTOR)

  // Subtract elapsed elimination; clamp to zero (BAC cannot be negative)
  const bacPercent = Math.max(0, rawBac - ELIMINATION_RATE * input.hoursElapsed)

  // Round to 3 decimal places for display
  return {
    bacPercent: Math.round(bacPercent * 1000) / 1000,
    isEstimateOnly: true,
  }
}

/** Convert pounds to kilograms (display helper) */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.45359237 * 10) / 10
}

/** Convert kilograms to pounds (display helper) */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462262 * 10) / 10
}
