/**
 * Standard Drinks / Alcohol Units Calculator
 *
 * Converts a drink's volume and ABV into pure alcohol grams and translates that
 * to "standard drinks" (or "units") according to country-specific definitions.
 *
 * Pure alcohol (g) = Volume (mL) × (ABV / 100) × 0.789 (ethanol density g/mL)
 * Standard drinks  = pureAlcoholGrams / GRAMS_PER_STANDARD_DRINK[standard]
 * Calories (kcal)  = pureAlcoholGrams × 7  (alcohol ≈ 7 kcal/g, Drinkaware method)
 *
 * ⚠️  YMYL notice:
 * This is a unit-conversion reference tool only. It does NOT assess fitness to
 * drive, legal BAC limits, or safe drinking amounts. disclaimerType: 'medical'.
 *
 * Country standard drink definitions (pure alcohol per drink):
 *   US      — 14 g   (NIAAA)
 *   UK      —  8 g   (NHS / Drinkaware)
 *   AU/SG   — 10 g   (Australian Department of Health)
 *   Canada  — 13.45g (CCSA)
 *
 * These definitions are published by each country's health authority and are
 * static values — no external API is required (CLAUDE.md rule 2).
 */

export type DrinkStandard = 'us' | 'uk' | 'au-sg' | 'canada'

/** Pure alcohol grams per one "standard drink" in each country's definition. */
export const GRAMS_PER_STANDARD_DRINK: Record<DrinkStandard, number> = {
  us: 14,
  uk: 8,
  'au-sg': 10,
  canada: 13.45,
}

/** Ethanol density (g/mL) — NIAAA / Drinkaware standard constant. */
const ETHANOL_DENSITY_G_PER_ML = 0.789

/** Caloric value of ethanol (kcal/g) — standard nutritional chemistry constant. */
const KCAL_PER_GRAM_ETHANOL = 7

export type StandardDrinksInput = {
  /** Volume of the drink in millilitres. */
  volumeMl: number
  /** Alcohol by volume percentage (e.g. 5 for 5%). */
  abvPercent: number
  /** Country-specific standard drink definition to use for conversion. */
  standard: DrinkStandard
}

export type StandardDrinksResult = {
  /** Pure alcohol content of this drink in grams (2 d.p.). */
  pureAlcoholGrams: number
  /** Number of standard drinks in the country's definition (2 d.p.). */
  standardDrinks: number
  /** Approximate calories from alcohol only, in kcal (2 d.p.). */
  caloriesKcal: number
}

/**
 * Converts a drink's volume and ABV into pure alcohol grams, standard drinks,
 * and approximate calories from alcohol.
 *
 * Returns all values rounded to 2 decimal places.
 */
export function calculateStandardDrinks(
  input: StandardDrinksInput,
): StandardDrinksResult {
  const { volumeMl, abvPercent, standard } = input

  // Guard: return zeros for degenerate inputs to avoid division by zero
  if (volumeMl <= 0 || abvPercent <= 0) {
    return { pureAlcoholGrams: 0, standardDrinks: 0, caloriesKcal: 0 }
  }

  const pureAlcoholGrams =
    Math.round(volumeMl * (abvPercent / 100) * ETHANOL_DENSITY_G_PER_ML * 100) / 100

  const gramsPerDrink = GRAMS_PER_STANDARD_DRINK[standard]
  const standardDrinks = Math.round((pureAlcoholGrams / gramsPerDrink) * 100) / 100

  const caloriesKcal = Math.round(pureAlcoholGrams * KCAL_PER_GRAM_ETHANOL * 100) / 100

  return { pureAlcoholGrams, standardDrinks, caloriesKcal }
}
