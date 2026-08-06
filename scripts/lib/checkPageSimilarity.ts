/**
 * Page Similarity Check
 *
 * Computes Jaccard similarity between two texts to detect when a generated
 * programmatic SEO draft is too similar to an existing page — preventing
 * low-quality duplicate content from being proposed.
 *
 * This is intentionally a pragmatic approximation (whitespace tokenization,
 * lowercase normalization) rather than a full NLP pipeline. The goal is to
 * catch "label-swapped" drafts, not to be a precise semantic similarity engine.
 * Both EN and KO content is handled correctly because the token set approach
 * is language-agnostic.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Tokenizes text into a Set of lowercase words by splitting on whitespace
 * and stripping leading/trailing punctuation from each token.
 * Zero-length tokens are discarded.
 *
 * Punctuation stripping prevents "easily." and "easily" from being treated as
 * different tokens — a practical improvement for the "明らかに重複している"
 * (obviously duplicate) detection goal.
 */
function tokenize(text: string): Set<string> {
  const tokens = new Set<string>()
  for (const raw of text.toLowerCase().split(/\s+/)) {
    // Strip leading and trailing non-alphanumeric characters
    const token = raw.replace(/^[^a-z0-9가-힣]+|[^a-z0-9가-힣]+$/g, '')
    if (token.length > 0) {
      tokens.add(token)
    }
  }
  return tokens
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Computes Jaccard similarity (|intersection| / |union|) between two texts,
 * using whitespace-tokenized word sets.
 *
 * Special cases:
 * - Both texts empty → 0.0 (no meaningful comparison)
 * - One text empty → 0.0 (no shared tokens)
 * - Identical non-empty texts → 1.0
 *
 * The result is always in [0, 1].
 */
export function computeJaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA)
  const setB = tokenize(textB)

  if (setA.size === 0 && setB.size === 0) {
    return 0
  }

  let intersectionSize = 0
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize
  if (unionSize === 0) {
    return 0
  }

  return intersectionSize / unionSize
}

/**
 * Returns true when `draftText` is sufficiently different from `existingText`.
 *
 * "Passes" (returns true) when Jaccard similarity < threshold.
 * "Fails"  (returns false) when Jaccard similarity >= threshold.
 *
 * Default threshold is 0.7: drafts sharing ≥70% of their word-token vocabulary
 * with the existing page are flagged as too similar to be useful variants.
 *
 * Usage: a return value of false signals that the draft should be retried with
 * stronger differentiation instructions, or discarded.
 */
export function passesSimilarityGuardrail(
  draftText: string,
  existingText: string,
  threshold: number = 0.7
): boolean {
  return computeJaccardSimilarity(draftText, existingText) < threshold
}
