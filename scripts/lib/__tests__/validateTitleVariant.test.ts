/**
 * @jest-environment node
 */

import {
  BANNED_PATTERNS,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  validateTitleVariant,
  type TitleVariant,
} from '../validateTitleVariant'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_VARIANT: TitleVariant = {
  title: {
    en: 'JSON Formatter & Validator Online',
    ko: 'JSON 포매터 & 검증기',
  },
  description: {
    en: 'Format, validate and minify JSON instantly in your browser. No data sent to servers.',
    ko: '브라우저에서 JSON을 즉시 포맷·검증·압축하세요. 데이터는 서버로 전송되지 않습니다.',
  },
}

const REQUIRED_KEYWORDS = { en: 'JSON', ko: 'JSON' }

// ── Helper ────────────────────────────────────────────────────────────────────

function makeVariant(overrides: Partial<TitleVariant>): TitleVariant {
  return {
    title: { ...VALID_VARIANT.title, ...overrides.title },
    description: { ...VALID_VARIANT.description, ...overrides.description },
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('MAX_TITLE_LENGTH is 60', () => {
    expect(MAX_TITLE_LENGTH).toBe(60)
  })

  it('MAX_DESCRIPTION_LENGTH is 155', () => {
    expect(MAX_DESCRIPTION_LENGTH).toBe(155)
  })

  it('BANNED_PATTERNS is a non-empty array of RegExp', () => {
    expect(Array.isArray(BANNED_PATTERNS)).toBe(true)
    expect(BANNED_PATTERNS.length).toBeGreaterThan(0)
    for (const p of BANNED_PATTERNS) {
      expect(p).toBeInstanceOf(RegExp)
    }
  })
})

// ── Happy path ────────────────────────────────────────────────────────────────

describe('validateTitleVariant — valid input', () => {
  it('returns valid:true and no violations for a compliant variant', () => {
    const result = validateTitleVariant(VALID_VARIANT, REQUIRED_KEYWORDS)
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('is case-insensitive for EN keyword matching', () => {
    const variant = makeVariant({ title: { en: 'json formatter online', ko: VALID_VARIANT.title.ko } })
    const result = validateTitleVariant(variant, { en: 'JSON', ko: 'JSON' })
    expect(result.valid).toBe(true)
  })
})

// ── Length violations ─────────────────────────────────────────────────────────

describe('validateTitleVariant — length checks', () => {
  it('flags EN title that exceeds MAX_TITLE_LENGTH', () => {
    // Include the required keyword so only the length violation fires
    const longTitle = 'JSON ' + 'A'.repeat(MAX_TITLE_LENGTH - 4) // 5 + 56 = 61 chars
    expect(longTitle.length).toBe(MAX_TITLE_LENGTH + 1)
    const variant = makeVariant({ title: { en: longTitle, ko: VALID_VARIANT.title.ko } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    expect(result.valid).toBe(false)
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toMatch(/EN title is too long/)
    expect(result.violations[0]).toMatch(`${MAX_TITLE_LENGTH + 1} chars`)
  })

  it('does not flag EN title at exactly MAX_TITLE_LENGTH', () => {
    // Build a 60-char title that still contains the keyword
    const title = 'JSON ' + 'A'.repeat(MAX_TITLE_LENGTH - 5)
    expect(title.length).toBe(MAX_TITLE_LENGTH)
    const variant = makeVariant({ title: { en: title, ko: VALID_VARIANT.title.ko } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    const lengthViolations = result.violations.filter((v) => v.includes('EN title is too long'))
    expect(lengthViolations).toHaveLength(0)
  })

  it('flags KO title that exceeds MAX_TITLE_LENGTH', () => {
    const longTitle = '가'.repeat(MAX_TITLE_LENGTH + 1)
    const variant = makeVariant({ title: { ko: longTitle, en: VALID_VARIANT.title.en } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.includes('KO title is too long'))).toBe(true)
  })

  it('flags EN description that exceeds MAX_DESCRIPTION_LENGTH', () => {
    const longDesc = 'B'.repeat(MAX_DESCRIPTION_LENGTH + 1)
    const variant = makeVariant({ description: { en: longDesc, ko: VALID_VARIANT.description.ko } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.includes('EN description is too long'))).toBe(true)
  })

  it('does not flag EN description at exactly MAX_DESCRIPTION_LENGTH', () => {
    const desc = 'B'.repeat(MAX_DESCRIPTION_LENGTH)
    const variant = makeVariant({ description: { en: desc, ko: VALID_VARIANT.description.ko } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    const lengthViolations = result.violations.filter((v) => v.includes('EN description is too long'))
    expect(lengthViolations).toHaveLength(0)
  })

  it('flags KO description that exceeds MAX_DESCRIPTION_LENGTH', () => {
    const longDesc = '나'.repeat(MAX_DESCRIPTION_LENGTH + 1)
    const variant = makeVariant({ description: { ko: longDesc, en: VALID_VARIANT.description.en } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.includes('KO description is too long'))).toBe(true)
  })
})

// ── Banned expression violations ──────────────────────────────────────────────

describe('validateTitleVariant — banned expressions', () => {
  const bannedCases: Array<{ field: 'enTitle' | 'koTitle' | 'enDesc' | 'koDesc'; text: string; label: string }> = [
    // English banned expressions in title
    { field: 'enTitle', text: 'JSON #1 Formatter Online', label: '#1 in EN title' },
    { field: 'enTitle', text: 'The Number One JSON Tool', label: 'number one in EN title' },
    { field: 'enTitle', text: 'Best JSON Formatter', label: 'best in EN title' },
    { field: 'enTitle', text: 'Perfect JSON Formatter', label: 'perfect in EN title' },
    { field: 'enTitle', text: 'Ultimate JSON Formatter', label: 'ultimate in EN title' },
    { field: 'enTitle', text: 'JSON Formatter Guaranteed', label: 'guaranteed in EN title' },
    { field: 'enTitle', text: 'JSON — 100% Accurate Formatter', label: '100% accurate in EN title' },
    // Korean banned expressions in title
    { field: 'koTitle', text: 'JSON 포매터 1위', label: '1위 in KO title' },
    { field: 'koTitle', text: '최고의 JSON 포매터', label: '최고 in KO title' },
    { field: 'koTitle', text: '완벽한 JSON 검증기', label: '완벽 in KO title' },
    { field: 'koTitle', text: 'JSON 포매터 보장', label: '보장 in KO title' },
    { field: 'koTitle', text: '100% 정확한 JSON', label: '100% 정확 in KO title' },
    // Banned expressions in description
    { field: 'enDesc', text: 'Best JSON formatter available. Validates in seconds.', label: 'best in EN description' },
    { field: 'koDesc', text: '최고의 JSON 포매팅 도구로 데이터를 즉시 확인하세요.', label: '최고 in KO description' },
  ]

  for (const { field, text, label } of bannedCases) {
    it(`flags "${label}"`, () => {
      let variant: TitleVariant
      if (field === 'enTitle') {
        variant = makeVariant({ title: { en: text, ko: VALID_VARIANT.title.ko } })
      } else if (field === 'koTitle') {
        variant = makeVariant({ title: { ko: text, en: VALID_VARIANT.title.en } })
      } else if (field === 'enDesc') {
        variant = makeVariant({ description: { en: text, ko: VALID_VARIANT.description.ko } })
      } else {
        variant = makeVariant({ description: { ko: text, en: VALID_VARIANT.description.en } })
      }

      const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
      expect(result.valid).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.violations.some((v) => v.includes('banned expression'))).toBe(true)
    })
  }
})

// ── Required keyword violations ───────────────────────────────────────────────

describe('validateTitleVariant — required keyword', () => {
  it('flags missing EN keyword in EN title', () => {
    const variant = makeVariant({ title: { en: 'Code Formatter & Validator', ko: VALID_VARIANT.title.ko } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.includes('EN title must include the required keyword'))).toBe(true)
  })

  it('flags missing KO keyword in KO title', () => {
    const variant = makeVariant({ title: { ko: '코드 포매터 검증기', en: VALID_VARIANT.title.en } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.includes('KO title must include the required keyword'))).toBe(true)
  })

  it('does not flag keyword in description only (title must have it)', () => {
    const variant = makeVariant({
      title: { en: 'Code Formatter Online', ko: 'JSON 포매터' },
      description: { en: 'Best JSON tool', ko: VALID_VARIANT.description.ko },
    })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    // EN title is missing keyword
    expect(result.violations.some((v) => v.includes('EN title must include'))).toBe(true)
  })
})

// ── Multiple simultaneous violations ─────────────────────────────────────────

describe('validateTitleVariant — multiple violations', () => {
  it('reports all violations when multiple guardrails fail at once', () => {
    const variant: TitleVariant = {
      title: {
        // EN title: too long + banned "best" + missing keyword (no "JSON")
        en: 'The Absolute Best Code Formatter You Will Ever Find In Your Life Online',
        // KO title: banned "최고" + missing keyword "JSON"
        ko: '최고의 코드 포매터',
      },
      description: {
        // EN description: too long
        en: 'C'.repeat(MAX_DESCRIPTION_LENGTH + 10),
        // KO description: fine
        ko: VALID_VARIANT.description.ko,
      },
    }

    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    expect(result.valid).toBe(false)
    // EN title too long
    expect(result.violations.some((v) => v.includes('EN title is too long'))).toBe(true)
    // EN title banned expression
    expect(result.violations.some((v) => v.includes('banned expression'))).toBe(true)
    // EN description too long
    expect(result.violations.some((v) => v.includes('EN description is too long'))).toBe(true)
    // EN title missing keyword
    expect(result.violations.some((v) => v.includes('EN title must include'))).toBe(true)
    // KO title missing keyword
    expect(result.violations.some((v) => v.includes('KO title must include'))).toBe(true)
  })

  it('violation messages are human-readable strings (not objects)', () => {
    const variant = makeVariant({ title: { en: 'Best Formatter', ko: 'VALID JSON 포매터' } })
    const result = validateTitleVariant(variant, REQUIRED_KEYWORDS)
    for (const v of result.violations) {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    }
  })
})
