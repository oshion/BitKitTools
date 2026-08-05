/**
 * @jest-environment node
 */

import { classifyIntentRuleBased, classifyAmbiguousQueries } from '../classifyIntent'

// ── classifyIntentRuleBased ───────────────────────────────────────────────────

describe('classifyIntentRuleBased', () => {
  // tool
  describe('tool', () => {
    it('matches "calculator" (EN)', () => {
      expect(classifyIntentRuleBased('bac calculator')).toBe('tool')
    })
    it('matches "converter" (EN)', () => {
      expect(classifyIntentRuleBased('unit converter online')).toBe('tool')
    })
    it('matches "generator" (EN)', () => {
      expect(classifyIntentRuleBased('password generator free')).toBe('tool')
    })
    it('matches "decoder" (EN)', () => {
      expect(classifyIntentRuleBased('jwt decoder tool')).toBe('tool')
    })
    it('matches "formatter" (EN)', () => {
      expect(classifyIntentRuleBased('json formatter')).toBe('tool')
    })
    it('matches "checker" (EN)', () => {
      expect(classifyIntentRuleBased('visa requirement checker')).toBe('tool')
    })
    it('matches "계산기" (KO)', () => {
      expect(classifyIntentRuleBased('bac 계산기')).toBe('tool')
    })
    it('matches "변환기" (KO)', () => {
      expect(classifyIntentRuleBased('단위 변환기')).toBe('tool')
    })
    it('matches "생성기" (KO)', () => {
      expect(classifyIntentRuleBased('비밀번호 생성기')).toBe('tool')
    })
    it('matches "디코더" (KO)', () => {
      expect(classifyIntentRuleBased('jwt 디코더')).toBe('tool')
    })
    it('is case-insensitive (CALCULATOR)', () => {
      expect(classifyIntentRuleBased('BLOOD ALCOHOL CALCULATOR')).toBe('tool')
    })
  })

  // tutorial
  describe('tutorial', () => {
    it('matches "how to" (EN)', () => {
      expect(classifyIntentRuleBased('how to calculate bac')).toBe('tutorial')
    })
    it('matches "tutorial" (EN)', () => {
      // No tool keyword in this query — tutorial wins
      expect(classifyIntentRuleBased('blood alcohol tutorial')).toBe('tutorial')
    })
    it('matches "guide" (EN)', () => {
      expect(classifyIntentRuleBased('homebrew recipe guide')).toBe('tutorial')
    })
    it('matches "사용법" (KO)', () => {
      // No tool keyword — 사용법 (tutorial) wins
      expect(classifyIntentRuleBased('혈중알코올농도 사용법')).toBe('tutorial')
    })
    it('matches "방법" (KO)', () => {
      // "bac 계산 방법" — no tool keyword (계산기 would match but 계산 alone doesn't)
      expect(classifyIntentRuleBased('bac 계산 방법')).toBe('tutorial')
    })
  })

  // comparison
  describe('comparison', () => {
    it('matches " vs " with spaces (EN)', () => {
      expect(classifyIntentRuleBased('WHO vs CDC growth charts')).toBe('comparison')
    })
    it('matches "vs." (EN)', () => {
      expect(classifyIntentRuleBased('who vs. cdc standards')).toBe('comparison')
    })
    it('matches "compare" (EN)', () => {
      expect(classifyIntentRuleBased('compare flight delay compensation rules')).toBe('comparison')
    })
    it('matches "비교" (KO)', () => {
      expect(classifyIntentRuleBased('WHO CDC 기준 비교')).toBe('comparison')
    })
    it('matches "차이" (KO)', () => {
      expect(classifyIntentRuleBased('표준잔 단위 차이')).toBe('comparison')
    })
    it('does NOT match "vs" without spaces (no false positive)', () => {
      // "invs" or "kvs" should not match
      expect(classifyIntentRuleBased('previous')).toBe('ambiguous')
    })
  })

  // problem-solving
  describe('problem-solving', () => {
    it('matches "fix" (EN)', () => {
      expect(classifyIntentRuleBased('fix json parse error')).toBe('problem-solving')
    })
    it('matches "error" (EN)', () => {
      expect(classifyIntentRuleBased('jwt error invalid signature')).toBe('problem-solving')
    })
    it('matches "not working" (EN)', () => {
      // No tool keyword — problem-solving wins
      expect(classifyIntentRuleBased('blood alcohol concentration not working')).toBe('problem-solving')
    })
    it('matches "안됨" (KO)', () => {
      expect(classifyIntentRuleBased('json 포맷 안됨')).toBe('problem-solving')
    })
    it('matches "안돼" (KO)', () => {
      expect(classifyIntentRuleBased('비밀번호 생성 안돼')).toBe('problem-solving')
    })
    it('matches "오류" (KO)', () => {
      expect(classifyIntentRuleBased('json parse 오류')).toBe('problem-solving')
    })
    it('matches "문제" (KO)', () => {
      expect(classifyIntentRuleBased('홈브루 계산 문제')).toBe('problem-solving')
    })
  })

  // ambiguous
  describe('ambiguous', () => {
    it('returns ambiguous for unmatched queries (EN)', () => {
      expect(classifyIntentRuleBased('baby growth percentile')).toBe('ambiguous')
    })
    it('returns ambiguous for unmatched queries (KO)', () => {
      expect(classifyIntentRuleBased('항공편 지연 보상')).toBe('ambiguous')
    })
    it('returns ambiguous for empty string', () => {
      expect(classifyIntentRuleBased('')).toBe('ambiguous')
    })
  })

  // priority: tool wins over tutorial when both match
  describe('priority', () => {
    it('tool beats tutorial when both patterns match', () => {
      // "how to use calculator" matches both tutorial (how to) and tool (calculator)
      // tool is priority 1, tutorial is priority 2 → should return 'tool'
      expect(classifyIntentRuleBased('how to use bac calculator')).toBe('tool')
    })
    it('tool beats problem-solving when both match', () => {
      // "error in calculator" matches both tool and problem-solving → tool wins
      expect(classifyIntentRuleBased('error in calculator')).toBe('tool')
    })
    it('tutorial beats comparison when both match', () => {
      // "how to compare" matches both tutorial (how to) and comparison (compare)
      // tutorial is priority 2, comparison is priority 3 → tutorial wins
      expect(classifyIntentRuleBased('how to compare standards')).toBe('tutorial')
    })
  })
})

// ── classifyAmbiguousQueries ──────────────────────────────────────────────────

describe('classifyAmbiguousQueries', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('returns empty Map and does NOT call fetch when queries is empty', async () => {
    const result = await classifyAmbiguousQueries([], 'test-api-key')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.size).toBe(0)
  })

  it('parses a successful JSON response correctly', async () => {
    const queries = ['baby sleep schedule', 'flight delay EU']
    const mockBody = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            'baby sleep schedule': 'tutorial',
            'flight delay EU': 'tool',
          }),
        },
      ],
    }
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBody,
    } as unknown as Response)

    const result = await classifyAmbiguousQueries(queries, 'test-api-key')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result.get('baby sleep schedule')).toBe('tutorial')
    expect(result.get('flight delay EU')).toBe('tool')
  })

  it('handles model response with extra text around JSON (lenient parse)', async () => {
    const queries = ['homebrew abv']
    const mockBody = {
      content: [
        {
          type: 'text',
          text: 'Here is the classification:\n{"homebrew abv": "tool"}\nDone.',
        },
      ],
    }
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBody,
    } as unknown as Response)

    const result = await classifyAmbiguousQueries(queries, 'test-api-key')
    expect(result.get('homebrew abv')).toBe('tool')
  })

  it('returns all ambiguous when fetch rejects (network error)', async () => {
    const queries = ['something ambiguous', 'another one']
    fetchSpy.mockRejectedValueOnce(new Error('Network failure'))

    const result = await classifyAmbiguousQueries(queries, 'test-api-key')
    expect(result.get('something ambiguous')).toBe('ambiguous')
    expect(result.get('another one')).toBe('ambiguous')
  })

  it('returns all ambiguous when API returns non-ok status', async () => {
    const queries = ['some query']
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    } as unknown as Response)

    const result = await classifyAmbiguousQueries(queries, 'test-api-key')
    expect(result.get('some query')).toBe('ambiguous')
  })

  it('returns all ambiguous when response JSON has no recognisable JSON object', async () => {
    const queries = ['mystery query']
    const mockBody = {
      content: [{ type: 'text', text: 'Sorry, I cannot classify this.' }],
    }
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBody,
    } as unknown as Response)

    const result = await classifyAmbiguousQueries(queries, 'test-api-key')
    expect(result.get('mystery query')).toBe('ambiguous')
  })

  it('falls back to ambiguous for individual queries with unknown category values', async () => {
    const queries = ['weird query']
    const mockBody = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ 'weird query': 'unknown-category' }),
        },
      ],
    }
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBody,
    } as unknown as Response)

    const result = await classifyAmbiguousQueries(queries, 'test-api-key')
    expect(result.get('weird query')).toBe('ambiguous')
  })

  it('sends all queries in a single batch call', async () => {
    const queries = ['query one', 'query two', 'query three']
    const mockBody = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            'query one': 'ambiguous',
            'query two': 'tutorial',
            'query three': 'comparison',
          }),
        },
      ],
    }
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBody,
    } as unknown as Response)

    await classifyAmbiguousQueries(queries, 'test-api-key')

    // Must be exactly one call regardless of query count
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not include API key in hardcoded form — passes it from argument', async () => {
    const queries = ['test query']
    const mockBody = {
      content: [{ type: 'text', text: JSON.stringify({ 'test query': 'tool' }) }],
    }
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBody,
    } as unknown as Response)

    await classifyAmbiguousQueries(queries, 'my-secret-key')

    const callArgs = fetchSpy.mock.calls[0] as [string, RequestInit]
    const headers = callArgs[1].headers as Record<string, string>
    expect(headers['x-api-key']).toBe('my-secret-key')
  })
})
