/**
 * @jest-environment node
 */

import type { TopPagesHistory, WeeklyTopPagesPoint } from '../topPagesHistory'
import type { ProposalLog, ProposalEntry } from '../proposalTracking'
import {
  selectGrowthCandidates,
  DEFAULT_MIN_CONSECUTIVE_WEEKS,
  type GrowthSpecCandidate,
} from '../../generate-growth-spec'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePoint(weekStart: string, pages: Array<{ page: string; clicks: number }>): WeeklyTopPagesPoint {
  return { weekStart, pages }
}

function makeHistory(points: WeeklyTopPagesPoint[]): TopPagesHistory {
  return { weeks: points }
}

function makeProposalLog(entries: ProposalEntry[] = []): ProposalLog {
  return { proposals: entries }
}

function makePendingGrowthProposal(target: string): ProposalEntry {
  return {
    id: `growth-${target.replace(/\//g, '-').replace(/^-+|-+$/g, '')}`,
    type: 'growth',
    target,
    firstProposedAt: '2026-07-01',
    status: 'pending',
    lastReminderAt: '2026-07-01',
  }
}

// ── DEFAULT_MIN_CONSECUTIVE_WEEKS ─────────────────────────────────────────────

describe('DEFAULT_MIN_CONSECUTIVE_WEEKS', () => {
  it('is 2 (roadmap lower bound: "2~3주 이상 연속")', () => {
    expect(DEFAULT_MIN_CONSECUTIVE_WEEKS).toBe(2)
  })
})

// ── selectGrowthCandidates ────────────────────────────────────────────────────

describe('selectGrowthCandidates', () => {
  const asOf = new Date('2026-08-06T00:00:00Z')

  // Normal: no candidates when condition not met ────────────────────────────

  it('returns empty arrays when history has fewer than minConsecutiveWeeks entries', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
    ])
    // Default min is 2, only 1 week — condition not met
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(0)
  })

  it('returns empty arrays when history is empty — no error thrown', () => {
    const history = makeHistory([])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    expect(result.candidates).toEqual([])
    expect(result.reminders).toEqual([])
  })

  it('returns empty arrays when page only appeared in 1 of 2 recent weeks', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/developer/json-formatter/', clicks: 80 }]),
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    expect(result.candidates).toHaveLength(0)
  })

  // Candidates when condition met ───────────────────────────────────────────

  it('returns candidate when page appeared in all 2 most recent consecutive weeks', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]!.page).toBe('/beer/bac-calculator/')
  })

  it('returns candidate with correct consecutiveWeeks count', () => {
    const history = makeHistory([
      makePoint('2026-07-14', [{ page: '/beer/bac-calculator/', clicks: 90 }]),
      makePoint('2026-07-21', [{ page: '/beer/bac-calculator/', clicks: 95 }]),
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    expect(result.candidates[0]!.consecutiveWeeks).toBe(4)
  })

  it('returns candidate with evidence string containing week count', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    const c = result.candidates[0]!
    expect(c.evidence).toContain('2')
    expect(c.evidence).toContain('연속')
  })

  it('evidence contains actual click figures from history', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    const c = result.candidates[0]!
    expect(c.evidence).toContain('100')
    expect(c.evidence).toContain('120')
  })

  it('returns multiple candidates when multiple pages qualify', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [
        { page: '/beer/bac-calculator/', clicks: 100 },
        { page: '/developer/json-formatter/', clicks: 80 },
      ]),
      makePoint('2026-08-04', [
        { page: '/beer/bac-calculator/', clicks: 120 },
        { page: '/developer/json-formatter/', clicks: 90 },
      ]),
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    expect(result.candidates).toHaveLength(2)
  })

  // Pending proposals → reminders ───────────────────────────────────────────

  it('puts already-pending growth proposal in reminders, not candidates', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const log = makeProposalLog([makePendingGrowthProposal('/beer/bac-calculator/')])
    const result = selectGrowthCandidates(history, log, asOf)
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(1)
    expect(result.reminders[0]).toContain('/beer/bac-calculator/')
  })

  it('excludes a rejected growth proposal silently (no candidate, no reminder)', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const log = makeProposalLog([
      { ...makePendingGrowthProposal('/beer/bac-calculator/'), status: 'rejected' },
    ])
    const result = selectGrowthCandidates(history, log, asOf)
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(0)
  })

  it('reminder string includes weeks-pending info', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const log = makeProposalLog([
      {
        ...makePendingGrowthProposal('/beer/bac-calculator/'),
        firstProposedAt: '2026-07-23', // ~2 weeks before asOf
      },
    ])
    const result = selectGrowthCandidates(history, log, asOf)
    expect(result.reminders[0]).toMatch(/[0-9]+주/)
  })

  it('allows implemented growth proposals to be re-proposed as new candidates', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const log = makeProposalLog([
      { ...makePendingGrowthProposal('/beer/bac-calculator/'), status: 'implemented' },
    ])
    const result = selectGrowthCandidates(history, log, asOf)
    expect(result.candidates).toHaveLength(1)
    expect(result.reminders).toHaveLength(0)
  })

  it('mixes candidates and reminders correctly when some are pending', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [
        { page: '/beer/bac-calculator/', clicks: 100 },
        { page: '/developer/json-formatter/', clicks: 80 },
      ]),
      makePoint('2026-08-04', [
        { page: '/beer/bac-calculator/', clicks: 120 },
        { page: '/developer/json-formatter/', clicks: 90 },
      ]),
    ])
    const log = makeProposalLog([makePendingGrowthProposal('/beer/bac-calculator/')])
    const result = selectGrowthCandidates(history, log, asOf)
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]!.page).toBe('/developer/json-formatter/')
    expect(result.reminders).toHaveLength(1)
    expect(result.reminders[0]).toContain('/beer/bac-calculator/')
  })

  // Custom minConsecutiveWeeks ───────────────────────────────────────────────

  it('respects custom minConsecutiveWeeks=3', () => {
    const history = makeHistory([
      makePoint('2026-07-21', [{ page: '/beer/bac-calculator/', clicks: 90 }]),
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      // Only 2 weeks available, need 3 → no candidates
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf, 3)
    expect(result.candidates).toHaveLength(0)
  })

  it('qualifies when minConsecutiveWeeks=3 and exactly 3 weeks present', () => {
    const history = makeHistory([
      makePoint('2026-07-21', [{ page: '/beer/bac-calculator/', clicks: 90 }]),
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf, 3)
    expect(result.candidates).toHaveLength(1)
  })

  // GrowthSpecCandidate shape ────────────────────────────────────────────────

  it('candidate has page, consecutiveWeeks, and non-empty evidence fields', () => {
    const history = makeHistory([
      makePoint('2026-07-28', [{ page: '/beer/bac-calculator/', clicks: 100 }]),
      makePoint('2026-08-04', [{ page: '/beer/bac-calculator/', clicks: 120 }]),
    ])
    const result = selectGrowthCandidates(history, makeProposalLog(), asOf)
    const c = result.candidates[0] as GrowthSpecCandidate
    expect(c.page).toBeDefined()
    expect(typeof c.consecutiveWeeks).toBe('number')
    expect(c.consecutiveWeeks).toBeGreaterThanOrEqual(DEFAULT_MIN_CONSECUTIVE_WEEKS)
    expect(c.evidence.trim().length).toBeGreaterThan(0)
  })
})
