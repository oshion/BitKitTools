/**
 * generate-title-variant.ts
 *
 * Module (not a standalone CLI) that generates title/description A/B candidates
 * for a given page via the Anthropic API, then validates each candidate against
 * hard guardrails before returning.
 *
 * Designed to be called by the orchestration script (run-title-experiment.ts).
 * It does NOT read config files or write output — all I/O is the caller's job.
 *
 * Retry logic:
 *   - Up to MAX_RETRIES additional attempts when all parsed variants fail
 *     validation. Violation messages are fed back to the model as context.
 *   - Returns an empty array (without throwing) when no valid variant is
 *     produced — the caller should treat this as "skip this page this week".
 *
 * API call pattern follows generate-report.ts exactly:
 *   fetch + ANTHROPIC_API_URL / ANTHROPIC_API_VERSION / MODEL constants,
 *   inline prompt (no external prompts/*.md files), same error handling.
 */

import type { LocalizedText } from '../src/types/tool'
import { extractAnthropicText } from './lib/anthropicResponse'
import {
  validateTitleVariant,
  type TitleVariant,
  type ValidationResult,
} from './lib/validateTitleVariant'

// Re-export so callers only need one import
export type { TitleVariant }

// ── Constants ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'

/** Number of variants to request from the model per call. */
const VARIANTS_PER_CALL = 3

/** Maximum number of retry attempts after validation failure (not counting the first attempt). */
const MAX_RETRIES = 2

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TitleVariantRequest {
  /** Page slug or URL identifier — used in log messages. */
  page: string
  currentTitle: LocalizedText
  currentDescription: LocalizedText
  /** Tool name keyword required in EN and KO titles respectively. */
  requiredKeywords: { en: string; ko: string }
  /**
   * Short plain-text explanation of why this page was selected as a candidate
   * (e.g. "CTR 2.1% at position 4, benchmark expects 4.0%"). Included verbatim
   * in the generation prompt as evidence.
   */
  ctrEvidence: string
}

// ── Parsing ───────────────────────────────────────────────────────────────────

/**
 * Parses the delimited API response text into an array of TitleVariant objects.
 *
 * Expected format:
 *
 *   ===VARIANT 1===
 *   TITLE_EN: <English title>
 *   TITLE_KO: <Korean title>
 *   DESC_EN: <English description>
 *   DESC_KO: <Korean description>
 *   ===VARIANT 2===
 *   ...
 *   ===END===
 *
 * Variants that are missing any of the four required fields are silently
 * skipped so that partial output from the model does not crash the pipeline.
 *
 * Exported as a pure function so it can be unit-tested without any network
 * calls.
 */
export function parseVariantsFromResponse(text: string): TitleVariant[] {
  const variants: TitleVariant[] = []

  // Split on "===VARIANT N===" delimiters; the first element is everything
  // before the first delimiter (usually empty or preamble text) and is ignored.
  const blocks = text.split(/===VARIANT\s+\d+===/)

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i] ?? ''
    // Ignore anything at or after ===END===
    const cleanBlock = block.split(/===END===/)[0] ?? ''

    const titleEn = extractLineField(cleanBlock, 'TITLE_EN')
    const titleKo = extractLineField(cleanBlock, 'TITLE_KO')
    const descEn = extractLineField(cleanBlock, 'DESC_EN')
    const descKo = extractLineField(cleanBlock, 'DESC_KO')

    if (titleEn && titleKo && descEn && descKo) {
      variants.push({
        title: { en: titleEn, ko: titleKo },
        description: { en: descEn, ko: descKo },
      })
    }
  }

  return variants
}

/**
 * Extracts the value of a single-line field from a text block.
 *
 * Example: `extractLineField("TITLE_EN: My Tool\n...", "TITLE_EN")` → `"My Tool"`
 *
 * Returns an empty string when the field is absent or has no value after the
 * colon.
 */
function extractLineField(block: string, fieldName: string): string {
  const regex = new RegExp(`^${fieldName}:\\s*(.+)$`, 'm')
  const match = block.match(regex)
  return match?.[1]?.trim() ?? ''
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildPrompt(request: TitleVariantRequest, violationFeedback?: string): string {
  const feedbackSection = violationFeedback
    ? `\n## Previous attempt violations — fix all of these\n\n${violationFeedback}\n`
    : ''

  return `You are an SEO specialist writing title and meta description A/B test variants for BitKitTools.com, a micro-calculator utility site targeting English-speaking and Korean-speaking users.

Generate ${VARIANTS_PER_CALL} meaningfully different title/description variants for the page listed below.

## Current page metadata

Page: ${request.page}
Current EN title: ${request.currentTitle.en}
Current KO title: ${request.currentTitle.ko}
Current EN description: ${request.currentDescription.en}
Current KO description: ${request.currentDescription.ko}

## Why this page was selected for testing

${request.ctrEvidence}
${feedbackSection}
## Mandatory rules — violations will cause automatic rejection

1. EN title must be ≤${60} characters (count carefully before submitting)
2. KO title must be ≤${60} characters
3. EN description must be ≤${155} characters
4. KO description must be ≤${155} characters
5. EN title MUST contain the keyword: "${request.requiredKeywords.en}" (case-insensitive)
6. KO title MUST contain the keyword: "${request.requiredKeywords.ko}"
7. Do NOT use any of the following banned expressions anywhere in the output:
   - English: #1, number one, best, perfect, perfectly, ultimate, guaranteed, 100% accurate, 100% correct, 100% exact, 100% precise, 100% reliable
   - Korean: 1위, 최고, 완벽, 보장, 100% 정확, 정확도 100%
8. Each variant must be meaningfully different from the others and from the current title
9. Focus on user benefit, accuracy, and discoverability — not marketing hype

## Output format

Use EXACTLY the delimiter lines shown below. Do not add any text before ===VARIANT 1===.

===VARIANT 1===
TITLE_EN: <English title, ≤60 chars>
TITLE_KO: <Korean title, ≤60 chars>
DESC_EN: <English description, ≤155 chars>
DESC_KO: <Korean description, ≤155 chars>
===VARIANT 2===
TITLE_EN: <English title, ≤60 chars>
TITLE_KO: <Korean title, ≤60 chars>
DESC_EN: <English description, ≤155 chars>
DESC_KO: <Korean description, ≤155 chars>
===VARIANT 3===
TITLE_EN: <English title, ≤60 chars>
TITLE_KO: <Korean title, ≤60 chars>
DESC_EN: <English description, ≤155 chars>
DESC_KO: <Korean description, ≤155 chars>
===END===`
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates validated title/description variants for a page via the Claude API.
 *
 * Behaviour:
 * - Calls the API to produce up to VARIANTS_PER_CALL candidates.
 * - Validates each candidate with `validateTitleVariant`.
 * - If some candidates pass and others fail, returns the passing ones immediately.
 * - If ALL candidates fail, feeds the violation messages back to the model and
 *   retries (up to MAX_RETRIES times).
 * - Returns `[]` (without throwing) when:
 *     - The API returns an error or empty response
 *     - No parseable variants were produced after all retries
 *     - All variants remain invalid after all retries
 *
 * @param request - Page metadata and context for the generation prompt.
 * @param apiKey - Anthropic API key (`ANTHROPIC_API_KEY`).
 */
export async function generateTitleVariants(
  request: TitleVariantRequest,
  apiKey: string
): Promise<TitleVariant[]> {
  let violationFeedback: string | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const prompt = buildPrompt(request, violationFeedback)

    // ── API call ─────────────────────────────────────────────────────────────

    let responseText: string
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '(unreadable)')
        console.error(
          `[generate-title-variant] Anthropic API error ${response.status} for "${request.page}": ${errorText}`
        )
        return []
      }

      const json = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>
      }
      responseText = extractAnthropicText(json)

      if (!responseText.trim()) {
        console.error(
          `[generate-title-variant] Anthropic API returned empty response for "${request.page}". Raw: ${JSON.stringify(json)}`
        )
        return []
      }
    } catch (err) {
      console.error(
        `[generate-title-variant] Network error calling Anthropic API for "${request.page}":`,
        err
      )
      return []
    }

    // ── Parsing ───────────────────────────────────────────────────────────────

    const parsed = parseVariantsFromResponse(responseText)

    if (parsed.length === 0) {
      console.warn(
        `[generate-title-variant] No variants parsed for "${request.page}" (attempt ${attempt + 1}/${MAX_RETRIES + 1}).`
      )
      violationFeedback =
        'Previous response contained no parseable variants. ' +
        'You must use the exact delimiter format: ===VARIANT N=== ... ===END==='
      continue
    }

    // ── Validation ────────────────────────────────────────────────────────────

    const validVariants: TitleVariant[] = []
    const allViolations: string[] = []

    for (const variant of parsed) {
      const result: ValidationResult = validateTitleVariant(variant, request.requiredKeywords)
      if (result.valid) {
        validVariants.push(variant)
      } else {
        allViolations.push(...result.violations)
      }
    }

    if (validVariants.length > 0) {
      if (allViolations.length > 0) {
        console.warn(
          `[generate-title-variant] ${validVariants.length}/${parsed.length} variants passed validation for "${request.page}" (attempt ${attempt + 1}).`
        )
      }
      return validVariants
    }

    // All variants failed — prepare feedback for next attempt
    if (attempt < MAX_RETRIES) {
      console.warn(
        `[generate-title-variant] All ${parsed.length} variants failed validation for "${request.page}" ` +
          `(attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying with violation feedback.`
      )
      violationFeedback = allViolations.join('\n')
    } else {
      console.error(
        `[generate-title-variant] Giving up on "${request.page}" after ${MAX_RETRIES + 1} attempts — ` +
          `all variants failed validation. Skipping this page.`
      )
    }
  }

  return []
}
