/**
 * Child Height Predictor
 *
 * Implements the Mid-Parental Height method from:
 * Tanner JM, Goldstein H, Whitehouse RH.
 * "Standards for children's height at ages 2–9 years allowing for heights of parents."
 * Archives of Disease in Childhood, 1970.
 *
 * The ±8.5cm range represents the 3rd–97th percentile of the expected adult height
 * (not a 68% confidence interval). This is the definition used in the original paper.
 */

export type Sex = 'male' | 'female'

export type HeightPredictionInput = {
  sex: Sex
  motherHeightCm: number
  fatherHeightCm: number
}

export type HeightPredictionResult = {
  predictedHeightCm: number
  rangeLowCm: number
  rangeHighCm: number
}

/**
 * Calculates the predicted adult height using the Mid-Parental Height method.
 *
 * Formulae (Tanner et al., 1970):
 *   Male:   (motherHeightCm + fatherHeightCm + 13) / 2
 *   Female: (motherHeightCm + fatherHeightCm − 13) / 2
 *
 * Range: ±8.5cm (3rd–97th percentile of expected adult height)
 */
export function calculateMidParentalHeight(
  input: HeightPredictionInput
): HeightPredictionResult {
  const { sex, motherHeightCm, fatherHeightCm } = input
  const offset = sex === 'male' ? 13 : -13
  const predictedHeightCm = (motherHeightCm + fatherHeightCm + offset) / 2
  return {
    predictedHeightCm,
    rangeLowCm: predictedHeightCm - 8.5,
    rangeHighCm: predictedHeightCm + 8.5,
  }
}

/**
 * Converts centimetres to feet and whole inches.
 * Handles the carry case where rounded inches = 12.
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  // Handle carry: e.g., 5'11.5" rounds to 5'12" → 6'0"
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 }
  }
  return { feet, inches }
}

/**
 * Converts feet and inches back to centimetres.
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches
  return totalInches * 2.54
}
