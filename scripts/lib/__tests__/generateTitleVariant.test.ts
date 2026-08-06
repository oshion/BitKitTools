/**
 * @jest-environment node
 *
 * Tests for the pure parsing function `parseVariantsFromResponse` from
 * generate-title-variant.ts.
 *
 * No network calls are made — parseVariantsFromResponse is a pure function
 * that transforms a string into TitleVariant[], so it can be tested directly
 * without mocking fetch.
 */

import { parseVariantsFromResponse, type TitleVariant } from '../../generate-title-variant'

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Builds a well-formed single variant block (without outer delimiters). */
function variantBlock(n: number, fields?: Partial<{ titleEn: string; titleKo: string; descEn: string; descKo: string }>): string {
  return [
    `===VARIANT ${n}===`,
    `TITLE_EN: ${fields?.titleEn ?? `English Title ${n}`}`,
    `TITLE_KO: ${fields?.titleKo ?? `한국어 제목 ${n}`}`,
    `DESC_EN: ${fields?.descEn ?? `English description for variant ${n}.`}`,
    `DESC_KO: ${fields?.descKo ?? `한국어 설명 ${n}.`}`,
  ].join('\n')
}

function threeVariantResponse(): string {
  return [
    variantBlock(1, { titleEn: 'JSON Formatter & Validator', titleKo: 'JSON 포매터 검증기', descEn: 'Format JSON instantly.', descKo: 'JSON을 즉시 포맷하세요.' }),
    variantBlock(2, { titleEn: 'Free JSON Formatter Online', titleKo: '무료 온라인 JSON 포매터', descEn: 'Validate and pretty-print JSON for free.', descKo: 'JSON을 무료로 검증하고 예쁘게 출력하세요.' }),
    variantBlock(3, { titleEn: 'JSON Formatter — Format & Minify', titleKo: 'JSON 포매터 — 포맷 & 압축', descEn: 'Format or minify JSON in your browser.', descKo: '브라우저에서 JSON을 포맷하거나 압축하세요.' }),
    '===END===',
  ].join('\n')
}

// ── Happy path ────────────────────────────────────────────────────────────────

describe('parseVariantsFromResponse — valid input', () => {
  it('parses a well-formed 3-variant response', () => {
    const result = parseVariantsFromResponse(threeVariantResponse())
    expect(result).toHaveLength(3)
  })

  it('extracts correct EN title for first variant', () => {
    const result = parseVariantsFromResponse(threeVariantResponse())
    expect(result[0]?.title.en).toBe('JSON Formatter & Validator')
  })

  it('extracts correct KO title for first variant', () => {
    const result = parseVariantsFromResponse(threeVariantResponse())
    expect(result[0]?.title.ko).toBe('JSON 포매터 검증기')
  })

  it('extracts correct EN description for second variant', () => {
    const result = parseVariantsFromResponse(threeVariantResponse())
    expect(result[1]?.description.en).toBe('Validate and pretty-print JSON for free.')
  })

  it('extracts correct KO description for third variant', () => {
    const result = parseVariantsFromResponse(threeVariantResponse())
    expect(result[2]?.description.ko).toBe('브라우저에서 JSON을 포맷하거나 압축하세요.')
  })

  it('parses a single-variant response', () => {
    const text = [variantBlock(1), '===END==='].join('\n')
    const result = parseVariantsFromResponse(text)
    expect(result).toHaveLength(1)
    expect(result[0]?.title.en).toBe('English Title 1')
  })

  it('trims whitespace from field values', () => {
    const text = '===VARIANT 1===\nTITLE_EN:   Padded Title   \nTITLE_KO: 제목\nDESC_EN: Description.\nDESC_KO: 설명.\n===END==='
    const result = parseVariantsFromResponse(text)
    expect(result[0]?.title.en).toBe('Padded Title')
  })

  it('ignores preamble text before the first ===VARIANT N=== delimiter', () => {
    const text = 'Here are your variants:\n\n' + threeVariantResponse()
    const result = parseVariantsFromResponse(text)
    expect(result).toHaveLength(3)
  })

  it('ignores text after ===END===', () => {
    const text = threeVariantResponse() + '\n\nSome trailing text the model added.'
    const result = parseVariantsFromResponse(text)
    expect(result).toHaveLength(3)
  })

  it('returns an array of TitleVariant objects with the correct shape', () => {
    const result = parseVariantsFromResponse(threeVariantResponse())
    for (const variant of result) {
      expect(variant).toHaveProperty('title')
      expect(variant).toHaveProperty('description')
      expect(variant.title).toHaveProperty('en')
      expect(variant.title).toHaveProperty('ko')
      expect(variant.description).toHaveProperty('en')
      expect(variant.description).toHaveProperty('ko')
    }
  })
})

// ── Partial / malformed responses ─────────────────────────────────────────────

describe('parseVariantsFromResponse — partial or malformed input', () => {
  it('returns [] for an empty string', () => {
    expect(parseVariantsFromResponse('')).toEqual([])
  })

  it('returns [] when no ===VARIANT N=== delimiter is present', () => {
    expect(parseVariantsFromResponse('Some random text without delimiters.')).toEqual([])
  })

  it('skips a variant block missing TITLE_EN', () => {
    const text = [
      '===VARIANT 1===',
      // TITLE_EN omitted
      'TITLE_KO: 제목',
      'DESC_EN: Description.',
      'DESC_KO: 설명.',
      '===END===',
    ].join('\n')
    expect(parseVariantsFromResponse(text)).toHaveLength(0)
  })

  it('skips a variant block missing TITLE_KO', () => {
    const text = [
      '===VARIANT 1===',
      'TITLE_EN: Title',
      // TITLE_KO omitted
      'DESC_EN: Description.',
      'DESC_KO: 설명.',
      '===END===',
    ].join('\n')
    expect(parseVariantsFromResponse(text)).toHaveLength(0)
  })

  it('skips a variant block missing DESC_EN', () => {
    const text = [
      '===VARIANT 1===',
      'TITLE_EN: Title',
      'TITLE_KO: 제목',
      // DESC_EN omitted
      'DESC_KO: 설명.',
      '===END===',
    ].join('\n')
    expect(parseVariantsFromResponse(text)).toHaveLength(0)
  })

  it('skips a variant block missing DESC_KO', () => {
    const text = [
      '===VARIANT 1===',
      'TITLE_EN: Title',
      'TITLE_KO: 제목',
      'DESC_EN: Description.',
      // DESC_KO omitted
      '===END===',
    ].join('\n')
    expect(parseVariantsFromResponse(text)).toHaveLength(0)
  })

  it('returns only well-formed variants when some blocks are malformed', () => {
    const text = [
      // Variant 1: well-formed
      variantBlock(1, { titleEn: 'Good Title', titleKo: '좋은 제목', descEn: 'Good desc.', descKo: '좋은 설명.' }),
      // Variant 2: missing DESC_EN — should be skipped
      '===VARIANT 2===',
      'TITLE_EN: Incomplete',
      'TITLE_KO: 불완전',
      'DESC_KO: 설명만 있음.',
      // Variant 3: well-formed
      variantBlock(3, { titleEn: 'Another Title', titleKo: '다른 제목', descEn: 'Another desc.', descKo: '다른 설명.' }),
      '===END===',
    ].join('\n')

    const result = parseVariantsFromResponse(text)
    expect(result).toHaveLength(2)
    expect(result[0]?.title.en).toBe('Good Title')
    expect(result[1]?.title.en).toBe('Another Title')
  })

  it('handles field values containing colons without breaking parsing', () => {
    const text = [
      '===VARIANT 1===',
      'TITLE_EN: JSON: Formatter & Validator',
      'TITLE_KO: JSON: 포매터',
      'DESC_EN: Works with any JSON: objects, arrays, etc.',
      'DESC_KO: 객체, 배열 등 모든 JSON: 지원.',
      '===END===',
    ].join('\n')
    const result = parseVariantsFromResponse(text)
    expect(result).toHaveLength(1)
    expect(result[0]?.title.en).toBe('JSON: Formatter & Validator')
    expect(result[0]?.description.en).toBe('Works with any JSON: objects, arrays, etc.')
  })

  it('handles Windows-style CRLF line endings', () => {
    const text = '===VARIANT 1===\r\nTITLE_EN: CRLF Title\r\nTITLE_KO: 제목\r\nDESC_EN: Description.\r\nDESC_KO: 설명.\r\n===END==='
    const result = parseVariantsFromResponse(text)
    expect(result).toHaveLength(1)
    expect(result[0]?.title.en).toBe('CRLF Title')
  })
})

// ── Type safety ───────────────────────────────────────────────────────────────

describe('parseVariantsFromResponse — return type', () => {
  it('always returns an array (never null/undefined)', () => {
    expect(parseVariantsFromResponse('')).toEqual([])
    expect(parseVariantsFromResponse('garbage')).toEqual([])
    expect(parseVariantsFromResponse(threeVariantResponse())).toBeInstanceOf(Array)
  })

  it('each returned item satisfies TitleVariant interface', () => {
    const result: TitleVariant[] = parseVariantsFromResponse(threeVariantResponse())
    for (const v of result) {
      expect(typeof v.title.en).toBe('string')
      expect(typeof v.title.ko).toBe('string')
      expect(typeof v.description.en).toBe('string')
      expect(typeof v.description.ko).toBe('string')
    }
  })
})
