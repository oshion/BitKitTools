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
    const days = [
      [{ metricName: 'EngagementTime', information: [{ URL: 'https://bitkittools.com/' }] }],
    ]

    expect(summarizeClaritySignals(days)).toEqual([])
  })

  test('counts affected rows and extracts distinct URLs for a watched metric', () => {
    const days = [
      [
        {
          metricName: 'RageClickCount',
          information: [
            { URL: 'https://bitkittools.com/beer/bac-calculator/', 'Country/Region': 'USA' },
            { URL: 'https://bitkittools.com/beer/bac-calculator/', 'Country/Region': 'KOR' },
          ],
        },
      ],
    ]

    expect(summarizeClaritySignals(days)).toEqual([
      {
        metricName: 'RageClickCount',
        affectedRowCount: 2,
        samplePages: ['https://bitkittools.com/beer/bac-calculator/'],
      },
    ])
  })

  test('accumulates the same metric across multiple days', () => {
    const days = [
      [{ metricName: 'DeadClickCount', information: [{ URL: 'https://bitkittools.com/a/' }] }],
      [{ metricName: 'DeadClickCount', information: [{ URL: 'https://bitkittools.com/b/' }] }],
    ]

    const result = summarizeClaritySignals(days)

    expect(result).toEqual([
      {
        metricName: 'DeadClickCount',
        affectedRowCount: 2,
        samplePages: expect.arrayContaining([
          'https://bitkittools.com/a/',
          'https://bitkittools.com/b/',
        ]),
      },
    ])
  })

  test('caps samplePages at 5 distinct URLs', () => {
    const information = Array.from({ length: 8 }, (_, i) => ({
      URL: `https://bitkittools.com/page-${i}/`,
    }))
    const days = [[{ metricName: 'ScriptErrorCount', information }]]

    const result = summarizeClaritySignals(days)

    expect(result[0]?.affectedRowCount).toBe(8)
    expect(result[0]?.samplePages).toHaveLength(5)
  })

  test('sorts by affectedRowCount descending', () => {
    const days = [
      [
        { metricName: 'DeadClickCount', information: [{ URL: 'a' }] },
        {
          metricName: 'RageClickCount',
          information: [{ URL: 'a' }, { URL: 'b' }, { URL: 'c' }],
        },
      ],
    ]

    const result = summarizeClaritySignals(days)

    expect(result.map((r) => r.metricName)).toEqual(['RageClickCount', 'DeadClickCount'])
  })

  test('is defensive against malformed/unexpected day entries', () => {
    const days: unknown[] = [
      null,
      undefined,
      'not-an-array',
      [null, { metricName: 'DeadClickCount' }, { information: [] }],
      [{ metricName: 'RageClickCount', information: [{ URL: 42 }, 'not-an-object'] }],
    ]

    // Should not throw, and rows without a usable URL contribute to the
    // count but not to samplePages.
    const result = summarizeClaritySignals(days)
    expect(result).toEqual([
      { metricName: 'RageClickCount', affectedRowCount: 2, samplePages: [] },
    ])
  })
})
