import {
  computeEngagementRates,
  summarizeClaritySignals,
  MIN_SESSIONS_FOR_ENGAGEMENT,
} from '../toolQualitySignals'

describe('computeEngagementRates', () => {
  test('computes inputEnterCount / sessions per page', () => {
    const sessions = new Map([['/beer/bac-calculator/', 10]])
    const inputEnter = new Map([['/beer/bac-calculator/', 4]])

    const result = computeEngagementRates(sessions, inputEnter)

    expect(result).toEqual([
      {
        path: '/beer/bac-calculator/',
        sessions: 10,
        inputEnterCount: 4,
        engagementRate: 0.4,
      },
    ])
  })

  test('excludes pages below MIN_SESSIONS_FOR_ENGAGEMENT', () => {
    const sessions = new Map([['/developer/json-formatter/', MIN_SESSIONS_FOR_ENGAGEMENT - 1]])
    const inputEnter = new Map([['/developer/json-formatter/', 1]])

    expect(computeEngagementRates(sessions, inputEnter)).toEqual([])
  })

  test('includes a page exactly at the threshold', () => {
    const sessions = new Map([['/developer/json-formatter/', MIN_SESSIONS_FOR_ENGAGEMENT]])
    const inputEnter = new Map([['/developer/json-formatter/', 2]])

    expect(computeEngagementRates(sessions, inputEnter)).toHaveLength(1)
  })

  test('treats a page with no input_enter events as 0 engagement', () => {
    const sessions = new Map([['/beer/bac-calculator/', 10]])
    const inputEnter = new Map<string, number>()

    const result = computeEngagementRates(sessions, inputEnter)

    expect(result[0]?.inputEnterCount).toBe(0)
    expect(result[0]?.engagementRate).toBe(0)
  })

  test('sorts ascending by engagement rate (lowest first)', () => {
    const sessions = new Map([
      ['/high/', 10],
      ['/low/', 10],
      ['/mid/', 10],
    ])
    const inputEnter = new Map([
      ['/high/', 9],
      ['/low/', 1],
      ['/mid/', 5],
    ])

    const result = computeEngagementRates(sessions, inputEnter)

    expect(result.map((r) => r.path)).toEqual(['/low/', '/mid/', '/high/'])
  })
})

describe('summarizeClaritySignals', () => {
  // Row shape verified against real Clarity Data Export rows (data/raw/clarity-2026-10-29.json):
  // one row per URL, with the share of that URL's sessions in which the metric occurred.
  function row(url: string, sessionsCount: number, pct: number): Record<string, unknown> {
    return {
      sessionsCount,
      sessionsWithMetricPercentage: pct,
      sessionsWithoutMetricPercentage: 100 - pct,
      pagesViews: 0,
      subTotal: 0,
      Url: url,
    }
  }

  test('returns an empty array when every day has only empty information arrays', () => {
    const days = [
      [
        { metricName: 'DeadClickCount', information: [] },
        { metricName: 'RageClickCount', information: [] },
      ],
    ]
    expect(summarizeClaritySignals(days)).toEqual([])
  })

  test('ignores unwatched metrics (e.g. EngagementTime, Traffic)', () => {
    const days = [[{ metricName: 'Traffic', information: [{ totalSessionCount: 3, Url: 'https://bitkittools.com/' }] }]]
    expect(summarizeClaritySignals(days)).toEqual([])
  })

  test('does not report a metric whose rows all have 0% of sessions affected — regression for the 2026-11-02 report that called 5 zero-percent ScriptErrorCount rows "5 script errors"', () => {
    const days = [
      [{ metricName: 'ScriptErrorCount', information: [row('https://bitkittools.com/baby/temperament-quiz/', 1, 0)] }],
      [
        {
          metricName: 'ScriptErrorCount',
          information: [
            row('https://bitkittools.com/travel/layover-connection-calculator/', 2, 0),
            row('https://bitkittools.com/ko/travel/layover-connection-calculator/', 1, 0),
          ],
        },
      ],
    ]
    expect(summarizeClaritySignals(days)).toEqual([])
  })

  test('counts affected sessions (sessionsCount x percentage) and lists only affected pages from the Url field', () => {
    const days = [
      [
        {
          metricName: 'DeadClickCount',
          information: [
            row('https://bitkittools.com/travel/layover-connection-calculator/', 2, 0),
            row('https://bitkittools.com/ko/travel/layover-connection-calculator/', 1, 100),
          ],
        },
      ],
    ]
    expect(summarizeClaritySignals(days)).toEqual([
      {
        metricName: 'DeadClickCount',
        affectedSessionCount: 1,
        samplePages: ['https://bitkittools.com/ko/travel/layover-connection-calculator/'],
      },
    ])
  })

  test('accumulates the same metric across multiple days and rounds partial percentages', () => {
    const days = [
      [{ metricName: 'RageClickCount', information: [row('https://bitkittools.com/a/', 4, 50)] }],
      [{ metricName: 'RageClickCount', information: [row('https://bitkittools.com/b/', 3, 33.33)] }],
    ]
    expect(summarizeClaritySignals(days)).toEqual([
      {
        metricName: 'RageClickCount',
        affectedSessionCount: 3,
        samplePages: ['https://bitkittools.com/a/', 'https://bitkittools.com/b/'],
      },
    ])
  })

  test('caps samplePages at 5 distinct URLs', () => {
    const information = Array.from({ length: 8 }, (_, i) => row(`https://bitkittools.com/page-${i}/`, 1, 100))
    const result = summarizeClaritySignals([[{ metricName: 'ScriptErrorCount', information }]])
    expect(result[0]?.affectedSessionCount).toBe(8)
    expect(result[0]?.samplePages).toHaveLength(5)
  })

  test('sorts by affectedSessionCount descending', () => {
    const days = [
      [
        { metricName: 'DeadClickCount', information: [row('a', 1, 100)] },
        { metricName: 'RageClickCount', information: [row('a', 3, 100)] },
      ],
    ]
    expect(summarizeClaritySignals(days).map((r) => r.metricName)).toEqual(['RageClickCount', 'DeadClickCount'])
  })

  test('is defensive against malformed/unexpected day entries', () => {
    const days: unknown[] = [
      null,
      undefined,
      'not-an-array',
      [null, { metricName: 'DeadClickCount' }, { information: [] }],
      [
        {
          metricName: 'RageClickCount',
          information: [{ Url: 42, sessionsCount: 2, sessionsWithMetricPercentage: 100 }, 'not-an-object', { Url: 'x' }],
        },
      ],
    ]
    // Rows without numeric counts contribute nothing; a row with counts but no usable Url
    // still counts sessions but adds no sample page.
    expect(summarizeClaritySignals(days)).toEqual([
      { metricName: 'RageClickCount', affectedSessionCount: 2, samplePages: [] },
    ])
  })
})
