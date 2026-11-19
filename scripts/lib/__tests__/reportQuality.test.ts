import type { ProcessedDay, ProcessedPage } from '../../process-analytics'
import { aggregateWeeklyReport } from '../aggregateWeeklyReport'
import {
  buildReportFacts,
  findConcentratedPages,
  removeAuditSessions,
  type ReportFact,
} from '../reportFacts'
import {
  buildClaimsPrompt,
  parseClaimsResponse,
  requestReportClaims,
  validateClaims,
  type ReportClaim,
} from '../reportClaims'
import { renderReport } from '../renderReport'

function page(path: string, overrides: Partial<ProcessedPage> = {}): ProcessedPage {
  return {
    path,
    sessions: 0,
    events: {},
    gscImpressions: 0,
    gscClicks: 0,
    gscAvgPosition: null,
    bounceRate: null,
    ...overrides,
  }
}

function day(date: string, pages: ProcessedPage[]): ProcessedDay {
  return { date, pages, queries: [], clarity: null }
}

function fact(id: string, overrides: Partial<ReportFact> = {}): ReportFact {
  return { id, text: id, values: [], subjects: [], sample: 'usable', ...overrides }
}

function claim(text: string, evidence: string[], overrides: Partial<ReportClaim> = {}): ReportClaim {
  return { section: 'quality', kind: 'observation', text, evidence, ...overrides }
}

function rejectedRule(claims: ReportClaim[], facts: ReportFact[]): string | undefined {
  return validateClaims(claims, facts).rejected[0]?.rule
}

describe('removeAuditSessions', () => {
  it('removes one session per audited page on Mondays before the user-agent fix', () => {
    const { days, removedSessions } = removeAuditSessions([
      day('2026-11-16', [
        page('/', { sessions: 1 }),
        page('/beer/bac-calculator/', { sessions: 2 }),
        page('/beer/homebrew-recipe-calculator/', { sessions: 2 }),
      ]),
    ])
    expect(days[0].pages.map((p) => p.sessions)).toEqual([0, 1, 2])
    expect(removedSessions).toBe(2)
  })

  it('leaves other weekdays and Mondays after the fix alone', () => {
    const input = [
      day('2026-11-17', [page('/', { sessions: 1 })]),
      day('2026-11-23', [page('/', { sessions: 1 })]),
    ]
    const { days, removedSessions } = removeAuditSessions(input)
    expect(days.map((d) => d.pages[0].sessions)).toEqual([1, 1])
    expect(removedSessions).toBe(0)
  })
})

describe('findConcentratedPages', () => {
  it('finds pages with at least half of their sessions on one day', () => {
    const days = [
      day('2026-11-09', [page('/spike/', { sessions: 9 }), page('/steady/', { sessions: 2 })]),
      day('2026-11-10', [page('/spike/', { sessions: 1 }), page('/steady/', { sessions: 2 })]),
      day('2026-11-11', [page('/steady/', { sessions: 2 })]),
    ]
    expect([...findConcentratedPages(days)]).toEqual(['/spike/'])
  })
})

describe('buildReportFacts', () => {
  const days = [
    day('2026-11-09', [page('/a/', { sessions: 39, gscClicks: 1, gscImpressions: 20, gscAvgPosition: 5 })]),
    day('2026-11-10', [page('/a/', { sessions: 8, gscClicks: 2, gscImpressions: 30, gscAvgPosition: 10 })]),
  ]
  const facts = buildReportFacts({
    weekly: aggregateWeeklyReport(days),
    days,
    previousWeek: { organicClicks: 5, organicSessions: 26 },
    removedAuditSessions: 5,
    lighthouse: [],
    cleanupCount: 0,
    intents: {},
  })
  const byId = (id: string) => facts.find((f) => f.id === id)

  it('states totals with last week and labels sessions as a per-page sum', () => {
    expect(byId('totals.clicks')?.values).toEqual(expect.arrayContaining([3, 5]))
    expect(byId('totals.sessions')?.text).toContain('페이지별 세션 합계')
    expect(byId('totals.clicks')?.sample).toBe('small')
  })

  it('flags a week whose sessions are concentrated on one day', () => {
    const peak = byId('sessions.peakDay')
    expect(peak?.tags).toContain('concentrated')
    expect(peak?.text).toContain('2026-11-09')
    expect(peak?.values).toEqual(expect.arrayContaining([83, 39, 47]))
  })

  it('reports removed audit sessions and page-level search numbers', () => {
    expect(byId('audit.removedSessions')?.values).toContain(5)
    const a = byId('page:/a/')
    expect(a?.values).toEqual(expect.arrayContaining([3, 50, 8, 47]))
    expect(a?.subjects).toContain('/a/')
  })
})

describe('validateClaims — real errors from past reports', () => {
  const facts = [
    fact('clarity:DeadClickCount', {
      values: [4],
      subjects: ['/ko/fun/chiikawa-personality-test/result/hachiware/'],
      sample: 'small',
      tags: ['url-level'],
    }),
    fact('totals.sessions', { values: [47, 26, 80.8], sample: 'usable' }),
    fact('sessions.peakDay', { values: [83, 39, 47], tags: ['concentrated'] }),
    fact('rank:hydrometer calibration:/beer/h/', {
      values: [73.8, 24, 49.8],
      subjects: ['hydrometer calibration', '/beer/h/'],
      sample: 'small',
    }),
  ]

  it('removes the 2026-11-16 share-button defect claim (R4)', () => {
    expect(
      rejectedRule(
        [
          claim(
            '/ko/fun/chiikawa-personality-test/result/hachiware/에서 데드클릭이 4세션 발생해 공유 버튼의 클릭 핸들러 점검이 필요합니다.',
            ['clarity:DeadClickCount'],
          ),
        ],
        facts,
      ),
    ).toBe('R4')
  })

  it('removes a UI-element guess from URL-level data even without a defect word (R4)', () => {
    expect(
      rejectedRule(
        [claim('이 페이지의 재시작 버튼을 눌렀을 가능성이 있어요.', ['clarity:DeadClickCount'], { kind: 'hypothesis' })],
        facts,
      ),
    ).toBe('R4')
  })

  it('removes session growth claims in a concentrated week (R6)', () => {
    expect(
      rejectedRule([claim('세션이 26건에서 47건으로 늘었습니다.', ['totals.sessions'], { section: 'good_news' })], facts),
    ).toBe('R6')
  })

  it('removes a confident rank claim from a small sample (R5)', () => {
    expect(
      rejectedRule(
        [claim('"hydrometer calibration"이 73.8위에서 24위로 큰 폭 개선됐습니다.', ['rank:hydrometer calibration:/beer/h/'])],
        facts,
      ),
    ).toBe('R5')
  })
})

describe('validateClaims — evidence checks', () => {
  const facts = [
    fact('page:/a/', { values: [3, 50, 7.5], subjects: ['/a/', 'query one'], sample: 'small' }),
    fact('usable', { values: [120], sample: 'usable' }),
  ]

  it('requires existing evidence ids (R1)', () => {
    expect(rejectedRule([claim('근거 없는 문장', [])], facts)).toBe('R1')
    expect(rejectedRule([claim('없는 근거', ['missing'])], facts)).toBe('R1')
  })

  it('requires numbers to match the cited facts, allowing rounding (R2)', () => {
    expect(rejectedRule([claim('/a/의 노출은 51회입니다.', ['page:/a/'])], facts)).toBe('R2')
    expect(validateClaims([claim('/a/의 평균 순위는 8위입니다.', ['page:/a/'])], facts).rejected).toEqual([])
  })

  it('ignores digits inside dates and cited paths', () => {
    const withDigits = [fact('page:/v2/', { values: [1], subjects: ['/v2/'], sample: 'small' })]
    expect(validateClaims([claim('2026-11-09에 /v2/의 클릭은 1건입니다.', ['page:/v2/'])], withDigits).rejected).toEqual([])
  })

  it('requires mentioned paths and quoted queries to be in the cited facts (R3)', () => {
    expect(rejectedRule([claim('/b/의 클릭은 3건입니다.', ['page:/a/'])], facts)).toBe('R3')
    expect(rejectedRule([claim('"other query" 노출은 50회입니다.', ['page:/a/'])], facts)).toBe('R3')
    expect(validateClaims([claim('"query one" 노출은 50회입니다.', ['page:/a/'])], facts).rejected).toEqual([])
  })

  it('removes fault claims regardless of the evidence (R4)', () => {
    expect(rejectedRule([claim('사이트에 버그가 있습니다.', ['usable'])], facts)).toBe('R4')
  })

  it('removes causal statements from small samples unless written as a hypothesis (R5)', () => {
    const text = '제목 때문에 /a/의 클릭이 3건입니다.'
    expect(rejectedRule([claim(text, ['page:/a/'])], facts)).toBe('R5')
    expect(validateClaims([claim(text, ['page:/a/'], { kind: 'hypothesis' })], facts).rejected).toEqual([])
  })

  it('keeps sentences that explicitly decline to conclude (false positives in the first real run)', () => {
    const clarity = fact('clarity:DeadClickCount', { values: [4], sample: 'small', tags: ['url-level'] })
    const clicks = fact('totals.clicks', { values: [3, 5, 40], sample: 'small' })
    const result = validateClaims(
      [
        claim('검색 클릭은 3건으로 소표본이라 감소를 추세로 단정하기 어렵다.', ['totals.clicks']),
        claim('데드클릭은 4세션이지만 어떤 요소에서 발생했는지는 알 수 없다.', ['clarity:DeadClickCount']),
      ],
      [clarity, clicks],
    )
    expect(result.rejected).toEqual([])
  })

  it('still removes large-change wording and defect guesses from hedged sentences', () => {
    const rank = fact('rank:q:/a/', { values: [73.8, 24], subjects: ['q', '/a/'], sample: 'small' })
    expect(rejectedRule([claim('73.8위에서 24위로 큰 폭 상승했으나 단정하기 어렵다.', ['rank:q:/a/'])], [rank])).toBe('R5')
    expect(rejectedRule([claim('버튼 결함인지는 알 수 없다.', ['rank:q:/a/'])], [rank])).toBe('R4')
  })

  it('accepts plain observations and internal-link recommendations', () => {
    const result = validateClaims(
      [
        claim('/a/의 클릭은 3건, 노출은 50회입니다.', ['page:/a/']),
        claim('/a/로 가는 본문 링크를 검토해 보세요.', ['page:/a/'], { kind: 'recommendation' }),
      ],
      facts,
    )
    expect(result.accepted).toHaveLength(2)
    expect(result.rejected).toEqual([])
  })
})

describe('parseClaimsResponse', () => {
  it('reads a valid claims object', () => {
    const parsed = parseClaimsResponse(
      JSON.stringify({ claims: [{ section: 'ideas', kind: 'recommendation', text: 'x', evidence: ['a'] }] }),
    )
    expect(parsed).toHaveLength(1)
  })

  it.each(['not json', '{}', '{"claims":[{"section":"nope","kind":"observation","text":"x","evidence":[]}]}'])(
    'rejects %s',
    (text) => {
      expect(parseClaimsResponse(text)).toBeNull()
    },
  )
})

describe('buildClaimsPrompt', () => {
  it('lists fact ids and says history is not evidence', () => {
    const prompt = buildClaimsPrompt([fact('totals.clicks', { text: '클릭 3건', sample: 'small' })], '과거 기록')
    expect(prompt).toContain('[totals.clicks]')
    expect(prompt).toContain('소표본')
    expect(prompt).toContain('과거 기록')
    expect(prompt).toContain('근거로 인용할 수 없')
  })
})

describe('requestReportClaims', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  function reply(text: string, stopReason = 'end_turn'): Response {
    return {
      ok: true,
      json: async () => ({ content: [{ type: 'text', text }], stop_reason: stopReason }),
    } as unknown as Response
  }

  const valid = JSON.stringify({ claims: [] })

  it('asks for schema-constrained JSON', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(reply(valid))
    global.fetch = fetchMock
    await expect(requestReportClaims('p', 'key')).resolves.toEqual([])
    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))
    expect(body.output_config.format.type).toBe('json_schema')
    expect(body.output_config.format.schema.required).toEqual(['claims'])
  })

  it('retries once after invalid JSON', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const fetchMock = jest.fn().mockResolvedValueOnce(reply('oops')).mockResolvedValueOnce(reply(valid))
    global.fetch = fetchMock
    await expect(requestReportClaims('p', 'key')).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each(['max_tokens', 'refusal'])('returns null when every attempt stops with %s', async (reason) => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    global.fetch = jest.fn().mockResolvedValue(reply(valid, reason))
    await expect(requestReportClaims('p', 'key')).resolves.toBeNull()
  })

  it('returns null on HTTP and network failures', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' } as unknown as Response)
      .mockRejectedValueOnce(new Error('network'))
    await expect(requestReportClaims('p', 'key')).resolves.toBeNull()
  })
})

describe('renderReport', () => {
  const base = {
    periodStart: '2026-11-14',
    periodEnd: '2026-11-20',
    facts: [fact('totals.clicks', { text: '검색 클릭 3건', sample: 'small' as const })],
    cleanupCandidates: [{ slug: 'json-to-sql', addedAt: '2026-07-23', sessions: 0 }],
    appendSections: ['## ⚠️ 성능 경고\n\n내용'],
  }

  it('puts verified facts first, labels hypotheses and lists removed claims', () => {
    const report = renderReport({
      ...base,
      status: 'analyzed',
      accepted: [
        claim('관찰 문장', ['totals.clicks'], { section: 'good_news' }),
        claim('가설 문장', ['totals.clicks'], { section: 'zero_ctr', kind: 'hypothesis' }),
        claim('제안 문장', ['totals.clicks'], { section: 'ideas', kind: 'recommendation' }),
      ],
      rejected: [{ claim: claim('틀린 문장', []), rule: 'R1', reason: '근거 없음' }],
    })
    expect(report.indexOf('## 검증된 사실')).toBeLessThan(report.indexOf('## 분석'))
    expect(report).toContain('가설: 가설 문장')
    expect(report).toContain('제안: 제안 문장')
    expect(report).toContain('## 제거된 주장 (1건)')
    expect(report).toContain('틀린 문장')
    expect(report).toContain('json-to-sql')
    expect(report).toContain('## ⚠️ 성능 경고')
  })

  it('publishes facts only, with a notice, when the analysis failed', () => {
    const report = renderReport({ ...base, status: 'facts-only', accepted: [], rejected: [] })
    expect(report).toContain('AI 분석을 생성하지 못해')
    expect(report).toContain('검색 클릭 3건')
    expect(report).not.toContain('## 분석')
  })
})
