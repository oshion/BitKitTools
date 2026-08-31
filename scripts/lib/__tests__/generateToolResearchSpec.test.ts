/**
 * @jest-environment node
 */

import type { ProposalEntry, ProposalLog } from '../proposalTracking'
import type { SgeRiskPatterns } from '../toolResearchMatching'
import {
  MAX_TOOL_RESEARCH_SPECS_PER_WEEK,
  parseNewCategorySpecResponse,
  selectNewCategoryCandidate,
  selectToolResearchCandidates,
  generateToolResearchSpec,
  generateNewCategorySpec,
  type ToolResearchCandidate,
  type NewCategoryCandidate,
} from '../../generate-tool-research-spec'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProposalLog(entries: ProposalEntry[] = []): ProposalLog {
  return { proposals: entries }
}

function makePendingProposal(
  type: ProposalEntry['type'],
  target: string
): ProposalEntry {
  const slugTarget = target.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return {
    id: `${type}-${slugTarget}`,
    type,
    target,
    firstProposedAt: '2026-07-01',
    status: 'pending',
    lastReminderAt: '2026-07-01',
  }
}

// ── MAX_TOOL_RESEARCH_SPECS_PER_WEEK ──────────────────────────────────────────

describe('MAX_TOOL_RESEARCH_SPECS_PER_WEEK', () => {
  it('is 2', () => {
    expect(MAX_TOOL_RESEARCH_SPECS_PER_WEEK).toBe(2)
  })
})

// ── selectToolResearchCandidates ──────────────────────────────────────────────

describe('selectToolResearchCandidates', () => {
  const asOf = new Date('2026-08-06T00:00:00Z')

  // 'calculator' is a rule-based interactionNeededPatterns match, so
  // classification resolves to 'low' without any AI call — keeps these
  // tests synchronous-in-effect and free of network mocking.
  function makePatterns(): SgeRiskPatterns {
    return { zeroClickPatterns: [], interactionNeededPatterns: ['calculator'] }
  }

  it('returns a candidate for a recurring low-risk query with no proposal history', async () => {
    const result = await selectToolResearchCandidates(
      ['mortgage calculator'],
      [{ query: 'mortgage calculator', impressions: 50 }],
      makePatterns(),
      makeProposalLog(),
      asOf,
      'dummy-key'
    )
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]!.query).toBe('mortgage calculator')
    expect(result.reminders).toHaveLength(0)
  })

  it('puts already-pending tool-research proposal in reminders, not candidates', async () => {
    const log = makeProposalLog([makePendingProposal('tool-research', 'mortgage calculator')])
    const result = await selectToolResearchCandidates(
      ['mortgage calculator'],
      [{ query: 'mortgage calculator', impressions: 50 }],
      makePatterns(),
      log,
      asOf,
      'dummy-key'
    )
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(1)
  })

  it('excludes a rejected tool-research proposal silently (no candidate, no reminder)', async () => {
    const log = makeProposalLog([
      { ...makePendingProposal('tool-research', 'mortgage calculator'), status: 'rejected' },
    ])
    const result = await selectToolResearchCandidates(
      ['mortgage calculator'],
      [{ query: 'mortgage calculator', impressions: 50 }],
      makePatterns(),
      log,
      asOf,
      'dummy-key'
    )
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(0)
  })
})

// ── selectNewCategoryCandidate ────────────────────────────────────────────────

describe('selectNewCategoryCandidate', () => {
  const asOf = new Date('2026-08-06T00:00:00Z')

  it('returns null when recurringQueries is empty', () => {
    const result = selectNewCategoryCandidate([], [], makeProposalLog(), asOf)
    expect(result).toBeNull()
  })

  it('returns null when all recurringQueries are consumed by tool research', () => {
    const result = selectNewCategoryCandidate(
      ['cocktail calculator', 'car loan estimator'],
      ['cocktail calculator', 'car loan estimator'],
      makeProposalLog(),
      asOf
    )
    expect(result).toBeNull()
  })

  it('returns a candidate when some queries are not consumed', () => {
    const result = selectNewCategoryCandidate(
      ['cocktail calculator', 'car loan estimator', 'mortgage calculator'],
      ['cocktail calculator'],
      makeProposalLog(),
      asOf
    )
    expect(result).not.toBeNull()
    expect(result!.queries).toContain('car loan estimator')
    expect(result!.queries).toContain('mortgage calculator')
    expect(result!.queries).not.toContain('cocktail calculator')
  })

  it('returns null when there is already a pending new-category proposal for the same query set', () => {
    // Target key is sorted queries joined by '|'
    const remaining = ['car loan estimator', 'mortgage calculator']
    const target = remaining.slice().sort().join('|')
    const log = makeProposalLog([makePendingProposal('new-category', target)])
    const result = selectNewCategoryCandidate(
      remaining,
      [],
      log,
      asOf
    )
    expect(result).toBeNull()
  })

  it('returns null when there is a rejected new-category proposal for the same query set', () => {
    const remaining = ['car loan estimator', 'mortgage calculator']
    const target = remaining.slice().sort().join('|')
    const log = makeProposalLog([
      { ...makePendingProposal('new-category', target), status: 'rejected' },
    ])
    const result = selectNewCategoryCandidate(remaining, [], log, asOf)
    expect(result).toBeNull()
  })

  it('returns candidate when an implemented proposal exists (not pending)', () => {
    const remaining = ['car loan estimator', 'mortgage calculator']
    const target = remaining.slice().sort().join('|')
    const log = makeProposalLog([
      { ...makePendingProposal('new-category', target), status: 'implemented' },
    ])
    const result = selectNewCategoryCandidate(remaining, [], log, asOf)
    expect(result).not.toBeNull()
  })

  it('uses sorted, deterministic target key regardless of input order', () => {
    // Two calls with different orderings should produce the same "pending" check
    const queries1 = ['car loan estimator', 'mortgage calculator']
    const queries2 = ['mortgage calculator', 'car loan estimator']
    const target = queries1.slice().sort().join('|') // same as queries2 sorted

    const log = makeProposalLog([makePendingProposal('new-category', target)])

    const result1 = selectNewCategoryCandidate(queries1, [], log, asOf)
    const result2 = selectNewCategoryCandidate(queries2, [], log, asOf)

    // Both should be null because the pending proposal covers the same sorted set
    expect(result1).toBeNull()
    expect(result2).toBeNull()
  })

  it('candidate has non-empty evidence string', () => {
    const result = selectNewCategoryCandidate(
      ['cocktail calculator', 'car loan estimator'],
      [],
      makeProposalLog(),
      asOf
    )
    expect(result!.evidence.trim().length).toBeGreaterThan(0)
  })

  it('candidate evidence mentions the queries', () => {
    const result = selectNewCategoryCandidate(
      ['car loan estimator'],
      [],
      makeProposalLog(),
      asOf
    )
    expect(result!.evidence).toContain('car loan estimator')
  })

  it('candidate includes all non-consumed queries', () => {
    const result = selectNewCategoryCandidate(
      ['a', 'b', 'c'],
      ['a'],
      makeProposalLog(),
      asOf
    )
    expect(result!.queries).toEqual(['b', 'c'])
  })
})

// ── parseNewCategorySpecResponse ──────────────────────────────────────────────

describe('parseNewCategorySpecResponse', () => {
  it('returns null when response is exactly "NONE"', () => {
    expect(parseNewCategorySpecResponse('NONE')).toBeNull()
  })

  it('returns null when response is "none" (case-insensitive)', () => {
    expect(parseNewCategorySpecResponse('none')).toBeNull()
  })

  it('returns null when response is "None"', () => {
    expect(parseNewCategorySpecResponse('None')).toBeNull()
  })

  it('returns null when NONE is surrounded by whitespace', () => {
    expect(parseNewCategorySpecResponse('  NONE  ')).toBeNull()
  })

  it('returns null when NONE appears at end of sentence', () => {
    expect(parseNewCategorySpecResponse('The answer is: NONE')).toBeNull()
  })

  it('returns null when NONE appears at start of line', () => {
    expect(parseNewCategorySpecResponse('NONE\nSome extra text')).toBeNull()
  })

  it('returns spec text when response is non-empty and does not contain NONE sentinel', () => {
    const specText = '## 새로운 카테고리 제안\n\n이 카테고리는...'
    const result = parseNewCategorySpecResponse(specText)
    expect(result).toBe(specText)
  })

  it('returns null for empty string', () => {
    expect(parseNewCategorySpecResponse('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(parseNewCategorySpecResponse('   \n\t  ')).toBeNull()
  })

  it('does not treat "NONEXISTENT" or similar words as the sentinel', () => {
    // "NONE" must appear as a standalone word, not inside another word
    const result = parseNewCategorySpecResponse(
      '## 카테고리 제안\n\nNONEXISTENT approach was considered.'
    )
    // "NONEXISTENT" contains "NONE" but is a different word — should not trigger sentinel
    // This tests that our regex uses word boundaries appropriately
    // Note: our regex checks for NONE followed by space/end/period, so "NONEXISTENT" won't match
    expect(result).not.toBeNull()
  })

  it('returns trimmed spec text', () => {
    const result = parseNewCategorySpecResponse('  ## 제안\n\n내용  ')
    expect(result).toBe('## 제안\n\n내용')
  })
})

// ── generateToolResearchSpec / generateNewCategorySpec (truncation guard) ─────

describe('generateToolResearchSpec and generateNewCategorySpec truncation handling', () => {
  const researchCandidate: ToolResearchCandidate = {
    query: 'mortgage calculator',
    impressions: 50,
    evidence: '2주 이상 연속으로 기존 tool과 매칭되지 않는 GSC 쿼리 (최근 노출수: 50)',
  }

  const categoryCandidate: NewCategoryCandidate = {
    queries: ['mortgage calculator', 'car loan estimator'],
    evidence: '2개의 기존 카테고리 외 반복 쿼리',
  }

  function makeFetchResponse(text: string, stopReason: string): Response {
    return {
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text }],
        stop_reason: stopReason,
      }),
    } as unknown as Response
  }

  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('generateToolResearchSpec returns the spec text when the response finishes normally', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(makeFetchResponse('## 리서치 spec 본문', 'end_turn'))
    const result = await generateToolResearchSpec(researchCandidate, '', 'dummy-key')
    expect(result).toBe('## 리서치 spec 본문')
  })

  it('generateToolResearchSpec throws instead of returning a truncated spec', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(makeFetchResponse('## 리서치 spec 본문 (미완', 'max_tokens'))
    await expect(generateToolResearchSpec(researchCandidate, '', 'dummy-key')).rejects.toThrow(
      /cut off by max_tokens/
    )
  })

  it('generateNewCategorySpec returns the spec text when the response finishes normally', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(makeFetchResponse('## 카테고리 spec 본문', 'end_turn'))
    const result = await generateNewCategorySpec(categoryCandidate, '', 'dummy-key')
    expect(result).toBe('## 카테고리 spec 본문')
  })

  it('generateNewCategorySpec throws instead of returning a truncated spec', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(makeFetchResponse('## 카테고리 spec 본문 (미완', 'max_tokens'))
    await expect(generateNewCategorySpec(categoryCandidate, '', 'dummy-key')).rejects.toThrow(
      /cut off by max_tokens/
    )
  })
})
