/**
 * Proposal Tracking
 *
 * Tracks spec proposals to prevent duplicate generation.
 * When a pending proposal already exists for (type, target), we skip
 * re-generating a spec and instead emit a "N weeks pending" reminder.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProposalEntry {
  id: string
  type: 'improvement' | 'growth' | 'tool-research' | 'new-category' | 'programmatic-seo'
  target: string
  firstProposedAt: string // ISO date
  status: 'pending' | 'implemented'
  lastReminderAt: string // ISO date
}

export interface ProposalLog {
  proposals: ProposalEntry[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_PROPOSALS_PATH = resolve(process.cwd(), 'data', 'proposals.json')

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts a string to a URL-safe slug. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Deterministically generates an id from type and target. */
function makeId(type: ProposalEntry['type'], target: string): string {
  return `${type}-${slugify(target)}`
}

/** Formats a Date as YYYY-MM-DD (UTC). */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// ── I/O ───────────────────────────────────────────────────────────────────────

/** Read proposal log. Returns `{ proposals: [] }` if the file does not exist. */
export function readProposals(filePath: string = DEFAULT_PROPOSALS_PATH): ProposalLog {
  if (!existsSync(filePath)) {
    return { proposals: [] }
  }
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as ProposalLog
  } catch {
    return { proposals: [] }
  }
}

/** Write proposal log (creates directory if needed). */
export function writeProposals(log: ProposalLog, filePath: string = DEFAULT_PROPOSALS_PATH): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(log, null, 2), 'utf-8')
}

// ── Pure Functions ────────────────────────────────────────────────────────────

/** Returns the first `pending` proposal matching (type, target), or undefined. */
export function findPendingProposal(
  log: ProposalLog,
  type: ProposalEntry['type'],
  target: string
): ProposalEntry | undefined {
  return log.proposals.find((p) => p.status === 'pending' && p.type === type && p.target === target)
}

/**
 * Upserts a proposal:
 * - If a pending proposal for (type, target) already exists, updates `lastReminderAt` to `asOf`
 *   and returns `{ log, isNew: false }`.
 * - Otherwise, adds a new entry with `lastReminderAt = asOf` and returns `{ log, isNew: true }`.
 *
 * `asOf` must be passed explicitly — never calls `new Date()` internally.
 */
export function upsertProposal(
  log: ProposalLog,
  entry: Omit<ProposalEntry, 'lastReminderAt'>,
  asOf: Date
): { log: ProposalLog; isNew: boolean } {
  const dateStr = toDateString(asOf)
  const id = makeId(entry.type, entry.target)
  const existing = findPendingProposal(log, entry.type, entry.target)

  if (existing) {
    const proposals = log.proposals.map((p) =>
      p === existing ? { ...p, lastReminderAt: dateStr } : p
    )
    return { log: { ...log, proposals }, isNew: false }
  }

  const newEntry: ProposalEntry = {
    ...entry,
    id,
    lastReminderAt: dateStr,
  }
  return {
    log: { ...log, proposals: [...log.proposals, newEntry] },
    isNew: true,
  }
}

/**
 * Returns how many weeks have elapsed since `entry.firstProposedAt`, relative to `asOf`.
 * Uses ceiling division: 0 days → 1, 1–6 days → 1, 7 days → 2, etc.
 *
 * `asOf` must be passed explicitly — never calls `new Date()` internally.
 */
export function weeksPending(entry: ProposalEntry, asOf: Date): number {
  const firstProposed = new Date(entry.firstProposedAt)
  const diffMs = asOf.getTime() - firstProposed.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return Math.ceil((diffDays + 1) / 7)
}

/** Returns a new log with the matching proposal's status set to 'implemented'. */
export function markImplemented(log: ProposalLog, id: string): ProposalLog {
  const proposals = log.proposals.map((p) =>
    p.id === id ? { ...p, status: 'implemented' as const } : p
  )
  return { ...log, proposals }
}
