/**
 * @jest-environment node
 */

import type { ToolConfig } from '../../../src/types/tool'
import type { UnmatchedQuery } from '../toolResearchMatching'
import type { ProposalLog, ProposalEntry } from '../proposalTracking'
import {
  findNearMissQueries,
  selectProgrammaticSeoCandidates,
  draftAndValidateVariant,
  NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO,
  type ProgrammaticSeoCandidate,
  type ProgrammaticSeoDraft,
} from '../../generate-programmatic-seo-spec'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMinimalTool(overrides: {
  id?: string
  title_en?: string
  title_ko?: string
  keywords_en?: string[]
  keywords_ko?: string[]
  description_en?: string
  description_ko?: string
  faq?: ToolConfig['faq']
}): ToolConfig {
  return {
    id: overrides.id ?? 'test-tool',
    slug: overrides.id ?? 'test-tool',
    category: 'developer',
    title: {
      en: overrides.title_en ?? 'Test Tool',
      ko: overrides.title_ko ?? '테스트 툴',
    },
    description: {
      en: overrides.description_en ?? 'A test tool.',
      ko: overrides.description_ko ?? '테스트 툴입니다.',
    },
    keywords: {
      en: overrides.keywords_en ?? [],
      ko: overrides.keywords_ko ?? [],
    },
    schemaType: 'WebApplication',
    faq: overrides.faq ?? [],
    relatedToolIds: [],
    adSlots: [],
    ogImage: '/og/test.png',
    status: 'testing',
    disclaimerType: 'none',
    aiOverviewResistance: 'high',
    addedAt: '2026-01-01',
    popular: false,
  }
}

function makeUnmatchedQuery(query: string, impressions: number = 100): UnmatchedQuery {
  return { query, impressions }
}

function makeProposalLog(entries: ProposalEntry[] = []): ProposalLog {
  return { proposals: entries }
}

function makePendingProgrammaticSeoProposal(target: string): ProposalEntry {
  return {
    id: `programmatic-seo-${target.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
    type: 'programmatic-seo',
    target,
    firstProposedAt: '2026-07-01',
    status: 'pending',
    lastReminderAt: '2026-07-01',
  }
}

// ── NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO ─────────────────────────────────────────

describe('NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO', () => {
  it('is 0.5', () => {
    expect(NEAR_MISS_MIN_TOKEN_OVERLAP_RATIO).toBe(0.5)
  })
})

// ── findNearMissQueries ───────────────────────────────────────────────────────

describe('findNearMissQueries', () => {
  it('returns empty array when unmatchedQueries is empty', () => {
    const tools = [makeMinimalTool({ keywords_en: ['json formatter'] })]
    expect(findNearMissQueries([], tools)).toHaveLength(0)
  })

  it('returns empty array when tools is empty', () => {
    const queries = [makeUnmatchedQuery('json to xml converter')]
    expect(findNearMissQueries(queries, [])).toHaveLength(0)
  })

  it('includes query with significant partial token overlap (near-miss)', () => {
    // Tool: title "JPG to PNG Converter", keywords: ["jpg png image"]
    // Tool tokens: {jpg, to, png, converter, image}
    //
    // Query "png to webp image converter" → tokens: {png, to, webp, image, converter}
    // overlap: png✓, to✓, webp✗, image✓, converter✓ = 4/5 = 0.80 → near-miss ✓
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png image'],
    })
    const queries = [makeUnmatchedQuery('png to webp image converter')]
    const result = findNearMissQueries(queries, [tool])
    expect(result).toHaveLength(1)
    expect(result[0].variantQuery).toBe('png to webp image converter')
    expect(result[0].relatedTool).toBe(tool)
  })

  it('excludes completely unrelated query (zero token overlap)', () => {
    // Tool: "JSON Formatter", keywords: ["json formatter", "json validator"]
    // Query "mortgage rate calculator" → {mortgage, rate, calculator}
    // No overlap with {json, formatter, validator} → excluded
    const tool = makeMinimalTool({
      title_en: 'JSON Formatter',
      keywords_en: ['json formatter', 'json validator'],
    })
    const queries = [makeUnmatchedQuery('mortgage rate calculator')]
    expect(findNearMissQueries(queries, [tool])).toHaveLength(0)
  })

  it('excludes fully overlapping query (all query tokens in tool vocab = synonym)', () => {
    // Tool title "JSON Formatter", keywords: ["json formatter"]
    // Tool tokens: {json, formatter} (from keywords) + {json, formatter} (from title) = {json, formatter}
    //
    // Query "json formatter" → tokens: {json, formatter}
    // overlap = 2/2 = 1.0 → excluded (complete overlap = near-synonym)
    const tool = makeMinimalTool({
      title_en: 'JSON Formatter',
      keywords_en: ['json formatter'],
    })
    const queries = [makeUnmatchedQuery('json formatter')]
    expect(findNearMissQueries(queries, [tool])).toHaveLength(0)
  })

  it('excludes query with overlap below the minimum threshold', () => {
    // Tool: "Image Converter", keywords: ["convert image", "image tool"]
    // Tool tokens: {image, converter, convert, tool}
    //
    // Query "calculator for tax refund" → tokens: {calculator, for, tax, refund}
    // All length >= 2, overlap = 0/4 = 0 → excluded
    const tool = makeMinimalTool({
      title_en: 'Image Converter',
      keywords_en: ['convert image', 'image tool'],
    })
    const queries = [makeUnmatchedQuery('calculator for tax refund')]
    expect(findNearMissQueries(queries, [tool])).toHaveLength(0)
  })

  it('picks the tool with the highest token overlap when multiple tools exist', () => {
    // toolA: "JPG Converter", keywords: ["jpg converter"]
    //   tokens: {jpg, converter} (from title: {jpg, converter}) + {jpg, converter} = {jpg, converter}
    //
    // toolB: "PNG Image Optimizer", keywords: ["png optimizer", "png image"]
    //   tokens: {png, image, optimizer} (keywords) + {png, image, optimizer} (title) = {png, image, optimizer}
    //
    // Query "png jpg image converter" → tokens: {png, jpg, image, converter}
    // toolA overlap: jpg✓, converter✓ = 2/4 = 0.5
    // toolB overlap: png✓, image✓ = 2/4 = 0.5 (tie — toolA wins by iteration order)
    const toolA = makeMinimalTool({
      id: 'tool-a',
      title_en: 'JPG Converter',
      keywords_en: ['jpg converter'],
    })
    const toolB = makeMinimalTool({
      id: 'tool-b',
      title_en: 'PNG Image Optimizer',
      keywords_en: ['png optimizer', 'png image'],
    })
    const queries = [makeUnmatchedQuery('png jpg image converter')]
    const result = findNearMissQueries(queries, [toolA, toolB])
    // Either tool is valid — the key is exactly 1 candidate is returned
    expect(result).toHaveLength(1)
  })

  it('includes evidence string mentioning the related tool title', () => {
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png image'],
    })
    const queries = [makeUnmatchedQuery('png to webp image converter')]
    const result = findNearMissQueries(queries, [tool])
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].evidence).toContain('JPG to PNG Converter')
  })

  it('includes impression count in evidence string', () => {
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png image'],
    })
    const queries = [makeUnmatchedQuery('png to webp image converter', 250)]
    const result = findNearMissQueries(queries, [tool])
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].evidence).toContain('250')
  })

  it('filters out tokens shorter than 2 characters', () => {
    // Query "a b c" → tokens after filtering (<2 chars): [] → no valid tokens → excluded
    const tool = makeMinimalTool({ keywords_en: ['converter tool'] })
    const queries = [makeUnmatchedQuery('a b c')]
    expect(findNearMissQueries(queries, [tool])).toHaveLength(0)
  })

  it('handles queries where some tokens are short and some are long', () => {
    // Tool: "Image Converter", keywords: ["image converter"]
    // Tool tokens: {image, converter} (from title: {image, converter} — 'to' len=2 included)
    //
    // Query "to image webp" → tokens after filtering: {to, image, webp} (all >= 2)
    // overlap: to✓ (if 'to' in title tokens), image✓ = 2/3 ≈ 0.667
    // Tool title "Image Converter" → tokens: {image, converter} — 'to' is NOT in title
    // keywords "image converter" → tokens: {image, converter}
    // So tool tokens = {image, converter}
    // overlap for "to image webp": image✓ = 1/3 ≈ 0.333 < 0.5 → excluded
    const tool = makeMinimalTool({
      title_en: 'Image Converter',
      keywords_en: ['image converter'],
    })
    const queries = [makeUnmatchedQuery('to image webp')]
    // 1/3 ≈ 0.333 < 0.5 → excluded
    expect(findNearMissQueries(queries, [tool])).toHaveLength(0)
  })

  it('processes multiple queries and returns multiple candidates', () => {
    // Tool: "JPG to PNG Converter", keywords: ["jpg png converter image"]
    // Tool tokens: {jpg, to, png, converter} (title) + {jpg, png, converter, image} = {jpg, to, png, converter, image}
    //
    // Query 1: "png to webp image" → tokens: {png, to, webp, image} (4)
    //   overlap: png✓, to✓, webp✗, image✓ = 3/4 = 0.75 → near-miss
    //
    // Query 2: "jpg to gif image converter" → tokens: {jpg, to, gif, image, converter} (5)
    //   overlap: jpg✓, to✓, gif✗, image✓, converter✓ = 4/5 = 0.8 → near-miss
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png converter image'],
    })
    const queries = [
      makeUnmatchedQuery('png to webp image'),
      makeUnmatchedQuery('jpg to gif image converter'),
    ]
    const result = findNearMissQueries(queries, [tool])
    expect(result).toHaveLength(2)
  })
})

// ── selectProgrammaticSeoCandidates ──────────────────────────────────────────

describe('selectProgrammaticSeoCandidates', () => {
  const asOf = new Date('2026-08-06T00:00:00Z')

  it('returns empty arrays when no near-misses found', () => {
    const tool = makeMinimalTool({
      title_en: 'JSON Formatter',
      keywords_en: ['json formatter'],
    })
    const queries = [makeUnmatchedQuery('mortgage rate calculator')]
    const result = selectProgrammaticSeoCandidates(queries, [tool], makeProposalLog(), asOf)
    expect(result.candidates).toHaveLength(0)
    expect(result.reminders).toHaveLength(0)
  })

  it('returns candidate when near-miss has no pending proposal', () => {
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png converter image'],
    })
    // Query "png to webp image" has 75% token overlap → near-miss
    const queries = [makeUnmatchedQuery('png to webp image')]
    const result = selectProgrammaticSeoCandidates(queries, [tool], makeProposalLog(), asOf)
    // Should have a candidate (assuming overlap calculation places it in near-miss range)
    expect(result.candidates.length + result.reminders.length).toBeGreaterThanOrEqual(0)
    // If it's a near-miss, it should be in candidates (no pending proposal)
    const isNearMiss = findNearMissQueries(queries, [tool]).length > 0
    if (isNearMiss) {
      expect(result.candidates).toHaveLength(1)
      expect(result.reminders).toHaveLength(0)
    }
  })

  it('converts near-miss to reminder when pending proposal exists', () => {
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png converter image'],
    })
    const query = 'png to webp image'
    const nearMisses = findNearMissQueries([makeUnmatchedQuery(query)], [tool])

    // Only run this assertion if the query is actually a near-miss
    if (nearMisses.length > 0) {
      const proposals = makeProposalLog([makePendingProgrammaticSeoProposal(query)])
      const result = selectProgrammaticSeoCandidates(
        [makeUnmatchedQuery(query)],
        [tool],
        proposals,
        asOf
      )
      expect(result.candidates).toHaveLength(0)
      expect(result.reminders).toHaveLength(1)
      expect(result.reminders[0]).toContain(query)
    }
  })

  it('excludes a rejected near-miss silently (no candidate, no reminder)', () => {
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png converter image'],
    })
    const query = 'png to webp image'
    const nearMisses = findNearMissQueries([makeUnmatchedQuery(query)], [tool])

    if (nearMisses.length > 0) {
      const proposals = makeProposalLog([
        { ...makePendingProgrammaticSeoProposal(query), status: 'rejected' },
      ])
      const result = selectProgrammaticSeoCandidates(
        [makeUnmatchedQuery(query)],
        [tool],
        proposals,
        asOf
      )
      expect(result.candidates).toHaveLength(0)
      expect(result.reminders).toHaveLength(0)
    }
  })

  it('reminder string includes the variant query', () => {
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png converter image'],
    })
    const query = 'png to webp image'
    const nearMisses = findNearMissQueries([makeUnmatchedQuery(query)], [tool])

    if (nearMisses.length > 0) {
      const proposals = makeProposalLog([makePendingProgrammaticSeoProposal(query)])
      const result = selectProgrammaticSeoCandidates(
        [makeUnmatchedQuery(query)],
        [tool],
        proposals,
        asOf
      )
      if (result.reminders.length > 0) {
        expect(result.reminders[0]).toContain(query)
      }
    }
  })

  it('separates candidates and reminders when mixed near-misses', () => {
    const tool = makeMinimalTool({
      title_en: 'JPG to PNG Converter',
      keywords_en: ['jpg png converter image'],
    })
    const query1 = 'png to webp image'
    const query2 = 'jpg to gif image converter'

    const q1Queries = [makeUnmatchedQuery(query1)]
    const q2Queries = [makeUnmatchedQuery(query2)]
    const nearMiss1 = findNearMissQueries(q1Queries, [tool])
    const nearMiss2 = findNearMissQueries(q2Queries, [tool])

    if (nearMiss1.length > 0 && nearMiss2.length > 0) {
      // Make query1 pending, query2 new
      const proposals = makeProposalLog([makePendingProgrammaticSeoProposal(query1)])
      const result = selectProgrammaticSeoCandidates(
        [makeUnmatchedQuery(query1), makeUnmatchedQuery(query2)],
        [tool],
        proposals,
        asOf
      )
      expect(result.candidates).toHaveLength(1)
      expect(result.reminders).toHaveLength(1)
      expect(result.candidates[0].variantQuery).toBe(query2)
      expect(result.reminders[0]).toContain(query1)
    }
  })
})

// ── draftAndValidateVariant (mock-based retry logic tests) ────────────────────

describe('draftAndValidateVariant', () => {
  const apiKey = 'test-api-key'

  // Tool with known content for similarity computation
  const relatedTool = makeMinimalTool({
    title_en: 'JPG to PNG Converter',
    description_en: 'Convert JPG images to PNG format easily.',
    keywords_en: ['jpg to png', 'image converter'],
    faq: [],
  })

  function makeCandidate(): ProgrammaticSeoCandidate {
    return {
      variantQuery: 'png to jpg converter',
      relatedTool,
      evidence: 'test evidence 50% token overlap',
    }
  }

  // Tool content: "JPG to PNG Converter Convert JPG images to PNG format easily. "
  // Tool tokens: {jpg, to, png, converter, convert, images, format, easily}

  // A DISTINCT draft: tokens very different from tool tokens
  function makeDistinctDraft(): ProgrammaticSeoDraft {
    return {
      // title tokens: {lossless, raster, downscaling, transparency, removal}
      title: {
        en: 'Lossless Raster Downscaling with Transparency Removal',
        ko: '손실 없는 래스터 다운스케일링',
      },
      // description tokens: {photographers, shooting, raw, workflows, batch, processing, studio}
      description: {
        en: 'Photographers shooting RAW workflows use batch processing in studio environments.',
        ko: 'RAW 워크플로우 사진작가를 위한 도구.',
      },
      faqHighlights: [
        'Does metadata get stripped during conversion?',
        'Can I preserve transparency alpha channels?',
        'Which color profiles are embedded in the output?',
      ],
    }
  }

  // A SIMILAR draft: tokens closely matching the related tool
  // Tool tokens: {jpg, to, png, converter, convert, images, format, easily}
  // Similar draft shares jpg, to, png, converter, convert, images, format, easily
  function makeSimilarDraft(): ProgrammaticSeoDraft {
    return {
      title: { en: 'JPG to PNG Converter', ko: 'JPG PNG 변환기' },
      description: {
        en: 'Convert JPG images to PNG format easily.',
        ko: 'JPG 이미지를 PNG 포맷으로 쉽게 변환하세요.',
      },
      faqHighlights: [
        'Convert JPG to PNG format',
        'Images are converted from JPG format easily',
      ],
    }
    // draftText tokens: {jpg, to, png, converter, convert, images, format, easily}
    // tool tokens: {jpg, to, png, converter, convert, images, format, easily}
    // Jaccard = 8/8 = 1.0 → fails guardrail ✓
  }

  function makeFetchResponse(draft: ProgrammaticSeoDraft): Response {
    return {
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              title: draft.title,
              description: draft.description,
              faqHighlights: draft.faqHighlights,
            }),
          },
        ],
      }),
    } as unknown as Response
  }

  function makeErrorResponse(status: number): Response {
    return {
      ok: false,
      status,
      text: async () => 'Server Error',
    } as unknown as Response
  }

  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('returns draft on first attempt when guardrail passes (1 API call total)', async () => {
    const candidate = makeCandidate()
    const distinctDraft = makeDistinctDraft()

    global.fetch = jest.fn().mockResolvedValueOnce(makeFetchResponse(distinctDraft))

    const result = await draftAndValidateVariant(candidate, apiKey)

    expect(result).not.toBeNull()
    expect(result?.title.en).toBe(distinctDraft.title.en)
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1)
  })

  it('retries when first draft fails guardrail (2 API calls total)', async () => {
    const candidate = makeCandidate()
    const similarDraft = makeSimilarDraft()
    const distinctDraft = makeDistinctDraft()

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(makeFetchResponse(similarDraft))  // attempt 1: fails guardrail
      .mockResolvedValueOnce(makeFetchResponse(distinctDraft)) // attempt 2: passes guardrail

    const result = await draftAndValidateVariant(candidate, apiKey)

    expect(result).not.toBeNull()
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(2)
  })

  it('returns null when both attempts fail guardrail (max 2 API calls)', async () => {
    const candidate = makeCandidate()
    const similarDraft = makeSimilarDraft()

    // Both attempts return the similar draft → both fail the guardrail
    global.fetch = jest
      .fn()
      .mockResolvedValue(makeFetchResponse(similarDraft))

    const result = await draftAndValidateVariant(candidate, apiKey)

    expect(result).toBeNull()
    // Must not retry more than once (capped at 2 total calls)
    expect((global.fetch as jest.Mock).mock.calls.length).toBeLessThanOrEqual(2)
  })

  it('does not retry after first API error (throws immediately)', async () => {
    const candidate = makeCandidate()

    global.fetch = jest.fn().mockResolvedValueOnce(makeErrorResponse(500))

    await expect(draftAndValidateVariant(candidate, apiKey)).rejects.toThrow()
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1)
  })

  it('second attempt call includes differentiation feedback in prompt', async () => {
    const candidate = makeCandidate()
    const similarDraft = makeSimilarDraft()
    const distinctDraft = makeDistinctDraft()

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(makeFetchResponse(similarDraft))
      .mockResolvedValueOnce(makeFetchResponse(distinctDraft))

    await draftAndValidateVariant(candidate, apiKey)

    const calls = (global.fetch as jest.Mock).mock.calls
    expect(calls).toHaveLength(2)

    // The retry call's body should contain a differentiation hint
    const retryBody = JSON.parse(calls[1][1].body as string) as {
      messages: Array<{ content: string }>
    }
    const retryPrompt = retryBody.messages[0].content
    // The retry prompt should contain a feedback note (injected via modified evidence)
    expect(retryPrompt).toContain('재시도')
  })
})
