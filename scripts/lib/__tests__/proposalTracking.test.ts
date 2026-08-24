/**
 * @jest-environment node
 */

import type { ProposalEntry, ProposalLog } from '../proposalTracking'
import {
  findPendingProposal,
  findRejectedProposal,
  markImplemented,
  markRejected,
  readProposals,
  upsertProposal,
  weeksPending,
  writeProposals,
} from '../proposalTracking'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTempFile(content?: string): string {
  const dir = join(tmpdir(), 'proposal-tracking-test-' + Date.now())
  mkdirSync(dir, { recursive: true })
  const filePath = join(dir, 'proposals.json')
  if (content !== undefined) {
    writeFileSync(filePath, content, 'utf-8')
  }
  return filePath
}

function makeEntry(overrides: Partial<Omit<ProposalEntry, 'lastReminderAt'>> = {}): Omit<ProposalEntry, 'lastReminderAt'> {
  return {
    id: 'improvement-beer-bac-calculator',
    type: 'improvement',
    target: '/beer/bac-calculator',
    firstProposedAt: '2026-01-05',
    status: 'pending',
    ...overrides,
  }
}

// ── readProposals ─────────────────────────────────────────────────────────────

describe('readProposals', () => {
  it('returns empty log when file does not exist', () => {
    const filePath = join(tmpdir(), 'nonexistent-proposals-' + Date.now() + '.json')
    const result = readProposals(filePath)
    expect(result).toEqual({ proposals: [] })
  })

  it('reads existing proposals file', () => {
    const log: ProposalLog = {
      proposals: [
        {
          id: 'improvement-beer-bac-calculator',
          type: 'improvement',
          target: '/beer/bac-calculator',
          firstProposedAt: '2026-01-05',
          status: 'pending',
          lastReminderAt: '2026-01-05',
        },
      ],
    }
    const filePath = makeTempFile(JSON.stringify(log))
    const result = readProposals(filePath)
    expect(result).toEqual(log)
  })

  it('returns empty log on malformed JSON', () => {
    const filePath = makeTempFile('not-valid-json')
    const result = readProposals(filePath)
    expect(result).toEqual({ proposals: [] })
  })
})

// ── writeProposals ────────────────────────────────────────────────────────────

describe('writeProposals', () => {
  it('writes proposals to file and reads back correctly', () => {
    const log: ProposalLog = {
      proposals: [
        {
          id: 'tool-research-json-to-sql',
          type: 'tool-research',
          target: 'json-to-sql',
          firstProposedAt: '2026-02-01',
          status: 'pending',
          lastReminderAt: '2026-02-01',
        },
      ],
    }
    const filePath = makeTempFile()
    writeProposals(log, filePath)
    const result = readProposals(filePath)
    expect(result).toEqual(log)
  })

  it('creates directory if it does not exist', () => {
    const dir = join(tmpdir(), 'new-dir-' + Date.now())
    const filePath = join(dir, 'proposals.json')
    const log: ProposalLog = { proposals: [] }
    writeProposals(log, filePath)
    expect(existsSync(filePath)).toBe(true)
  })
})

// ── findPendingProposal ───────────────────────────────────────────────────────

describe('findPendingProposal', () => {
  it('finds matching pending proposal', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const result = findPendingProposal(log, 'improvement', '/beer/bac-calculator')
    expect(result).toEqual(entry)
  })

  it('returns undefined when no matching pending proposal', () => {
    const log: ProposalLog = { proposals: [] }
    const result = findPendingProposal(log, 'improvement', '/beer/bac-calculator')
    expect(result).toBeUndefined()
  })

  it('returns undefined when proposal is implemented (not pending)', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'implemented',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const result = findPendingProposal(log, 'improvement', '/beer/bac-calculator')
    expect(result).toBeUndefined()
  })

  it('returns undefined when type does not match', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const result = findPendingProposal(log, 'growth', '/beer/bac-calculator')
    expect(result).toBeUndefined()
  })
})

// ── findRejectedProposal ──────────────────────────────────────────────────────

describe('findRejectedProposal', () => {
  it('finds matching rejected proposal', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'rejected',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const result = findRejectedProposal(log, 'improvement', '/beer/bac-calculator')
    expect(result).toEqual(entry)
  })

  it('returns undefined when no matching rejected proposal', () => {
    const log: ProposalLog = { proposals: [] }
    const result = findRejectedProposal(log, 'improvement', '/beer/bac-calculator')
    expect(result).toBeUndefined()
  })

  it('returns undefined when proposal is pending (not rejected)', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const result = findRejectedProposal(log, 'improvement', '/beer/bac-calculator')
    expect(result).toBeUndefined()
  })

  it('returns undefined when type does not match', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'rejected',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const result = findRejectedProposal(log, 'growth', '/beer/bac-calculator')
    expect(result).toBeUndefined()
  })
})

// ── upsertProposal ────────────────────────────────────────────────────────────

describe('upsertProposal', () => {
  it('adds new proposal and returns isNew: true', () => {
    const log: ProposalLog = { proposals: [] }
    const asOf = new Date('2026-01-05T00:00:00Z')
    const entry = makeEntry()
    const { log: newLog, isNew } = upsertProposal(log, entry, asOf)

    expect(isNew).toBe(true)
    expect(newLog.proposals).toHaveLength(1)
    expect(newLog.proposals[0]!.id).toBe(entry.id)
    expect(newLog.proposals[0]!.lastReminderAt).toBe('2026-01-05')
  })

  it('updates lastReminderAt for existing pending proposal and returns isNew: false', () => {
    const existing: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [existing] }
    const asOf = new Date('2026-01-12T00:00:00Z')
    const entry = makeEntry()
    const { log: newLog, isNew } = upsertProposal(log, entry, asOf)

    expect(isNew).toBe(false)
    expect(newLog.proposals).toHaveLength(1)
    expect(newLog.proposals[0]!.lastReminderAt).toBe('2026-01-12')
    expect(newLog.proposals[0]!.firstProposedAt).toBe('2026-01-05') // unchanged
  })

  it('generates deterministic id from type and target', () => {
    const log: ProposalLog = { proposals: [] }
    const asOf = new Date('2026-01-05T00:00:00Z')
    const entry1 = makeEntry({ type: 'improvement', target: '/beer/bac-calculator' })
    const { log: log1 } = upsertProposal(log, entry1, asOf)

    // Same type + target should find the same entry on second call
    const { isNew } = upsertProposal(log1, entry1, asOf)
    expect(isNew).toBe(false)
  })

  it('does not mutate the original log', () => {
    const log: ProposalLog = { proposals: [] }
    const asOf = new Date('2026-01-05T00:00:00Z')
    const entry = makeEntry()
    upsertProposal(log, entry, asOf)
    expect(log.proposals).toHaveLength(0) // original unchanged
  })
})

// ── weeksPending ──────────────────────────────────────────────────────────────

describe('weeksPending', () => {
  it('returns 1 on the same day as firstProposedAt', () => {
    const entry: ProposalEntry = {
      id: 'test',
      type: 'improvement',
      target: '/test',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const asOf = new Date('2026-01-05T00:00:00Z')
    expect(weeksPending(entry, asOf)).toBe(1)
  })

  it('returns 1 for 6 days elapsed', () => {
    const entry: ProposalEntry = {
      id: 'test',
      type: 'improvement',
      target: '/test',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const asOf = new Date('2026-01-11T00:00:00Z') // 6 days later
    expect(weeksPending(entry, asOf)).toBe(1)
  })

  it('returns 2 for exactly 7 days elapsed', () => {
    const entry: ProposalEntry = {
      id: 'test',
      type: 'improvement',
      target: '/test',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const asOf = new Date('2026-01-12T00:00:00Z') // 7 days later
    expect(weeksPending(entry, asOf)).toBe(2)
  })

  it('returns 3 for 14 days elapsed', () => {
    const entry: ProposalEntry = {
      id: 'test',
      type: 'improvement',
      target: '/test',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const asOf = new Date('2026-01-19T00:00:00Z') // 14 days later
    expect(weeksPending(entry, asOf)).toBe(3)
  })
})

// ── markImplemented ───────────────────────────────────────────────────────────

describe('markImplemented', () => {
  it('marks the proposal as implemented', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const newLog = markImplemented(log, 'improvement-beer-bac-calculator')
    expect(newLog.proposals[0]!.status).toBe('implemented')
  })

  it('does not affect other proposals', () => {
    const entry1: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const entry2: ProposalEntry = {
      id: 'tool-research-json-to-sql',
      type: 'tool-research',
      target: 'json-to-sql',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry1, entry2] }
    const newLog = markImplemented(log, 'improvement-beer-bac-calculator')
    expect(newLog.proposals[0]!.status).toBe('implemented')
    expect(newLog.proposals[1]!.status).toBe('pending')
  })

  it('after markImplemented, findPendingProposal no longer finds the entry', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const newLog = markImplemented(log, 'improvement-beer-bac-calculator')
    const found = findPendingProposal(newLog, 'improvement', '/beer/bac-calculator')
    expect(found).toBeUndefined()
  })

  it('does not mutate the original log', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    markImplemented(log, 'improvement-beer-bac-calculator')
    expect(log.proposals[0]!.status).toBe('pending') // original unchanged
  })
})

// ── markRejected ──────────────────────────────────────────────────────────────

describe('markRejected', () => {
  it('marks the proposal as rejected', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const newLog = markRejected(log, 'improvement-beer-bac-calculator')
    expect(newLog.proposals[0]!.status).toBe('rejected')
  })

  it('does not affect other proposals', () => {
    const entry1: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const entry2: ProposalEntry = {
      id: 'tool-research-json-to-sql',
      type: 'tool-research',
      target: 'json-to-sql',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry1, entry2] }
    const newLog = markRejected(log, 'improvement-beer-bac-calculator')
    expect(newLog.proposals[0]!.status).toBe('rejected')
    expect(newLog.proposals[1]!.status).toBe('pending')
  })

  it('after markRejected, findPendingProposal no longer finds the entry', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    const newLog = markRejected(log, 'improvement-beer-bac-calculator')
    const found = findPendingProposal(newLog, 'improvement', '/beer/bac-calculator')
    expect(found).toBeUndefined()
  })

  it('does not mutate the original log', () => {
    const entry: ProposalEntry = {
      id: 'improvement-beer-bac-calculator',
      type: 'improvement',
      target: '/beer/bac-calculator',
      firstProposedAt: '2026-01-05',
      status: 'pending',
      lastReminderAt: '2026-01-05',
    }
    const log: ProposalLog = { proposals: [entry] }
    markRejected(log, 'improvement-beer-bac-calculator')
    expect(log.proposals[0]!.status).toBe('pending') // original unchanged
  })
})
