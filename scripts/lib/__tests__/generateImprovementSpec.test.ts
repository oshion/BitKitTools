/**
 * @jest-environment node
 */

import type { CtrAnomaly } from '../detectCtrAnomalies'
import type { HighBouncePage } from '../aggregateWeeklyReport'
import type { ProposalLog, ProposalEntry } from '../proposalTracking'
import {
  aggregateQueriesByPageAndQuery,
} from '../aggregateWeeklyReport'
import {
  selectImprovementCandidates,
  buildImprovementSpecPrompt,
  generateImprovementSpec,
  MAX_IMPROVEMENT_SPECS_PER_WEEK,
  type ImprovementSpecCandidate,
} from '../../generate-improvement-spec'
import type { ProcessedQuery } from '../../process-analytics'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeQuery(overrides: Partial<ProcessedQuery> = {}): ProcessedQuery {
  return {
    query: 'bac calculator',
    page: '/beer/bac-calculator/',
    country: 'US',
    device: 'desktop',
    impressions: 100,
    clicks: 5,
    ctr: 0.05,
    position: 3.0,
    ...overrides,
  }
}

function makeAnomaly(overrides: Partial<CtrAnomaly> = {}): CtrAnomaly {
  return {
    page: '/beer/bac-calculator/',
    query: 'bac calculator',
    ctr: 0.01,
    reasons: ['below-benchmark'],
    ...overrides,
  }
}

function makeBouncePage(overrides: Partial<HighBouncePage> = {}): HighBouncePage {
  return {
    path: '/beer/homebrew-recipe-calculator/',
    bounceRate: 0.85,
    sessions: 20,
    ...overrides,
  }
}

function makeProposalLog(entries: ProposalEntry[] = []): ProposalLog {
  return { proposals: entries }
}

function makePendingProposal(target: string): ProposalEntry {
  return {
    id: `improvement-${target.replace(/\//g, '-').replace(/^-+|-+$/g, '')}`,
    type: 'improvement',
    target,
    firstProposedAt: '2026-07-01',
    status: 'pending',
    lastReminderAt: '2026-07-01',
  }
}

// ── aggregateQueriesByPageAndQuery ────────────────────────────────────────────

describe('aggregateQueriesByPageAndQuery', () => {
  it('returns empty array for empty input', () => {
    const result = aggregateQueriesByPageAndQuery([])
    expect(result).toEqual([])
  })

  it('produces one sample for a single query row', () => {
    const q = makeQuery({ impressions: 50, clicks: 3, position: 4.0 })
    const result = aggregateQueriesByPageAndQuery([q])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      page: '/beer/bac-calculator/',
      query: 'bac calculator',
      impressions: 50,
      clicks: 3,
    })
    expect(result[0]!.avgPosition).toBeCloseTo(4.0)
  })

  it('merges multiple country/device rows for the same page+query', () => {
    const rows: ProcessedQuery[] = [
      makeQuery({ country: 'US', device: 'desktop', impressions: 100, clicks: 6, position: 3.0 }),
      makeQuery({ country: 'KR', device: 'mobile', impressions: 50, clicks: 2, position: 5.0 }),
      makeQuery({ country: 'GB', device: 'tablet', impressions: 50, clicks: 1, position: 7.0 }),
    ]
    const result = aggregateQueriesByPageAndQuery(rows)
    expect(result).toHaveLength(1)
    expect(result[0]!.impressions).toBe(200)
    expect(result[0]!.clicks).toBe(9)
    // Weighted avg position: (3*100 + 5*50 + 7*50) / 200 = (300+250+350)/200 = 900/200 = 4.5
    expect(result[0]!.avgPosition).toBeCloseTo(4.5)
  })

  it('keeps distinct page+query combinations separate', () => {
    const rows: ProcessedQuery[] = [
      makeQuery({ query: 'bac calculator', page: '/beer/bac-calculator/', impressions: 100, clicks: 5, position: 3.0 }),
      makeQuery({ query: 'blood alcohol', page: '/beer/bac-calculator/', impressions: 60, clicks: 2, position: 5.0 }),
      makeQuery({ query: 'json formatter', page: '/developer/json-formatter/', impressions: 80, clicks: 6, position: 2.0 }),
    ]
    const result = aggregateQueriesByPageAndQuery(rows)
    expect(result).toHaveLength(3)
    const pages = result.map((r) => `${r.page}|${r.query}`).sort()
    expect(pages).toEqual([
      '/beer/bac-calculator/|bac calculator',
      '/beer/bac-calculator/|blood alcohol',
      '/developer/json-formatter/|json formatter',
    ])
  })

  it('uses impressions-weighted average for position (not simple average)', () => {
    // Two rows: 900 impressions at position 1 and 100 impressions at position 10
    // Simple avg = 5.5, weighted avg = (900*1 + 100*10) / 1000 = 1900/1000 = 1.9
    const rows: ProcessedQuery[] = [
      makeQuery({ country: 'US', device: 'desktop', impressions: 900, clicks: 90, position: 1.0 }),
      makeQuery({ country: 'KR', device: 'mobile', impressions: 100, clicks: 1, position: 10.0 }),
    ]
    const result = aggregateQueriesByPageAndQuery(rows)
    expect(result[0]!.avgPosition).toBeCloseTo(1.9)
    expect(result[0]!.avgPosition).not.toBeCloseTo(5.5)
  })

  it('handles zero impressions row gracefully', () => {
    const rows: ProcessedQuery[] = [
      makeQuery({ impressions: 0, clicks: 0, position: 5.0 }),
    ]
    const result = aggregateQueriesByPageAndQuery(rows)
    expect(result).toHaveLength(1)
    expect(result[0]!.impressions).toBe(0)
    expect(result[0]!.clicks).toBe(0)
    // When total impressions is 0, avgPosition should still be a number (fall back to 0 or NaN handled)
    expect(isFinite(result[0]!.avgPosition)).toBe(true)
  })
})

// ── MAX_IMPROVEMENT_SPECS_PER_WEEK ────────────────────────────────────────────

describe('MAX_IMPROVEMENT_SPECS_PER_WEEK', () => {
  it('is 3', () => {
    expect(MAX_IMPROVEMENT_SPECS_PER_WEEK).toBe(3)
  })
})

// ── selectImprovementCandidates ───────────────────────────────────────────────

describe('selectImprovementCandidates', () => {
  const asOf = new Date('2026-08-06T00:00:00Z')

  it('returns empty candidates and reminders when no input', () => {
    const result = selectImprovementCandidates([], [], makeProposalLog(), asOf)
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(0)
  })

  it('converts a CTR anomaly to a candidate with non-empty evidence', () => {
    const anomalies = [makeAnomaly()]
    const result = selectImprovementCandidates(anomalies, [], makeProposalLog(), asOf)
    expect(result.candidates).toHaveLength(1)
    const c = result.candidates[0]!
    expect(c.page).toBe('/beer/bac-calculator/')
    expect(c.evidence).not.toBe('')
    expect(c.reason).not.toBe('')
  })

  it('converts a high bounce page to a candidate with non-empty evidence', () => {
    const bouncePages = [makeBouncePage()]
    const result = selectImprovementCandidates([], bouncePages, makeProposalLog(), asOf)
    expect(result.candidates).toHaveLength(1)
    const c = result.candidates[0]!
    expect(c.page).toBe('/beer/homebrew-recipe-calculator/')
    expect(c.evidence).toContain('85')
    expect(c.evidence).not.toBe('')
  })

  it('puts already-pending proposal target in reminders, not candidates', () => {
    const anomalies = [makeAnomaly({ page: '/beer/bac-calculator/' })]
    const log = makeProposalLog([makePendingProposal('/beer/bac-calculator/')])
    const result = selectImprovementCandidates(anomalies, [], log, asOf)
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(1)
    expect(result.reminders[0]).toContain('/beer/bac-calculator/')
  })

  it('puts pending bounce page in reminders, not candidates', () => {
    const bouncePages = [makeBouncePage({ path: '/beer/homebrew-recipe-calculator/' })]
    const log = makeProposalLog([makePendingProposal('/beer/homebrew-recipe-calculator/')])
    const result = selectImprovementCandidates([], bouncePages, log, asOf)
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(1)
  })

  it('excludes a rejected proposal silently (no candidate, no reminder)', () => {
    const anomalies = [makeAnomaly({ page: '/beer/bac-calculator/' })]
    const log = makeProposalLog([
      { ...makePendingProposal('/beer/bac-calculator/'), status: 'rejected' },
    ])
    const result = selectImprovementCandidates(anomalies, [], log, asOf)
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(0)
  })

  it('limits candidates to MAX_IMPROVEMENT_SPECS_PER_WEEK (3)', () => {
    const anomalies: CtrAnomaly[] = [
      makeAnomaly({ page: '/p1/', query: 'q1', ctr: 0.01, reasons: ['below-benchmark'] }),
      makeAnomaly({ page: '/p2/', query: 'q2', ctr: 0.01, reasons: ['below-benchmark'] }),
      makeAnomaly({ page: '/p3/', query: 'q3', ctr: 0.01, reasons: ['below-benchmark'] }),
      makeAnomaly({ page: '/p4/', query: 'q4', ctr: 0.01, reasons: ['below-benchmark'] }),
      makeAnomaly({ page: '/p5/', query: 'q5', ctr: 0.01, reasons: ['below-benchmark'] }),
    ]
    const result = selectImprovementCandidates(anomalies, [], makeProposalLog(), asOf)
    expect(result.candidates.length).toBeLessThanOrEqual(MAX_IMPROVEMENT_SPECS_PER_WEEK)
    expect(result.candidates.length).toBe(MAX_IMPROVEMENT_SPECS_PER_WEEK)
  })

  it('ranks anomalies with both reasons higher than single-reason anomalies', () => {
    const anomalies: CtrAnomaly[] = [
      makeAnomaly({ page: '/p-single/', query: 'q1', reasons: ['below-benchmark'] }),
      makeAnomaly({ page: '/p-both/', query: 'q2', reasons: ['below-benchmark', 'below-site-percentile'] }),
    ]
    const result = selectImprovementCandidates(anomalies, [], makeProposalLog(), asOf)
    expect(result.candidates[0]!.page).toBe('/p-both/')
    expect(result.candidates[1]!.page).toBe('/p-single/')
  })

  it('does not create candidates with empty evidence', () => {
    // All candidates from CTR anomalies and bounce pages should have evidence
    const anomalies = [makeAnomaly()]
    const bouncePages = [makeBouncePage()]
    const result = selectImprovementCandidates(anomalies, bouncePages, makeProposalLog(), asOf)
    for (const c of result.candidates) {
      expect(c.evidence.trim()).not.toBe('')
    }
  })

  it('de-duplicates candidates for the same page (merge CTR + bounce signals)', () => {
    const anomalies = [makeAnomaly({ page: '/beer/bac-calculator/' })]
    const bouncePages = [makeBouncePage({ path: '/beer/bac-calculator/' })]
    const result = selectImprovementCandidates(anomalies, bouncePages, makeProposalLog(), asOf)
    // Same page should appear only once
    const pages = result.candidates.map((c) => c.page)
    const uniquePages = new Set(pages)
    expect(uniquePages.size).toBe(pages.length)
  })

  it('reminderString contains weeks-pending info for pending proposals', () => {
    const anomalies = [makeAnomaly({ page: '/beer/bac-calculator/' })]
    const log = makeProposalLog([
      {
        ...makePendingProposal('/beer/bac-calculator/'),
        firstProposedAt: '2026-07-23', // 2 weeks before asOf (2026-08-06)
      },
    ])
    const result = selectImprovementCandidates(anomalies, [], log, asOf)
    expect(result.reminders[0]).toMatch(/[0-9]+주/)
  })

  it('allows implemented proposals to be re-proposed as new candidates', () => {
    const anomalies = [makeAnomaly({ page: '/beer/bac-calculator/' })]
    const log = makeProposalLog([
      { ...makePendingProposal('/beer/bac-calculator/'), status: 'implemented' },
    ])
    const result = selectImprovementCandidates(anomalies, [], log, asOf)
    expect(result.candidates).toHaveLength(1)
    expect(result.reminders).toHaveLength(0)
  })
})

// ── buildImprovementSpecPrompt ────────────────────────────────────────────────

describe('buildImprovementSpecPrompt', () => {
  it('includes candidate evidence in the prompt', () => {
    const candidate: ImprovementSpecCandidate = {
      page: '/beer/bac-calculator/',
      reason: 'CTR 낮음',
      evidence: 'CTR 1.0%, 벤치마크 대비 50% 이하',
    }
    const prompt = buildImprovementSpecPrompt(candidate, '')
    expect(prompt).toContain('CTR 1.0%, 벤치마크 대비 50% 이하')
    expect(prompt).toContain('/beer/bac-calculator/')
  })

  it('includes history.md content in the prompt', () => {
    const candidate: ImprovementSpecCandidate = {
      page: '/developer/json-formatter/',
      reason: '이탈률 높음',
      evidence: '이탈률 80%, 15세션',
    }
    const historyMd = '2026년 7월 1주차: 클릭 10 / 개선 없음'
    const prompt = buildImprovementSpecPrompt(candidate, historyMd)
    expect(prompt).toContain('2026년 7월 1주차')
  })

  it('returns a non-empty string', () => {
    const candidate: ImprovementSpecCandidate = {
      page: '/travel/visa-requirement-checker/',
      reason: '이탈률 높음',
      evidence: '이탈률 75%, 8세션',
    }
    const prompt = buildImprovementSpecPrompt(candidate, '')
    expect(prompt.trim().length).toBeGreaterThan(50)
  })
})

// ── ImprovementSpecCandidate type export check ─────────────────────────────

describe('ImprovementSpecCandidate interface', () => {
  it('has page, reason, evidence fields', () => {
    const c: ImprovementSpecCandidate = {
      page: '/beer/bac-calculator/',
      reason: '테스트',
      evidence: '테스트 근거',
    }
    expect(c.page).toBeDefined()
    expect(c.reason).toBeDefined()
    expect(c.evidence).toBeDefined()
  })
})

// ── generateImprovementSpec ──────────────────────────────────────────────────

describe('generateImprovementSpec', () => {
  const candidate: ImprovementSpecCandidate = {
    page: '/beer/bac-calculator/',
    reason: 'CTR이 벤치마크 대비 낮음',
    evidence: "쿼리 'bac calculator': CTR 0.0%",
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

  it('returns the spec text when the response finishes normally', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(makeFetchResponse('## 개선 spec 본문', 'end_turn'))
    const result = await generateImprovementSpec(candidate, '', 'dummy-key')
    expect(result).toBe('## 개선 spec 본문')
  })

  it('throws instead of returning a truncated spec (stop_reason: max_tokens)', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(makeFetchResponse('## 개선 spec 본문 (미완', 'max_tokens'))
    await expect(generateImprovementSpec(candidate, '', 'dummy-key')).rejects.toThrow(
      /cut off by max_tokens/
    )
  })
})
