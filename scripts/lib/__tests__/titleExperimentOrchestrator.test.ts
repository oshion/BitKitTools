/**
 * @jest-environment node
 */

import type { SpawnSyncReturns } from 'child_process'
import type { ActionLog, ActionLogEntry } from '../detectStagnation'
import type { CtrAnomaly } from '../detectCtrAnomalies'
import type { ToolConfig } from '../../../src/types/tool'
import {
  isYmylTool,
  countInProgressExperiments,
  isExperimentReadyForEvaluation,
  evaluateExperimentOutcome,
  selectCandidatePages,
  getPageCtr,
  getRequiredKeywordsForTool,
  findToolByPage,
  updateToolTitleDescription,
  deployTitleVariant,
  type ProcessedQuery,
  type SpawnSyncFn,
} from '../titleExperimentOrchestrator'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTool(overrides: Partial<ToolConfig> = {}): ToolConfig {
  return {
    id: 'bac-calculator',
    slug: 'bac-calculator',
    category: 'beer',
    title: { en: 'BAC Calculator', ko: 'BAC 계산기' },
    description: { en: 'Check your blood alcohol.', ko: '혈중 알코올을 확인하세요.' },
    keywords: { en: ['bac', 'blood alcohol'], ko: ['bac', '혈중 알코올'] },
    schemaType: 'WebApplication',
    faq: [],
    relatedToolIds: [],
    adSlots: [],
    ogImage: '',
    status: 'validated',
    disclaimerType: 'none',
    aiOverviewResistance: 'high',
    addedAt: '2026-01-01',
    popular: false,
    ...overrides,
  }
}

function makeEntry(overrides: Partial<ActionLogEntry> = {}): ActionLogEntry {
  return {
    id: 'exp-001',
    type: 'title-experiment',
    page: '/beer/bac-calculator',
    deployedAt: '2026-07-01T00:00:00.000Z',
    description: 'A/B test: shorter title',
    status: 'in-progress',
    ...overrides,
  }
}

function makeActionLog(entries: ActionLogEntry[] = []): ActionLog {
  return { actions: entries }
}

function makeAnomaly(page: string, query = 'test query'): CtrAnomaly {
  return { page, query, ctr: 0.01, reasons: ['below-benchmark'] }
}

/** Returns a mock SpawnSyncFn that records invocations and returns success. */
function makeMockSpawn(): {
  fn: SpawnSyncFn
  calls: Array<{ cmd: string; args: string[] }>
} {
  const calls: Array<{ cmd: string; args: string[] }> = []
  const fn: SpawnSyncFn = (cmd, args) => {
    calls.push({ cmd, args: [...args] })
    // For `gh pr create`, return a fake PR URL in stdout.
    if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'create') {
      return { status: 0, stdout: 'https://github.com/owner/repo/pull/42\n', stderr: '' } as SpawnSyncReturns<string>
    }
    return { status: 0, stdout: '', stderr: '' } as SpawnSyncReturns<string>
  }
  return { fn, calls }
}

/** Minimal tools-config snippet for updateToolTitleDescription tests. */
const TOOLS_CONFIG_SNIPPET = `
export const toolsConfig: ToolConfig[] = [
  {
    id: 'bac-calculator',
    slug: 'bac-calculator',
    category: 'beer',
    title: {
      en: 'BAC Calculator',
      ko: 'BAC 계산기',
    },
    description: {
      en: 'Check your blood alcohol.',
      ko: '혈중 알코올을 확인하세요.',
    },
    disclaimerType: 'medical',
  },
  {
    id: 'tip-calculator',
    slug: 'tip-calculator',
    category: 'developer',
    title: {
      en: 'Tip Calculator',
      ko: '팁 계산기',
    },
    description: {
      en: 'Calculate the tip.',
      ko: '팁을 계산하세요.',
    },
    disclaimerType: 'none',
  },
]
`

// ── isYmylTool ─────────────────────────────────────────────────────────────────

describe('isYmylTool', () => {
  test('returns true for medical disclaimerType', () => {
    expect(isYmylTool(makeTool({ disclaimerType: 'medical' }))).toBe(true)
  })

  test('returns true for legal disclaimerType', () => {
    expect(isYmylTool(makeTool({ disclaimerType: 'legal' }))).toBe(true)
  })

  test('returns true for financial disclaimerType', () => {
    expect(isYmylTool(makeTool({ disclaimerType: 'financial' }))).toBe(true)
  })

  test('returns false for general disclaimerType', () => {
    expect(isYmylTool(makeTool({ disclaimerType: 'general' }))).toBe(false)
  })

  test('returns false for none disclaimerType', () => {
    expect(isYmylTool(makeTool({ disclaimerType: 'none' }))).toBe(false)
  })
})

// ── countInProgressExperiments ────────────────────────────────────────────────

describe('countInProgressExperiments', () => {
  test('returns 0 when action log is empty', () => {
    expect(countInProgressExperiments(makeActionLog())).toBe(0)
  })

  test('counts only title-experiment entries with status in-progress', () => {
    const log = makeActionLog([
      makeEntry({ id: 'e1', status: 'in-progress' }),
      makeEntry({ id: 'e2', status: 'kept' }),
      makeEntry({ id: 'e3', status: 'in-progress' }),
      makeEntry({ id: 'e4', type: 'content-update', status: 'in-progress' }),
    ])
    expect(countInProgressExperiments(log)).toBe(2)
  })

  test('ignores non-title-experiment entries even if in-progress', () => {
    const log = makeActionLog([
      makeEntry({ type: 'content-update', status: 'in-progress' }),
    ])
    expect(countInProgressExperiments(log)).toBe(0)
  })
})

// ── isExperimentReadyForEvaluation ────────────────────────────────────────────

describe('isExperimentReadyForEvaluation', () => {
  const asOf = new Date('2026-08-06T00:00:00.000Z')

  test('returns false for non-title-experiment entries', () => {
    const entry = makeEntry({ type: 'content-update', cooldownStartedAt: '2026-07-01T00:00:00.000Z' })
    expect(isExperimentReadyForEvaluation(entry, asOf)).toBe(false)
  })

  test('returns false when status is not in-progress', () => {
    const entry = makeEntry({
      status: 'kept',
      cooldownStartedAt: '2026-07-01T00:00:00.000Z',
    })
    expect(isExperimentReadyForEvaluation(entry, asOf)).toBe(false)
  })

  test('returns false when cooldownStartedAt is missing', () => {
    const entry = makeEntry({ status: 'in-progress' })
    expect(isExperimentReadyForEvaluation(entry, asOf)).toBe(false)
  })

  test('returns false when cooldown has not elapsed (< 21 days from cooldownStartedAt)', () => {
    // cooldownStartedAt = 10 days before asOf → not ready
    const entry = makeEntry({
      status: 'in-progress',
      cooldownStartedAt: '2026-07-27T00:00:00.000Z', // 10 days before 2026-08-06
    })
    expect(isExperimentReadyForEvaluation(entry, asOf)).toBe(false)
  })

  test('returns true when 21+ days have elapsed since cooldownStartedAt', () => {
    // cooldownStartedAt = 22 days before asOf → ready
    const entry = makeEntry({
      status: 'in-progress',
      cooldownStartedAt: '2026-07-15T00:00:00.000Z', // 22 days before 2026-08-06
    })
    expect(isExperimentReadyForEvaluation(entry, asOf)).toBe(true)
  })
})

// ── evaluateExperimentOutcome ─────────────────────────────────────────────────

describe('evaluateExperimentOutcome', () => {
  test('returns kept when currentCtr strictly exceeds baselineCtr', () => {
    const entry = makeEntry({ baselineCtr: 0.05, attemptNumber: 1 })
    expect(evaluateExperimentOutcome(entry, 0.06)).toBe('kept')
  })

  test('returns new-attempt when CTR did not improve and attemptNumber < 3', () => {
    const entry = makeEntry({ baselineCtr: 0.05, attemptNumber: 1 })
    expect(evaluateExperimentOutcome(entry, 0.04)).toBe('new-attempt')
  })

  test('returns new-attempt when CTR equals baseline and attemptNumber is 2', () => {
    const entry = makeEntry({ baselineCtr: 0.05, attemptNumber: 2 })
    expect(evaluateExperimentOutcome(entry, 0.05)).toBe('new-attempt')
  })

  test('returns rollback when CTR did not improve and attemptNumber >= 3', () => {
    const entry = makeEntry({ baselineCtr: 0.05, attemptNumber: 3 })
    expect(evaluateExperimentOutcome(entry, 0.04)).toBe('rollback')
  })
})

// ── selectCandidatePages ──────────────────────────────────────────────────────

describe('selectCandidatePages', () => {
  const ymylTool = makeTool({
    id: 'bac-calculator',
    slug: 'bac-calculator',
    category: 'beer',
    disclaimerType: 'medical',
  })
  const nonYmylTool = makeTool({
    id: 'tip-calculator',
    slug: 'tip-calculator',
    category: 'developer',
    disclaimerType: 'none',
  })
  const anotherTool = makeTool({
    id: 'time-zone-converter',
    slug: 'time-zone-converter',
    category: 'developer',
    disclaimerType: 'none',
  })

  test('excludes YMYL tools from candidates', () => {
    const anomalies = [makeAnomaly('/beer/bac-calculator')]
    const result = selectCandidatePages(anomalies, makeActionLog(), [ymylTool], 5)
    expect(result).toEqual([])
  })

  test('excludes pages already running an in-progress experiment', () => {
    const anomalies = [makeAnomaly('/developer/tip-calculator')]
    const log = makeActionLog([
      makeEntry({ page: '/developer/tip-calculator', status: 'in-progress' }),
    ])
    const result = selectCandidatePages(anomalies, log, [nonYmylTool], 5)
    expect(result).toEqual([])
  })

  test('returns non-YMYL pages not currently in-progress', () => {
    const anomalies = [makeAnomaly('/developer/tip-calculator')]
    const result = selectCandidatePages(anomalies, makeActionLog(), [nonYmylTool], 5)
    expect(result).toEqual(['/developer/tip-calculator'])
  })

  test('respects maxNew limit', () => {
    const anomalies = [
      makeAnomaly('/developer/tip-calculator'),
      makeAnomaly('/developer/time-zone-converter'),
    ]
    const result = selectCandidatePages(
      anomalies,
      makeActionLog(),
      [nonYmylTool, anotherTool],
      1
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toBe('/developer/tip-calculator')
  })

  test('excludes unknown pages (not in toolsConfigs)', () => {
    const anomalies = [makeAnomaly('/unknown/some-tool')]
    const result = selectCandidatePages(anomalies, makeActionLog(), [nonYmylTool], 5)
    expect(result).toEqual([])
  })
})

// ── getPageCtr ────────────────────────────────────────────────────────────────

describe('getPageCtr', () => {
  const queries: ProcessedQuery[] = [
    {
      query: 'bac calculator',
      page: '/beer/bac-calculator',
      country: 'US',
      device: 'desktop',
      impressions: 100,
      clicks: 5,
      ctr: 0.05,
      position: 3,
    },
    {
      query: 'blood alcohol calculator',
      page: '/beer/bac-calculator',
      country: 'US',
      device: 'mobile',
      impressions: 200,
      clicks: 10,
      ctr: 0.05,
      position: 4,
    },
  ]

  test('aggregates clicks and impressions across all queries for a page', () => {
    const ctr = getPageCtr(queries, '/beer/bac-calculator')
    // (5 + 10) / (100 + 200) = 15 / 300 = 0.05
    expect(ctr).toBeCloseTo(0.05)
  })

  test('matches page with trailing slash when stored without trailing slash', () => {
    const ctr = getPageCtr(queries, '/beer/bac-calculator/')
    expect(ctr).toBeCloseTo(0.05)
  })

  test('returns null when page has no matching queries', () => {
    expect(getPageCtr(queries, '/developer/tip-calculator')).toBeNull()
  })

  test('returns null when total impressions are zero', () => {
    const zeroQueries: ProcessedQuery[] = [
      {
        query: 'q',
        page: '/some/page',
        country: 'US',
        device: 'desktop',
        impressions: 0,
        clicks: 0,
        ctr: 0,
        position: 1,
      },
    ]
    expect(getPageCtr(zeroQueries, '/some/page')).toBeNull()
  })
})

// ── updateToolTitleDescription ────────────────────────────────────────────────

describe('updateToolTitleDescription', () => {
  const newTitle = { en: 'New BAC Calculator', ko: '새 BAC 계산기' }
  const newDescription = { en: 'Updated description.', ko: '업데이트된 설명.' }

  test('replaces title and description for the target tool', () => {
    const result = updateToolTitleDescription(
      TOOLS_CONFIG_SNIPPET,
      'bac-calculator',
      newTitle,
      newDescription
    )
    expect(result).toContain("en: 'New BAC Calculator'")
    expect(result).toContain("ko: '새 BAC 계산기'")
    expect(result).toContain("en: 'Updated description.'")
    expect(result).toContain("ko: '업데이트된 설명.'")
  })

  test('leaves the other tool unchanged', () => {
    const result = updateToolTitleDescription(
      TOOLS_CONFIG_SNIPPET,
      'bac-calculator',
      newTitle,
      newDescription
    )
    expect(result).toContain("en: 'Tip Calculator'")
    expect(result).toContain("ko: '팁 계산기'")
    expect(result).toContain("en: 'Calculate the tip.'")
    expect(result).toContain("ko: '팁을 계산하세요.'")
  })

  test('throws when toolId is not found in the file', () => {
    expect(() =>
      updateToolTitleDescription(TOOLS_CONFIG_SNIPPET, 'nonexistent-tool', newTitle, newDescription)
    ).toThrow("Tool 'nonexistent-tool' not found in tools-config.ts")
  })
})

// ── findToolByPage ────────────────────────────────────────────────────────────

describe('findToolByPage', () => {
  const tools = [
    makeTool({ id: 'bac-calculator', slug: 'bac-calculator', category: 'beer' }),
    makeTool({ id: 'tip-calculator', slug: 'tip-calculator', category: 'developer' }),
  ]

  test('finds tool by exact path', () => {
    const tool = findToolByPage(tools, '/beer/bac-calculator')
    expect(tool?.id).toBe('bac-calculator')
  })

  test('finds tool by path with trailing slash', () => {
    const tool = findToolByPage(tools, '/beer/bac-calculator/')
    expect(tool?.id).toBe('bac-calculator')
  })

  test('returns undefined for unknown path', () => {
    expect(findToolByPage(tools, '/unknown/tool')).toBeUndefined()
  })
})

// ── getRequiredKeywordsForTool ────────────────────────────────────────────────

describe('getRequiredKeywordsForTool', () => {
  test('derives EN keyword from slug (hyphens become spaces)', () => {
    const tool = makeTool({ slug: 'bac-calculator', title: { en: 'BAC Calculator', ko: 'BAC 계산기' } })
    const { en } = getRequiredKeywordsForTool(tool)
    expect(en).toBe('bac calculator')
  })

  test('derives KO keyword as first token of KO title', () => {
    const tool = makeTool({ slug: 'bac-calculator', title: { en: 'BAC Calculator', ko: 'BAC 계산기' } })
    const { ko } = getRequiredKeywordsForTool(tool)
    expect(ko).toBe('BAC')
  })
})

// ── deployTitleVariant — YMYL auto-merge guard (critical AC) ──────────────────

describe('deployTitleVariant', () => {
  const variant = {
    title: { en: 'New Title', ko: '새 제목' },
    description: { en: 'New desc', ko: '새 설명' },
  }

  /** Minimal fake tools-config content that deployTitleVariant can mutate. */
  const fakeConfigContent = `
export const toolsConfig = [
  {
    id: 'tip-calculator',
    title: {
      en: 'Tip Calculator',
      ko: '팁 계산기',
    },
    description: {
      en: 'Calculate the tip.',
      ko: '팁을 계산하세요.',
    },
  },
]
`

  function makeOptions(mockFn: SpawnSyncFn) {
    return {
      spawnSyncFn: mockFn,
      toolsConfigPath: '/fake/tools-config.ts',
      cwd: '/fake/cwd',
      readFileFn: () => fakeConfigContent,
      writeFileFn: () => undefined,
    }
  }

  test('YMYL=true: gh pr merge --auto is NEVER called', async () => {
    const { fn, calls } = makeMockSpawn()
    await deployTitleVariant('/developer/tip-calculator', variant, true, 'fake-token', makeOptions(fn))

    const autoMergeCalls = calls.filter(
      (c) => c.cmd === 'gh' && c.args.includes('merge') && c.args.includes('--auto')
    )
    expect(autoMergeCalls).toHaveLength(0)
  })

  test('YMYL=false: gh pr merge --auto IS called exactly once', async () => {
    const { fn, calls } = makeMockSpawn()
    const result = await deployTitleVariant(
      '/developer/tip-calculator',
      variant,
      false,
      'fake-token',
      makeOptions(fn)
    )

    const autoMergeCalls = calls.filter(
      (c) => c.cmd === 'gh' && c.args.includes('merge') && c.args.includes('--auto')
    )
    expect(autoMergeCalls).toHaveLength(1)
    expect(result.autoMerged).toBe(true)
  })

  test('YMYL=true: gh pr create is still called (PR created without auto-merge)', async () => {
    const { fn, calls } = makeMockSpawn()
    const result = await deployTitleVariant(
      '/developer/tip-calculator',
      variant,
      true,
      'fake-token',
      makeOptions(fn)
    )

    const prCreateCalls = calls.filter(
      (c) => c.cmd === 'gh' && c.args.includes('create')
    )
    expect(prCreateCalls).toHaveLength(1)
    expect(result.autoMerged).toBe(false)
  })

  test('YMYL=true: autoMerged field in result is false', async () => {
    const { fn } = makeMockSpawn()
    const result = await deployTitleVariant(
      '/developer/tip-calculator',
      variant,
      true,
      'fake-token',
      makeOptions(fn)
    )
    expect(result.autoMerged).toBe(false)
  })
})
