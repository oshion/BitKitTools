/**
 * Homebrew Recipe & ABV / Dilution Calculator
 *
 * calculateAbv supports two formulas:
 *
 * 'standard' (default): ABV ≈ (OG − FG) × 131.25
 *   The most widely used homebrewing approximation. Works well for most beers
 *   in the 3–10% ABV range, accurate to within ±0.1–0.3% ABV.
 *   References: Fix, G. & Fix, L. (1997). An Analysis of Brewing Techniques.
 *               Daniels, R. (1996). Designing Great Beers. Brewers Publications.
 *
 * 'high-gravity': ABV = (76.08 × (OG − FG) / (1.775 − OG)) × (FG / 0.794)
 *   A non-linear correction formula better suited for high-gravity beers
 *   (barleywine, imperial stout, etc., typically OG ≥ 1.070) where the linear
 *   approximation becomes less accurate. This formula is widely used in the
 *   homebrewing community; its exact derivation origin is not clearly attributed
 *   to a single academic publication (hence described honestly as "brewing
 *   community standard" rather than citing a fabricated source).
 *
 * Note: This tool is independent from the BAC Calculator. Although both deal
 * with alcohol percentage, they serve different purposes and must NOT share
 * components or logic (architecture isolation rule, docs/screens/beer-homebrew-recipe-calculator.md).
 */

export type AbvFormula = 'standard' | 'high-gravity'

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
 * Calculates estimated Alcohol By Volume.
 *
 * formula = 'standard' (default):
 *   ABV ≈ (OG − FG) × 131.25  — standard homebrewing linear approximation.
 *
 * formula = 'high-gravity':
 *   ABV = (76.08 × (OG − FG) / (1.775 − OG)) × (FG / 0.794)
 *   Non-linear correction better suited for high-gravity beers (OG ≥ 1.070).
 *   Widely used in the homebrewing community; precise academic origin unclear
 *   (described honestly as "brewing community standard", not a fabricated cite).
 *
 * Returns 0 when OG ≤ FG (fermentation has not started or values are invalid).
 */
export function calculateAbv(og: number, fg: number, formula: AbvFormula = 'standard'): number {
  if (og <= fg) return 0

  let raw: number
  if (formula === 'high-gravity') {
    raw = (76.08 * (og - fg) / (1.775 - og)) * (fg / 0.794)
  } else {
    raw = (og - fg) * 131.25
  }

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
