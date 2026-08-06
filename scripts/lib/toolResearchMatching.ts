/**
 * Tool Research Matching
 *
 * Utilities for finding GSC queries that are not covered by any existing tool,
 * and for classifying those queries by SGE (AI Overview) zero-click risk using
 * a two-stage approach:
 *   1. Rule-based classification (fast, no API cost) — handles clear-cut patterns.
 *   2. AI fallback handled by the caller (generate-tool-research-spec.ts) for
 *      'unknown' results — this module only provides the rule-based stage.
 *
 * Follows the same pattern as classifyIntent.ts (rule-based first, AI for ambiguous).
 */

import type { ToolConfig } from '../../src/types/tool'
import type { ProcessedQuery } from '../process-analytics'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UnmatchedQuery {
  query: string
  impressions: number
}

export interface SgeRiskPatterns {
  zeroClickPatterns: string[]
  interactionNeededPatterns: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a vocabulary set from all tools' keywords and title words.
 *
 * Includes:
 *   - Full keyword phrases (keywords.en and keywords.ko), lowercased
 *   - Individual words from title.en (lowercased, min 3 chars to skip noise)
 *   - Individual words from title.ko (lowercased, min 2 chars)
 */
function buildToolVocabulary(tools: ToolConfig[]): Set<string> {
  const vocab = new Set<string>()

  for (const tool of tools) {
    // Full keyword phrases
    for (const kw of tool.keywords.en) {
      const normalized = kw.toLowerCase().trim()
      if (normalized) vocab.add(normalized)
    }
    for (const kw of tool.keywords.ko) {
      const normalized = kw.toLowerCase().trim()
      if (normalized) vocab.add(normalized)
    }

    // Individual title words (skip very short words that cause false positives)
    for (const word of tool.title.en.toLowerCase().split(/\s+/)) {
      if (word.length >= 3) vocab.add(word)
    }
    for (const word of tool.title.ko.toLowerCase().split(/\s+/)) {
      if (word.length >= 2) vocab.add(word)
    }
  }

  return vocab
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Finds queries from GSC data that are not matched by any existing tool's
 * keywords or title terms.
 *
 * Matching strategy (simple substring inclusion — single pass, no stemming):
 *   A query is considered "matched" if any vocabulary term appears as a
 *   substring of the query (case-insensitive), OR if the query appears as a
 *   substring of any vocabulary term.
 *
 * Deduplication: multiple ProcessedQuery rows for the same query string
 * (different countries/devices/pages) are aggregated — their impressions are
 * summed. Only queries with total impressions >= minImpressions are considered.
 *
 * @param queries         Flat list of ProcessedQuery records (one row per
 *                        query×page×country×device combination)
 * @param tools           All ToolConfig entries from tools-config.ts
 * @param minImpressions  Minimum total impressions for a query to be included
 *                        (default 10). Queries with fewer impressions are too
 *                        low-signal to act on.
 * @returns               Deduplicated list of unmatched queries sorted by
 *                        impressions descending.
 */
export function findUnmatchedQueries(
  queries: ProcessedQuery[],
  tools: ToolConfig[],
  minImpressions: number = 10
): UnmatchedQuery[] {
  const vocab = buildToolVocabulary(tools)

  // Aggregate impressions by query string
  const impressionsByQuery = new Map<string, number>()
  for (const row of queries) {
    const current = impressionsByQuery.get(row.query) ?? 0
    impressionsByQuery.set(row.query, current + row.impressions)
  }

  // Filter and classify
  const results: UnmatchedQuery[] = []

  for (const [query, impressions] of impressionsByQuery) {
    if (impressions < minImpressions) continue

    const queryLow = query.toLowerCase()
    let isMatched = false

    for (const term of vocab) {
      if (queryLow.includes(term) || term.includes(queryLow)) {
        isMatched = true
        break
      }
    }

    if (!isMatched) {
      results.push({ query, impressions })
    }
  }

  // Sort by impressions descending — highest signal first
  results.sort((a, b) => b.impressions - a.impressions)

  return results
}

/**
 * Classifies a query's SGE (AI Overview) zero-click risk using rule-based
 * pattern matching. Called before the AI fallback — handles clear-cut cases.
 *
 * Priority order (first match wins):
 *   1. zeroClickPatterns → 'high'   (AI Overview will absorb these clicks)
 *   2. interactionNeededPatterns → 'low'  (user needs to interact, AI can't replace)
 *   3. No match → 'unknown'         (caller should use AI batch classification)
 *
 * Matching is case-insensitive substring inclusion.
 */
export function classifySgeRiskByRules(
  query: string,
  patterns: SgeRiskPatterns
): 'low' | 'high' | 'unknown' {
  const queryLow = query.toLowerCase()

  for (const pattern of patterns.zeroClickPatterns) {
    if (queryLow.includes(pattern.toLowerCase())) {
      return 'high'
    }
  }

  for (const pattern of patterns.interactionNeededPatterns) {
    if (queryLow.includes(pattern.toLowerCase())) {
      return 'low'
    }
  }

  return 'unknown'
}
