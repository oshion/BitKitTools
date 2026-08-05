/**
 * Search Intent Classifier
 *
 * Two-stage classification:
 *   1. Rule-based (fast, no cost) — handles clear-cut patterns first.
 *   2. AI fallback via Anthropic Messages API — batch-processes ambiguous queries
 *      in a single call. Fails soft: any API / parse error returns 'ambiguous'.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type SearchIntent = 'tool' | 'tutorial' | 'comparison' | 'problem-solving'
export type IntentClassification = SearchIntent | 'ambiguous'

// ── Rule-Based Classifier ─────────────────────────────────────────────────────

/**
 * Priority order (first match wins when a query matches multiple categories):
 *   1. tool
 *   2. tutorial
 *   3. comparison
 *   4. problem-solving
 *   5. ambiguous (no match)
 */
const RULES: Array<{ intent: SearchIntent; patterns: RegExp }> = [
  {
    intent: 'tool',
    patterns:
      /calculator|converter|generator|decoder|formatter|checker|계산기|변환기|생성기|디코더/i,
  },
  {
    intent: 'tutorial',
    patterns: /how to|tutorial|guide|사용법|방법/i,
  },
  {
    intent: 'comparison',
    patterns: / vs | vs\.|compare|비교|차이/i,
  },
  {
    intent: 'problem-solving',
    patterns: /fix|error|not working|안됨|안돼|오류|문제/i,
  },
]

export function classifyIntentRuleBased(query: string): IntentClassification {
  for (const { intent, patterns } of RULES) {
    if (patterns.test(query)) {
      return intent
    }
  }
  return 'ambiguous'
}

// ── AI Fallback (Batch) ────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'

/**
 * Classifies ambiguous queries using the Anthropic Messages API.
 *
 * - All queries are sent in a single batch request (not one call per query).
 * - Returns a Map<query, IntentClassification>.
 * - Fails soft: any network error, non-ok HTTP response, or JSON parse failure
 *   results in every query being returned as 'ambiguous' — the caller should
 *   proceed rather than crashing the report pipeline.
 * - If `queries` is empty, returns an empty Map immediately without calling the API.
 */
export async function classifyAmbiguousQueries(
  queries: string[],
  apiKey: string
): Promise<Map<string, SearchIntent | 'ambiguous'>> {
  if (queries.length === 0) {
    return new Map()
  }

  const numbered = queries.map((q, i) => `${i + 1}. ${q}`).join('\n')

  const prompt = `You are a search intent classifier. Classify each query below into exactly one of these categories:
- tool (user wants a calculator, converter, generator, or similar utility)
- tutorial (user wants to learn how to do something)
- comparison (user is comparing options)
- problem-solving (user has a problem or error to fix)
- ambiguous (none of the above clearly applies)

Queries:
${numbered}

Respond with ONLY a JSON object mapping each query string (exactly as given) to its category. No explanation, no markdown, no extra text — just the JSON object.
Example format: {"query text here": "tool", "another query": "tutorial"}`

  let rawText: string
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
        `[classifyIntent] Anthropic API error ${response.status}: ${errorText}`
      )
      return buildAmbiguousMap(queries)
    }

    const json = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    rawText = json.content?.[0]?.text ?? ''
  } catch (err) {
    console.error('[classifyIntent] Network error calling Anthropic API:', err)
    return buildAmbiguousMap(queries)
  }

  // Lenient parse: extract the first {...} block from the response
  const match = rawText.match(/\{[\s\S]*\}/)
  if (!match) {
    console.error('[classifyIntent] Could not find JSON object in API response:', rawText)
    return buildAmbiguousMap(queries)
  }

  let parsed: Record<string, string>
  try {
    parsed = JSON.parse(match[0]) as Record<string, string>
  } catch (err) {
    console.error('[classifyIntent] Failed to parse JSON from API response:', err)
    return buildAmbiguousMap(queries)
  }

  const VALID_INTENTS = new Set<string>([
    'tool',
    'tutorial',
    'comparison',
    'problem-solving',
    'ambiguous',
  ])

  const result = new Map<string, SearchIntent | 'ambiguous'>()
  for (const query of queries) {
    const raw = parsed[query]
    if (typeof raw === 'string' && VALID_INTENTS.has(raw)) {
      result.set(query, raw as SearchIntent | 'ambiguous')
    } else {
      result.set(query, 'ambiguous')
    }
  }
  return result
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAmbiguousMap(queries: string[]): Map<string, 'ambiguous'> {
  const map = new Map<string, 'ambiguous'>()
  for (const q of queries) {
    map.set(q, 'ambiguous')
  }
  return map
}
