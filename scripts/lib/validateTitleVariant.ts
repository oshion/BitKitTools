/**
 * validateTitleVariant.ts
 *
 * Pure functions that validate AI-generated title/description candidates against
 * hard guardrails before they are allowed into the A/B testing pipeline.
 *
 * Guardrails enforced here (in code, not just via prompt):
 *   1. SERP length limits — EN/KO title ≤60 chars, EN/KO description ≤155 chars
 *   2. Banned expressions — no exaggerated/absolutist marketing claims
 *   3. Required keyword presence — tool name must appear in EN and KO titles
 *
 * Violation messages are written to be directly usable as prompt feedback:
 * they are human-readable sentences that can be concatenated and sent back to
 * Claude as context for a retry, without requiring extra formatting.
 */

import type { LocalizedText } from '../../src/types/tool'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TitleVariant {
  title: LocalizedText
  description: LocalizedText
}

export interface ValidationResult {
  valid: boolean
  /** Human-readable violation messages. Usable as-is in a retry prompt. */
  violations: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Approximate SERP display limit for title tags (characters). */
export const MAX_TITLE_LENGTH = 60

/** Approximate SERP display limit for meta descriptions (characters). */
export const MAX_DESCRIPTION_LENGTH = 155

/**
 * Banned expressions applied to all four text fields (EN title, KO title,
 * EN description, KO description).
 *
 * Covers:
 *   - Rank/position claims: "#1", "number one", "1위"
 *   - Superlatives that assert superiority: "best", "ultimate", "최고"
 *   - Absolute perfection claims: "perfect", "완벽"
 *   - Guarantees: "guaranteed", "보장"
 *   - Precision/accuracy absolutes: "100% accurate", "100% 정확", "정확도 100%"
 *
 * Patterns are ordered roughly from most to least common. All patterns are
 * case-insensitive where applicable to English text.
 */
export const BANNED_PATTERNS: RegExp[] = [
  // English: rank/position
  // Note: # is a non-word character so \b before it would never match;
  // we match from # directly and rely on \b after the digit instead.
  /#\s*1\b/i,
  /\bnumber[\s-]+one\b/i,

  // English: superlatives and absolutes
  /\bbest\b/i,
  /\bperfect(?:ly)?\b/i,
  /\bultimate\b/i,

  // English: guarantees
  /\bguarantee[ds]?\b/i,

  // English: accuracy absolutes
  /\b100\s*%\s*(?:accurate|correct|exact|precise|reliable)\b/i,

  // Korean: rank/position
  /1위/,

  // Korean: superlatives
  /최고/,
  /완벽/,

  // Korean: guarantees
  /보장/,

  // Korean: accuracy absolutes
  /100%\s*정확/,
  /정확도?\s*100%/,
]

// ── Validator ─────────────────────────────────────────────────────────────────

/**
 * Validates a single title/description variant against all guardrails.
 *
 * @param variant - The candidate title and description in EN and KO.
 * @param requiredKeywords - The tool keyword that must appear in the EN title
 *   (case-insensitive) and the KO title (exact substring match).
 * @returns A ValidationResult with `valid: true` only when all checks pass.
 *   Violations are human-readable and suitable for direct inclusion in a retry
 *   prompt as feedback.
 */
export function validateTitleVariant(
  variant: TitleVariant,
  requiredKeywords: { en: string; ko: string }
): ValidationResult {
  const violations: string[] = []

  // ── 1. Length checks ────────────────────────────────────────────────────────

  if (variant.title.en.length > MAX_TITLE_LENGTH) {
    violations.push(
      `EN title is too long (${variant.title.en.length} chars, max ${MAX_TITLE_LENGTH}): "${variant.title.en}"`
    )
  }

  if (variant.title.ko.length > MAX_TITLE_LENGTH) {
    violations.push(
      `KO title is too long (${variant.title.ko.length} chars, max ${MAX_TITLE_LENGTH}): "${variant.title.ko}"`
    )
  }

  if (variant.description.en.length > MAX_DESCRIPTION_LENGTH) {
    violations.push(
      `EN description is too long (${variant.description.en.length} chars, max ${MAX_DESCRIPTION_LENGTH}): "${variant.description.en}"`
    )
  }

  if (variant.description.ko.length > MAX_DESCRIPTION_LENGTH) {
    violations.push(
      `KO description is too long (${variant.description.ko.length} chars, max ${MAX_DESCRIPTION_LENGTH}): "${variant.description.ko}"`
    )
  }

  // ── 2. Banned expression checks ─────────────────────────────────────────────

  const fields: Array<[string, string]> = [
    ['EN title', variant.title.en],
    ['KO title', variant.title.ko],
    ['EN description', variant.description.en],
    ['KO description', variant.description.ko],
  ]

  for (const [fieldName, text] of fields) {
    for (const pattern of BANNED_PATTERNS) {
      const match = text.match(pattern)
      if (match) {
        violations.push(
          `${fieldName} contains banned expression "${match[0]}" — avoid exaggerated or absolutist claims: "${text}"`
        )
        // Report only the first violation per field to keep feedback readable
        break
      }
    }
  }

  // ── 3. Required keyword checks ───────────────────────────────────────────────

  if (!variant.title.en.toLowerCase().includes(requiredKeywords.en.toLowerCase())) {
    violations.push(
      `EN title must include the required keyword "${requiredKeywords.en}": "${variant.title.en}"`
    )
  }

  if (!variant.title.ko.includes(requiredKeywords.ko)) {
    violations.push(
      `KO title must include the required keyword "${requiredKeywords.ko}": "${variant.title.ko}"`
    )
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}
