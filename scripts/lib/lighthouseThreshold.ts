/**
 * Lighthouse Score Threshold Utilities (Pure Functions)
 *
 * Provides types and a pure function to detect Lighthouse category scores
 * that fall below a given threshold.
 *
 * The threshold value is always passed as an argument — never hardcoded here —
 * so callers can adjust it without modifying this file.
 */

export interface PageLighthouseScore {
  url: string
  performance: number // 0-100 (integer, rounded from 0-1 score)
  accessibility: number
  bestPractices: number
  seo: number
}

export interface FlaggedCategory {
  url: string
  category: 'performance' | 'accessibility' | 'bestPractices' | 'seo'
  score: number
}

/**
 * Returns all (url, category) pairs where `score < threshold`.
 *
 * - score === threshold is treated as passing (not flagged).
 * - threshold is always supplied by the caller (default 90 at the call site).
 */
export function findScoresBelowThreshold(
  scores: PageLighthouseScore[],
  threshold: number
): FlaggedCategory[] {
  const flagged: FlaggedCategory[] = []

  for (const page of scores) {
    const categories = [
      { category: 'performance', score: page.performance },
      { category: 'accessibility', score: page.accessibility },
      { category: 'bestPractices', score: page.bestPractices },
      { category: 'seo', score: page.seo },
    ] as const

    for (const { category, score } of categories) {
      if (score < threshold) {
        flagged.push({ url: page.url, category, score })
      }
    }
  }

  return flagged
}
