/**
 * Baby Temperament Type Quiz — Scoring Logic
 *
 * Pure functions: no side-effects, no fetch calls.
 *
 * Reference:
 *   Thomas A, Chess S. Temperament and Development. New York: Brunner/Mazel; 1977.
 */

import type { Axis } from '@/lib/config/temperamentQuestions'

export type { Axis }

export type ActivityResult = 'active' | 'calm'
export type SocialResult = 'social' | 'shy'
export type AdaptabilityResult = 'flexible' | 'cautious'
export type ReactivityResult = 'expressive' | 'mellow'

export type AxisResult = {
  activity: ActivityResult
  social: SocialResult
  adaptability: AdaptabilityResult
  reactivity: ReactivityResult
}

export type QuizAnswer = {
  axis: Axis
  /** The pole string selected by the user (e.g. 'active', 'calm') */
  pole: string
}

// ---------------------------------------------------------------------------
// Valid pole values per axis — used for defensive validation
// ---------------------------------------------------------------------------

const VALID_POLES: Record<Axis, readonly string[]> = {
  activity: ['active', 'calm'],
  social: ['social', 'shy'],
  adaptability: ['flexible', 'cautious'],
  reactivity: ['expressive', 'mellow'],
}

// Default winning pole when no valid answers exist for an axis
const DEFAULT_POLES: AxisResult = {
  activity: 'active',
  social: 'social',
  adaptability: 'flexible',
  reactivity: 'expressive',
}

/**
 * Scores a set of quiz answers and returns one winning pole per axis.
 *
 * Algorithm:
 * - For each axis, count how many answers selected each pole.
 * - The pole with more votes wins.
 * - Tiebreak (equal votes or zero valid answers): alphabetical order of the
 *   two valid poles for that axis — this is deterministic and never throws.
 *
 * The quiz uses 5 questions per axis (an odd number), so a true tie
 * cannot occur in a complete, valid 20-question session. The tiebreak
 * logic is purely defensive for partial or malformed input.
 */
export function scoreQuiz(answers: QuizAnswer[]): AxisResult {
  type VoteMap = Record<string, number>

  const votes: Record<Axis, VoteMap> = {
    activity: {},
    social: {},
    adaptability: {},
    reactivity: {},
  }

  for (const answer of answers) {
    const validPoles = VALID_POLES[answer.axis]
    if (!validPoles.includes(answer.pole)) continue // ignore invalid poles

    const current = votes[answer.axis][answer.pole] ?? 0
    votes[answer.axis][answer.pole] = current + 1
  }

  function winningPole<T extends string>(
    axis: Axis,
    poles: readonly [T, T],
    defaultValue: T
  ): T {
    const [poleA, poleB] = poles
    const countA = votes[axis][poleA] ?? 0
    const countB = votes[axis][poleB] ?? 0

    if (countA === 0 && countB === 0) return defaultValue
    if (countA > countB) return poleA
    if (countB > countA) return poleB
    // Exact tie — use alphabetical order for determinism
    return poleA < poleB ? poleA : poleB
  }

  return {
    activity: winningPole<ActivityResult>('activity', ['active', 'calm'], DEFAULT_POLES.activity),
    social: winningPole<SocialResult>('social', ['social', 'shy'], DEFAULT_POLES.social),
    adaptability: winningPole<AdaptabilityResult>(
      'adaptability',
      ['flexible', 'cautious'],
      DEFAULT_POLES.adaptability
    ),
    reactivity: winningPole<ReactivityResult>(
      'reactivity',
      ['expressive', 'mellow'],
      DEFAULT_POLES.reactivity
    ),
  }
}

/**
 * Converts an AxisResult to a persona code string.
 *
 * Code format: `${activity}-${social}-${adaptability}-${reactivity}`
 * Example: 'active-social-flexible-expressive'
 *
 * This format is canonical and must match the `code` field in
 * `lib/config/temperamentPersonas.ts`.
 */
export function getPersonaCode(result: AxisResult): string {
  return `${result.activity}-${result.social}-${result.adaptability}-${result.reactivity}`
}
