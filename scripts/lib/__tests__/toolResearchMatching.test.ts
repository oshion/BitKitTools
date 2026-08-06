/**
 * @jest-environment node
 */

import type { ToolConfig } from '../../../src/types/tool'
import type { ProcessedQuery } from '../../process-analytics'
import type { SgeRiskPatterns } from '../toolResearchMatching'
import {
  classifySgeRiskByRules,
  findUnmatchedQueries,
} from '../toolResearchMatching'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMinimalTool(overrides: {
  id?: string
  keywords_en?: string[]
  keywords_ko?: string[]
  title_en?: string
  title_ko?: string
}): ToolConfig {
  return {
    id: overrides.id ?? 'test-tool',
    slug: overrides.id ?? 'test-tool',
    category: 'developer',
    title: {
      en: overrides.title_en ?? 'Test Tool',
      ko: overrides.title_ko ?? '테스트 툴',
    },
    description: { en: 'desc', ko: '설명' },
    keywords: {
      en: overrides.keywords_en ?? [],
      ko: overrides.keywords_ko ?? [],
    },
    schemaType: 'WebApplication',
    faq: [],
    relatedToolIds: [],
    adSlots: [],
    ogImage: '/og/test.png',
    status: 'testing',
    disclaimerType: 'none',
    aiOverviewResistance: 'high',
    addedAt: '2026-01-01',
    popular: false,
  }
}

function makeQuery(overrides: Partial<ProcessedQuery> = {}): ProcessedQuery {
  return {
    query: 'test query',
    page: '/developer/json-formatter/',
    country: 'US',
    device: 'DESKTOP',
    impressions: 50,
    clicks: 5,
    ctr: 0.1,
    position: 5,
    ...overrides,
  }
}

const DEFAULT_PATTERNS: SgeRiskPatterns = {
  zeroClickPatterns: ['unit convert', 'what is', 'hex to decimal'],
  interactionNeededPatterns: ['upload', 'compare files', 'batch'],
}

// ── findUnmatchedQueries ──────────────────────────────────────────────────────

describe('findUnmatchedQueries', () => {
  it('returns empty array when no queries', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    const result = findUnmatchedQueries([], tools)
    expect(result).toEqual([])
  })

  it('excludes query that matches a tool keyword exactly', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    const queries = [makeQuery({ query: 'json formatter', impressions: 20 })]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(0)
  })

  it('excludes query that contains a tool keyword as substring', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    const queries = [makeQuery({ query: 'online json formatter tool', impressions: 20 })]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(0)
  })

  it('excludes query when tool keyword contains the query as substring', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter and validator'] })]
    const queries = [makeQuery({ query: 'json formatter', impressions: 20 })]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(0)
  })

  it('includes query that does not match any tool keyword', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter', 'password generator'] })]
    const queries = [makeQuery({ query: 'cocktail calorie calculator', impressions: 20 })]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(1)
    expect(result[0]!.query).toBe('cocktail calorie calculator')
  })

  it('excludes query with impressions below minImpressions threshold (default 10)', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    const queries = [makeQuery({ query: 'cocktail calculator', impressions: 5 })]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(0)
  })

  it('includes query with impressions exactly at minImpressions threshold', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    const queries = [makeQuery({ query: 'cocktail calculator', impressions: 10 })]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(1)
  })

  it('respects custom minImpressions', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    const queries = [makeQuery({ query: 'cocktail calculator', impressions: 25 })]
    const result = findUnmatchedQueries(queries, tools, 30)
    expect(result).toHaveLength(0)
  })

  it('aggregates impressions for same query across different rows', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    // Same query appearing from US and KR — each with 6 impressions (total 12 >= 10)
    const queries = [
      makeQuery({ query: 'cocktail calculator', country: 'US', impressions: 6 }),
      makeQuery({ query: 'cocktail calculator', country: 'KR', impressions: 6 }),
    ]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(1)
    expect(result[0]!.impressions).toBe(12)
  })

  it('aggregated impressions below threshold after dedup → excluded', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    const queries = [
      makeQuery({ query: 'cocktail calculator', country: 'US', impressions: 3 }),
      makeQuery({ query: 'cocktail calculator', country: 'KR', impressions: 4 }),
    ]
    // Total 7 < 10
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(0)
  })

  it('matches against KO keywords', () => {
    const tools = [makeMinimalTool({ keywords_ko: ['칵테일 계산기'] })]
    const queries = [makeQuery({ query: '칵테일 계산기', impressions: 20 })]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(0)
  })

  it('matches against title words', () => {
    const tools = [makeMinimalTool({ title_en: 'Password Generator' })]
    // "password" is a title word (3+ chars) — should match
    const queries = [makeQuery({ query: 'strong password tool', impressions: 20 })]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(0)
  })

  it('returns results sorted by impressions descending', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    const queries = [
      makeQuery({ query: 'cocktail calculator', impressions: 15 }),
      makeQuery({ query: 'car loan estimator', impressions: 50 }),
      makeQuery({ query: 'recipe converter', impressions: 30 }),
    ]
    const result = findUnmatchedQueries(queries, tools)
    expect(result).toHaveLength(3)
    expect(result[0]!.query).toBe('car loan estimator')
    expect(result[1]!.query).toBe('recipe converter')
    expect(result[2]!.query).toBe('cocktail calculator')
  })

  it('handles empty tools array — all queries above threshold are unmatched', () => {
    const queries = [makeQuery({ query: 'anything at all', impressions: 20 })]
    const result = findUnmatchedQueries(queries, [])
    expect(result).toHaveLength(1)
  })
})

// ── classifySgeRiskByRules ────────────────────────────────────────────────────

describe('classifySgeRiskByRules', () => {
  const patterns = DEFAULT_PATTERNS

  // high (zero-click) risk ─────────────────────────────────────────────────────

  it('returns "high" for query containing a zeroClickPattern', () => {
    expect(classifySgeRiskByRules('unit convert online', patterns)).toBe('high')
  })

  it('returns "high" for query matching "what is" pattern', () => {
    expect(classifySgeRiskByRules('what is bac calculator', patterns)).toBe('high')
  })

  it('returns "high" for query matching "hex to decimal" pattern', () => {
    expect(classifySgeRiskByRules('hex to decimal converter', patterns)).toBe('high')
  })

  it('is case-insensitive for zero-click patterns', () => {
    expect(classifySgeRiskByRules('UNIT CONVERT free', patterns)).toBe('high')
  })

  // low (interaction-needed) risk ──────────────────────────────────────────────

  it('returns "low" for query containing an interactionNeededPattern', () => {
    expect(classifySgeRiskByRules('upload and compare json', patterns)).toBe('low')
  })

  it('returns "low" for query matching "compare files"', () => {
    expect(classifySgeRiskByRules('compare files online', patterns)).toBe('low')
  })

  it('returns "low" for query matching "batch"', () => {
    expect(classifySgeRiskByRules('batch image resizer', patterns)).toBe('low')
  })

  it('is case-insensitive for interaction-needed patterns', () => {
    expect(classifySgeRiskByRules('UPLOAD files here', patterns)).toBe('low')
  })

  // priority: zeroClick wins over interactionNeeded ────────────────────────────

  it('returns "high" when query matches both zero-click and interaction-needed patterns', () => {
    // "unit convert" (high) appears before "upload" (low) in pattern list
    // zeroClickPatterns checked first
    expect(classifySgeRiskByRules('unit convert upload tool', patterns)).toBe('high')
  })

  // unknown ────────────────────────────────────────────────────────────────────

  it('returns "unknown" for query matching neither pattern list', () => {
    expect(classifySgeRiskByRules('cocktail calorie calculator', patterns)).toBe('unknown')
  })

  it('returns "unknown" for empty query', () => {
    expect(classifySgeRiskByRules('', patterns)).toBe('unknown')
  })

  it('returns "unknown" for unrelated query', () => {
    expect(classifySgeRiskByRules('baby growth percentile', patterns)).toBe('unknown')
  })

  // empty patterns ──────────────────────────────────────────────────────────────

  it('returns "unknown" when both pattern lists are empty', () => {
    const emptyPatterns: SgeRiskPatterns = {
      zeroClickPatterns: [],
      interactionNeededPatterns: [],
    }
    expect(classifySgeRiskByRules('any query', emptyPatterns)).toBe('unknown')
  })
})
