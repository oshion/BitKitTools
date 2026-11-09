import {
  CHIIKAWA_CHARACTERS,
  CHIIKAWA_OFFICIAL_SITE,
  getChiikawaCharacter,
} from './chiikawaCharacters'
import { CHIIKAWA_INTRO, CHIIKAWA_QUESTIONS } from './chiikawaQuestions'
import { PERSONALITY_TYPE_LABELS } from './personalityTypeLabels'

const SPEC_ORDER_AND_KEYS: Array<[string, string]> = [
  ['chiikawa', 'AAADAAAA'],
  ['hachiware', 'BAAAABAB'],
  ['usagi', 'CBCCCCCC'],
  ['momonga', 'BBBCBCCC'],
  ['kurimanju', 'DDDCDCDD'],
  ['shisa', 'AAAADDAA'],
  ['rakko', 'DCBBBDBD'],
  ['kani', 'ADADDADD'],
  ['anoko', 'CBDDCCDD'],
  ['dekatsuyo', 'ABADCCCA'],
  ['ode', 'BAADBBAA'],
  ['pochette-armor', 'ADDDDCDA'],
  ['labor-armor', 'DCDDDDBA'],
  ['ramen-armor', 'DCDBDADD'],
  ['pajama-party', 'BBCABCCB'],
  ['kabutomushi', 'BBCACBCC'],
]

const ALL_TYPES = ['E', 'I'].flatMap((a) =>
  ['S', 'N'].flatMap((b) => ['T', 'F'].flatMap((c) => ['J', 'P'].map((d) => a + b + c + d))),
)

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out))
  else if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((v) => collectStrings(v, out))
  }
  return out
}

describe('CHIIKAWA_CHARACTERS', () => {
  test('every character has a short EN/KO description of the character itself', () => {
    for (const c of CHIIKAWA_CHARACTERS) {
      for (const locale of ['en', 'ko'] as const) {
        expect(c.description[locale].trim()).not.toBe('')
        expect(c.description[locale].length).toBeLessThanOrEqual(160)
      }
    }
  })

  test('the personality analysis explains why the user feels like the character', () => {
    for (const c of CHIIKAWA_CHARACTERS) {
      expect(c.coreTraits.ko).toContain(c.name.ko)
      expect(c.coreTraits.ko).toContain('비슷한 느낌이에요')
      expect(c.coreTraits.en).toContain(c.name.en)
      expect(c.coreTraits.en).toMatch(/feel alike/)
    }
  })

  test('has 16 characters in spec order with unique ids', () => {
    expect(CHIIKAWA_CHARACTERS.map((c) => c.id)).toEqual(SPEC_ORDER_AND_KEYS.map(([id]) => id))
    expect(new Set(CHIIKAWA_CHARACTERS.map((c) => c.id)).size).toBe(16)
  })

  test('answer keys match the revised spec table', () => {
    for (const [id, key] of SPEC_ORDER_AND_KEYS) {
      const c = getChiikawaCharacter(id)
      expect(c?.answerKey).toHaveLength(8)
      expect(c?.answerKey.join('')).toBe(key)
    }
  })

  test('every pair of answer keys differs in at least 3 questions', () => {
    for (let i = 0; i < CHIIKAWA_CHARACTERS.length; i++) {
      for (let j = i + 1; j < CHIIKAWA_CHARACTERS.length; j++) {
        const a = CHIIKAWA_CHARACTERS[i].answerKey
        const b = CHIIKAWA_CHARACTERS[j].answerKey
        const diff = a.filter((letter, k) => letter !== b[k]).length
        expect(diff).toBeGreaterThanOrEqual(3)
      }
    }
  })

  test('all localized text and lists are non-empty in EN/KO', () => {
    for (const c of CHIIKAWA_CHARACTERS) {
      for (const text of [c.name, c.tagline, c.coreTraits]) {
        expect(text.en.trim().length).toBeGreaterThan(0)
        expect(text.ko.trim().length).toBeGreaterThan(0)
      }
      for (const list of [c.strengths, c.cautions, c.relationships]) {
        expect(list.en.length).toBeGreaterThan(0)
        expect(list.ko.length).toBeGreaterThan(0)
        for (const item of [...list.en, ...list.ko]) expect(item.trim().length).toBeGreaterThan(0)
      }
      expect(c.emoji.length).toBeGreaterThan(0)
    }
  })

  test('colors are unique and avoid purple/indigo hues', () => {
    const colors = CHIIKAWA_CHARACTERS.map((c) => c.color)
    expect(new Set(colors).size).toBe(16)
    for (const color of colors) {
      expect(['purple', 'violet', 'indigo', 'fuchsia']).not.toContain(color)
    }
  })

  test('class strings and og color are consistent with the hue', () => {
    for (const c of CHIIKAWA_CHARACTERS) {
      expect(c.cardClassName).toContain(`bg-${c.color}-`)
      expect(c.cardClassName).toContain(`border-${c.color}-`)
      expect(c.nameClassName).toContain(`text-${c.color}-`)
      expect(c.ogColor).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  test('compatible / learn-from ids exist and never point to self', () => {
    for (const c of CHIIKAWA_CHARACTERS) {
      const refs = [...c.compatibleIds, ...c.learnFromIds]
      expect(refs.length).toBeGreaterThan(0)
      for (const id of refs) {
        expect(getChiikawaCharacter(id)).toBeDefined()
        expect(id).not.toBe(c.id)
      }
    }
  })

  test('official links point to the official site', () => {
    expect(CHIIKAWA_OFFICIAL_SITE).toBe('https://chiikawa-info.jp/')
    for (const c of CHIIKAWA_CHARACTERS) {
      expect(c.officialUrl.startsWith('https://chiikawa-info.jp/')).toBe(true)
    }
  })

  test('fan types are valid 4-letter personality types', () => {
    for (const c of CHIIKAWA_CHARACTERS) expect(ALL_TYPES).toContain(c.fanType)
  })

  test('getChiikawaCharacter returns undefined for unknown id', () => {
    expect(getChiikawaCharacter('nope')).toBeUndefined()
  })
})

describe('PERSONALITY_TYPE_LABELS', () => {
  test('covers all 16 types with non-empty EN/KO', () => {
    expect(Object.keys(PERSONALITY_TYPE_LABELS).sort()).toEqual([...ALL_TYPES].sort())
    for (const label of Object.values(PERSONALITY_TYPE_LABELS)) {
      expect(label.en.trim().length).toBeGreaterThan(0)
      expect(label.ko.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('trademark guard', () => {
  test('no visible string contains "MBTI"', () => {
    const strings = collectStrings([
      CHIIKAWA_INTRO,
      CHIIKAWA_QUESTIONS,
      CHIIKAWA_CHARACTERS,
      PERSONALITY_TYPE_LABELS,
    ])
    expect(strings.length).toBeGreaterThan(0)
    for (const s of strings) expect(s).not.toMatch(/mbti/i)
  })
})
