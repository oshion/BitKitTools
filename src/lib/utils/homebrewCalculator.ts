/**
 * Homebrew Recipe & ABV / Dilution Calculator
 *
 * calculateAbv uses the standard homebrewing approximation formula:
 *   ABV ≈ (OG − FG) × 131.25
 *
 * This is the most widely used formula in homebrewing. It is an approximation;
 * for very high-gravity beers (OG > 1.100) the more accurate Brix-corrected
 * formula may be preferred, but for typical homebrew gravity ranges this
 * approximation is accurate to within ±0.1% ABV.
 *
 * References:
 *   - Fix, G. & Fix, L. (1997). An Analysis of Brewing Techniques.
 *   - Daniels, R. (1996). Designing Great Beers. Brewers Publications.
 *
 * Note: This tool is independent from the BAC Calculator. Although both deal
 * with alcohol percentage, they serve different purposes and must NOT share
 * components or logic (architecture isolation rule, docs/screens/beer-homebrew-recipe-calculator.md).
 */

export type HomebrewAbvInput = {
  /** Original Gravity (SG), e.g. 1.050 */
  og: number
  /** Final Gravity (SG), e.g. 1.010 */
  fg: number
}

export type DilutionInput = {
  /** Current ABV percentage (0–100) */
  currentAbv: number
  /** Current volume in litres */
  currentVolumeL: number
  /** Target ABV percentage (0–currentAbv) */
  targetAbv: number
}

export type DilutionResult = {
  waterToAddL: number
  finalVolumeL: number
}

/**
 * Calculates estimated Alcohol By Volume using the standard homebrewing
 * approximation: ABV ≈ (OG − FG) × 131.25
 *
 * Returns 0 when OG ≤ FG (fermentation has not started or values are invalid).
 */
export function calculateAbv(og: number, fg: number): number {
  if (og <= fg) return 0
  const raw = (og - fg) * 131.25
  // Round to 2 decimal places for display
  return Math.round(raw * 100) / 100
}

/**
 * Calculates how much water (in litres) must be added to dilute a batch from
 * `currentAbv` to `targetAbv`.
 *
 * Uses the dilution formula (C1 × V1 = C2 × V2):
 *   finalVolumeL = (currentAbv / targetAbv) × currentVolumeL
 *   waterToAddL  = finalVolumeL − currentVolumeL
 *
 * Returns { waterToAddL: 0, finalVolumeL: currentVolumeL } when no dilution
 * is needed (targetAbv ≥ currentAbv) or when inputs are invalid.
 */
export function calculateDilution(
  currentAbv: number,
  currentVolumeL: number,
  targetAbv: number
): DilutionResult {
  if (
    targetAbv <= 0 ||
    targetAbv >= currentAbv ||
    currentVolumeL <= 0 ||
    currentAbv <= 0
  ) {
    return { waterToAddL: 0, finalVolumeL: currentVolumeL }
  }

  const finalVolumeL = (currentAbv / targetAbv) * currentVolumeL
  const waterToAddL = finalVolumeL - currentVolumeL

  return {
    waterToAddL: Math.round(waterToAddL * 100) / 100,
    finalVolumeL: Math.round(finalVolumeL * 100) / 100,
  }
}
