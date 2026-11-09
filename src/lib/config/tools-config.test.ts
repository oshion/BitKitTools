import type { ToolConfig } from '@/types/tool'
import {
  toolsConfig,
  TOOL_CATEGORIES,
  getToolBySlug,
  getToolsByCategory,
  getPopularTools,
  getRecentTools,
  getRelatedTools,
} from './tools-config'

// Mock fixtures — used only within this test file. tools-config.ts itself is not modified.
const mockTools: ToolConfig[] = [
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    category: 'developer',
    title: { en: 'JSON Formatter', ko: 'JSON 포맷터' },
    description: { en: 'Format JSON', ko: 'JSON 포맷' },
    keywords: { en: ['json'], ko: ['json'] },
    schemaType: 'WebApplication',
    faq: [],
    relatedToolIds: ['password-generator'],
    adSlots: [],
    ogImage: '/og/json-formatter.png',
    status: 'validated',
    disclaimerType: 'general',
    aiOverviewResistance: 'high',
    addedAt: '2024-01-10',
    popular: true,
  },
  {
    id: 'password-generator',
    slug: 'password-generator',
    category: 'developer',
    title: { en: 'Password Generator', ko: '비밀번호 생성기' },
    description: { en: 'Generate passwords', ko: '비밀번호 생성' },
    keywords: { en: ['password'], ko: ['비밀번호'] },
    schemaType: 'WebApplication',
    faq: [],
    relatedToolIds: [],
    adSlots: [],
    ogImage: '/og/password-generator.png',
    status: 'testing',
    disclaimerType: 'general',
    aiOverviewResistance: 'high',
    addedAt: '2024-02-01',
    popular: false,
  },
  {
    id: 'bac-calculator',
    slug: 'bac-calculator',
    category: 'beer',
    title: { en: 'BAC Calculator', ko: 'BAC 계산기' },
    description: { en: 'Calculate BAC', ko: 'BAC 계산' },
    keywords: { en: ['bac'], ko: ['bac'] },
    schemaType: 'WebApplication',
    faq: [],
    relatedToolIds: [],
    adSlots: [],
    ogImage: '/og/bac-calculator.png',
    status: 'testing',
    disclaimerType: 'medical',
    aiOverviewResistance: 'high',
    addedAt: '2024-01-20',
    popular: false,
  },
]

// Helper: replace toolsConfig with mock data for the duration of the test,
// then restore original entries. This avoids coupling tests to the real config.
function withMockTools<T>(fn: () => T): T {
  const original = toolsConfig.splice(0, toolsConfig.length)
  toolsConfig.push(...mockTools)
  try {
    return fn()
  } finally {
    toolsConfig.splice(0, toolsConfig.length, ...original)
  }
}

describe('toolsConfig', () => {
  it('is an array', () => {
    expect(Array.isArray(toolsConfig)).toBe(true)
  })

  it('every entry satisfies the ToolConfig schema', () => {
    for (const tool of toolsConfig) {
      expect(typeof tool.id).toBe('string')
      expect(typeof tool.slug).toBe('string')
      expect(['developer', 'travel', 'beer', 'baby', 'fun']).toContain(tool.category)
      expect(typeof tool.title.en).toBe('string')
      expect(typeof tool.title.ko).toBe('string')
      expect(Array.isArray(tool.adSlots)).toBe(true)
      expect(Array.isArray(tool.faq)).toBe(true)
    }
  })
})

describe('TOOL_CATEGORIES', () => {
  it('contains all five categories in order, with fun last', () => {
    expect(TOOL_CATEGORIES).toEqual(['developer', 'travel', 'beer', 'baby', 'fun'])
  })
})

describe('getToolsByCategory', () => {
  it('returns only tools matching the given category', () => {
    withMockTools(() => {
      const result = getToolsByCategory('developer')
      expect(result).toHaveLength(2)
      expect(result.every((t) => t.category === 'developer')).toBe(true)
    })
  })

  it('returns empty array for a category with no tools', () => {
    withMockTools(() => {
      expect(getToolsByCategory('travel')).toEqual([])
    })
  })
})

describe('getToolBySlug', () => {
  it('returns the matching tool', () => {
    withMockTools(() => {
      const result = getToolBySlug('developer', 'json-formatter')
      expect(result?.id).toBe('json-formatter')
    })
  })

  it('returns undefined when slug exists but category differs', () => {
    withMockTools(() => {
      expect(getToolBySlug('beer', 'json-formatter')).toBeUndefined()
    })
  })
})

describe('getPopularTools', () => {
  it('returns only popular tools', () => {
    withMockTools(() => {
      const result = getPopularTools()
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('json-formatter')
    })
  })
})

describe('getRecentTools', () => {
  it('returns at most limit items', () => {
    withMockTools(() => {
      expect(getRecentTools(2)).toHaveLength(2)
    })
  })

  it('returns items sorted by addedAt descending', () => {
    withMockTools(() => {
      const result = getRecentTools(3)
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]!.addedAt >= result[i]!.addedAt).toBe(true)
      }
    })
  })

  it('returns all items when limit exceeds toolsConfig length', () => {
    withMockTools(() => {
      expect(getRecentTools(100)).toHaveLength(mockTools.length)
    })
  })
})

describe('getRelatedTools', () => {
  it('returns empty array for non-existent toolId without throwing', () => {
    expect(() => getRelatedTools('nonexistent-id')).not.toThrow()
    expect(getRelatedTools('nonexistent-id')).toEqual([])
  })

  it('resolves relatedToolIds to actual ToolConfig objects', () => {
    withMockTools(() => {
      const result = getRelatedTools('json-formatter')
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('password-generator')
    })
  })

  it('silently skips relatedToolIds that do not exist in toolsConfig', () => {
    withMockTools(() => {
      // bac-calculator has no related tools, but we test a tool pointing to a missing id
      // Temporarily add a tool with a dangling reference
      const dangling: ToolConfig = {
        ...mockTools[0]!,
        id: 'dangling-tool',
        slug: 'dangling-tool',
        relatedToolIds: ['does-not-exist'],
      }
      toolsConfig.push(dangling)
      expect(() => getRelatedTools('dangling-tool')).not.toThrow()
      expect(getRelatedTools('dangling-tool')).toEqual([])
    })
  })
})

describe('layover-connection-calculator FAQ', () => {
  const layover = getToolBySlug('travel', 'layover-connection-calculator')

  it('answers whether checked baggage makes a tight connection', () => {
    const q = layover?.faq.find((item) => /checked bag/i.test(item.question.en))
    expect(q).toBeDefined()
    expect(q?.question.ko).toMatch(/수하물/)
    expect(q?.answer.en).toMatch(/separate tickets/i)
  })

  it('answers whether you can leave the airport during a layover', () => {
    const q = layover?.faq.find((item) => /leave the airport/i.test(item.question.en))
    expect(q).toBeDefined()
    expect(q?.question.ko).toMatch(/공항 밖/)
    expect(q?.answer.en).toMatch(/visa/i)
  })
})

describe('layover-connection-calculator KO search snippet', () => {
  // KO page sat at avg position 5-10 for 5 weeks with 1 click in 87 impressions
  // (report-review 2026-11-02): the KO title/description must state the concrete value.
  const layover = getToolBySlug('travel', 'layover-connection-calculator')

  it('KO title names minimum connecting time and the "is it enough" check', () => {
    expect(layover?.title.ko).toMatch(/환승 시간 계산기/)
    expect(layover?.title.ko).toMatch(/최소환승시간/)
    expect(layover?.title.ko).toMatch(/충분한지/)
  })

  it('KO description leads with the user question and names major hubs', () => {
    expect(layover?.description.ko.startsWith('내 환승 시간이 충분한지')).toBe(true)
    expect(layover?.description.ko).toMatch(/인천/)
    expect(layover?.description.ko).toMatch(/항공사에 확인/)
  })
})

describe('chiikawa-personality-test entry', () => {
  const tool = getToolBySlug('fun', 'chiikawa-personality-test')

  it('is a fun-category tool with a general disclaimer', () => {
    expect(tool).toBeDefined()
    expect(tool?.id).toBe('chiikawa-personality-test')
    expect(tool?.category).toBe('fun')
    expect(tool?.disclaimerType).toBe('general')
    expect(tool?.aiOverviewResistance).toBe('medium')
    expect(tool?.relatedToolIds).toEqual([])
  })

  it('is listed by getToolsByCategory("fun")', () => {
    expect(getToolsByCategory('fun').map((t) => t.id)).toContain('chiikawa-personality-test')
  })

  it('has 4-5 FAQ items with EN and KO text', () => {
    expect(tool?.faq.length).toBeGreaterThanOrEqual(4)
    expect(tool?.faq.length).toBeLessThanOrEqual(5)
    for (const item of tool?.faq ?? []) {
      for (const locale of ['en', 'ko'] as const) {
        expect(item.question[locale].length).toBeGreaterThan(0)
        expect(item.answer[locale].length).toBeGreaterThan(0)
      }
    }
  })

  it('never mentions MBTI in title, description, keywords or FAQ', () => {
    expect(tool).toBeDefined()
    if (!tool) return
    const strings: string[] = []
    for (const locale of ['en', 'ko'] as const) {
      strings.push(tool.title[locale], tool.description[locale], ...tool.keywords[locale])
      for (const item of tool.faq) strings.push(item.question[locale], item.answer[locale])
    }
    for (const s of strings) expect(s).not.toMatch(/mbti/i)
  })

  it('is not referenced by any other tool as a related tool', () => {
    const referrers = toolsConfig.filter((t) => t.relatedToolIds.includes('chiikawa-personality-test'))
    expect(referrers).toEqual([])
  })
})
