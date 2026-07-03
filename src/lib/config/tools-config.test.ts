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

// Helper: temporarily splice mock data into toolsConfig for a test
function withMockTools<T>(fn: () => T): T {
  toolsConfig.push(...mockTools)
  try {
    return fn()
  } finally {
    toolsConfig.splice(0, toolsConfig.length)
  }
}

describe('toolsConfig', () => {
  it('starts as an empty array', () => {
    expect(toolsConfig).toEqual([])
  })
})

describe('TOOL_CATEGORIES', () => {
  it('contains all four categories in order', () => {
    expect(TOOL_CATEGORIES).toEqual(['developer', 'travel', 'beer', 'baby'])
  })
})

describe('getToolsByCategory', () => {
  it('returns empty array when toolsConfig is empty', () => {
    expect(getToolsByCategory('developer')).toEqual([])
  })

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
  it('returns undefined when toolsConfig is empty', () => {
    expect(getToolBySlug('developer', 'json-formatter')).toBeUndefined()
  })

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
  it('returns empty array when toolsConfig is empty', () => {
    expect(getPopularTools()).toEqual([])
  })

  it('returns only popular tools', () => {
    withMockTools(() => {
      const result = getPopularTools()
      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('json-formatter')
    })
  })
})

describe('getRecentTools', () => {
  it('returns empty array when toolsConfig is empty', () => {
    expect(getRecentTools(3)).toEqual([])
  })

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

  it('returns empty array when toolsConfig is empty', () => {
    expect(getRelatedTools('json-formatter')).toEqual([])
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
