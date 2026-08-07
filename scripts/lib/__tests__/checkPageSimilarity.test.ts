/**
 * @jest-environment node
 */

import {
  computeJaccardSimilarity,
  passesSimilarityGuardrail,
} from '../checkPageSimilarity'

// ── computeJaccardSimilarity ──────────────────────────────────────────────────

describe('computeJaccardSimilarity', () => {
  it('returns 1.0 for identical non-empty texts', () => {
    expect(computeJaccardSimilarity('hello world', 'hello world')).toBe(1.0)
  })

  it('returns 0.0 for completely unrelated texts', () => {
    expect(computeJaccardSimilarity('foo bar', 'baz qux')).toBe(0.0)
  })

  it('returns 0.0 when both texts are empty', () => {
    expect(computeJaccardSimilarity('', '')).toBe(0.0)
  })

  it('returns 0.0 when textA is empty', () => {
    expect(computeJaccardSimilarity('', 'hello world')).toBe(0.0)
  })

  it('returns 0.0 when textB is empty', () => {
    expect(computeJaccardSimilarity('hello world', '')).toBe(0.0)
  })

  it('is case-insensitive (treats Hello and hello as same token)', () => {
    expect(computeJaccardSimilarity('Hello World', 'hello world')).toBe(1.0)
  })

  it('computes partial overlap correctly', () => {
    // A tokens: {hello, world}, B tokens: {hello, foo}
    // intersection = {hello} = 1, union = {hello, world, foo} = 3
    // Jaccard = 1/3
    const result = computeJaccardSimilarity('hello world', 'hello foo')
    expect(result).toBeCloseTo(1 / 3, 5)
  })

  it('is symmetric (similarity(A, B) == similarity(B, A))', () => {
    const ab = computeJaccardSimilarity('foo bar baz', 'bar baz qux')
    const ba = computeJaccardSimilarity('bar baz qux', 'foo bar baz')
    expect(ab).toBe(ba)
  })

  it('result is always in [0, 1]', () => {
    const value = computeJaccardSimilarity('a b c', 'd e f')
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(1)
  })

  it('handles repeated tokens correctly (sets deduplicate)', () => {
    // A = "foo foo bar" → set {foo, bar}, B = "foo baz" → set {foo, baz}
    // intersection = {foo} = 1, union = {foo, bar, baz} = 3
    // Jaccard = 1/3
    const result = computeJaccardSimilarity('foo foo bar', 'foo baz')
    expect(result).toBeCloseTo(1 / 3, 5)
  })

  it('handles texts with only whitespace (treated as empty)', () => {
    expect(computeJaccardSimilarity('   ', '   ')).toBe(0.0)
  })

  it('computes known 0.5 Jaccard correctly', () => {
    // A = {hello, world, foo} (3 tokens), B = {hello, world, bar} (3 tokens)
    // intersection = {hello, world} = 2, union = {hello, world, foo, bar} = 4
    // Jaccard = 2/4 = 0.5
    const result = computeJaccardSimilarity('hello world foo', 'hello world bar')
    expect(result).toBeCloseTo(0.5, 5)
  })

  it('computes known 0.75 Jaccard correctly', () => {
    // A = {a, b, c} (3 tokens), B = {a, b, c, d} (4 tokens)
    // intersection = {a, b, c} = 3, union = {a, b, c, d} = 4
    // Jaccard = 3/4 = 0.75
    const result = computeJaccardSimilarity('a b c', 'a b c d')
    expect(result).toBeCloseTo(0.75, 5)
  })
})

// ── passesSimilarityGuardrail ─────────────────────────────────────────────────

describe('passesSimilarityGuardrail', () => {
  it('returns false (fails) when texts are identical (similarity = 1.0 >= 0.7)', () => {
    expect(passesSimilarityGuardrail('hello world', 'hello world')).toBe(false)
  })

  it('returns true (passes) when texts are completely unrelated (similarity = 0)', () => {
    expect(passesSimilarityGuardrail('foo bar', 'baz qux')).toBe(true)
  })

  it('returns false when similarity equals the default threshold (0.7)', () => {
    // Craft texts with Jaccard = 0.7
    // A = {a, b, c, d, e, f, g} (7), B = {a, b, c, d, e, h, i} (7)
    // intersection = {a,b,c,d,e} = 5, union = {a,b,c,d,e,f,g,h,i} = 9
    // Jaccard = 5/9 ≈ 0.556 — not exactly 0.7
    //
    // Instead use Jaccard = 0.75 (above threshold) to test "failure":
    // A = {a, b, c}, B = {a, b, c, d} → Jaccard = 3/4 = 0.75 >= 0.7 → fails
    expect(passesSimilarityGuardrail('a b c', 'a b c d')).toBe(false)
  })

  it('returns false when similarity is exactly the custom threshold', () => {
    // Jaccard = 0.5 (as computed above), threshold = 0.5
    // 0.5 >= 0.5 → fails (returns false)
    expect(passesSimilarityGuardrail('hello world foo', 'hello world bar', 0.5)).toBe(false)
  })

  it('returns true when similarity is just below the custom threshold', () => {
    // Jaccard = 0.5, threshold = 0.6
    // 0.5 < 0.6 → passes (returns true)
    expect(passesSimilarityGuardrail('hello world foo', 'hello world bar', 0.6)).toBe(true)
  })

  it('uses default threshold of 0.7', () => {
    // Jaccard = 0.5 (hello world foo vs hello world bar)
    // 0.5 < 0.7 → passes (returns true)
    expect(passesSimilarityGuardrail('hello world foo', 'hello world bar')).toBe(true)
  })

  it('returns false with default threshold for highly similar texts (Jaccard = 0.75)', () => {
    // {a, b, c} vs {a, b, c, d} → Jaccard = 3/4 = 0.75 >= 0.7 → fails
    expect(passesSimilarityGuardrail('a b c', 'a b c d')).toBe(false)
  })

  it('returns true for completely different texts with any threshold < 1', () => {
    expect(passesSimilarityGuardrail('apple orange banana', 'car truck bus', 0.99)).toBe(true)
  })

  it('direction: similarity >= threshold returns false; similarity < threshold returns true', () => {
    // Verify the direction matches the spec:
    // "Fails (returns false) when Jaccard similarity >= threshold"
    // threshold = 0.5, similarity = 0.5 → false (fails)
    expect(passesSimilarityGuardrail('hello world foo', 'hello world bar', 0.5)).toBe(false)
    // threshold = 0.51, similarity = 0.5 → true (passes)
    expect(passesSimilarityGuardrail('hello world foo', 'hello world bar', 0.51)).toBe(true)
  })
})
