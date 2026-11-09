import { CHIIKAWA_INTRO, CHIIKAWA_QUESTIONS } from './chiikawaQuestions'
import type { AnswerLetter, PersonalityAxis } from '@/types/chiikawa-quiz'

const LETTERS: AnswerLetter[] = ['A', 'B', 'C', 'D']
const AXIS_POLES: Record<PersonalityAxis, [string, string]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
}

describe('CHIIKAWA_INTRO', () => {
  test('has non-empty EN/KO title and body', () => {
    for (const text of [CHIIKAWA_INTRO.title, CHIIKAWA_INTRO.body]) {
      expect(text.en.trim().length).toBeGreaterThan(0)
      expect(text.ko.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('CHIIKAWA_QUESTIONS structure', () => {
  test('has 24 questions numbered 1..24 in order', () => {
    expect(CHIIKAWA_QUESTIONS).toHaveLength(24)
    CHIIKAWA_QUESTIONS.forEach((q, i) => expect(q.number).toBe(i + 1))
  })

  test('every question has non-empty EN/KO text and A~D options', () => {
    for (const q of CHIIKAWA_QUESTIONS) {
      expect(q.text.en.trim().length).toBeGreaterThan(0)
      expect(q.text.ko.trim().length).toBeGreaterThan(0)
      expect(Object.keys(q.options).sort()).toEqual(LETTERS)
      for (const letter of LETTERS) {
        expect(q.options[letter].en.trim().length).toBeGreaterThan(0)
        expect(q.options[letter].ko.trim().length).toBeGreaterThan(0)
      }
    }
  })

  test('only Q1~Q16 have scoring', () => {
    for (const q of CHIIKAWA_QUESTIONS) {
      if (q.number <= 16) expect(q.scoring).toBeDefined()
      else expect(q.scoring).toBeUndefined()
    }
  })

  test('each axis has exactly 4 scoring questions', () => {
    for (const axis of Object.keys(AXIS_POLES) as PersonalityAxis[]) {
      expect(CHIIKAWA_QUESTIONS.filter((q) => q.scoring?.axis === axis)).toHaveLength(4)
    }
  })

  test('every scoring question splits its options 2:2 between the axis poles', () => {
    for (const q of CHIIKAWA_QUESTIONS) {
      if (!q.scoring) continue
      const [a, b] = AXIS_POLES[q.scoring.axis]
      const letters = LETTERS.map((l) => q.scoring?.letters[l])
      expect(letters.filter((l) => l === a)).toHaveLength(2)
      expect(letters.filter((l) => l === b)).toHaveLength(2)
    }
  })

  test('Q23 uses the revised wording', () => {
    expect(CHIIKAWA_QUESTIONS[22].text.ko).toBe('친구들이 나를 한마디로 표현한다면?')
  })
})

describe('revised scoring table (spec regression)', () => {
  const scoring = (n: number) => CHIIKAWA_QUESTIONS[n - 1].scoring

  test('cells changed from the original draft', () => {
    expect(scoring(10)?.letters.B).toBe('I')
    expect(scoring(7)?.letters.C).toBe('N')
    expect(scoring(3)?.letters.D).toBe('T')
  })

  test('full table matches the spec', () => {
    const expected: Record<number, [PersonalityAxis, string]> = {
      1: ['EI', 'IEEI'],
      2: ['EI', 'IEEI'],
      6: ['EI', 'IEIE'],
      10: ['EI', 'EIEI'],
      7: ['SN', 'NSNS'],
      8: ['SN', 'SSNN'],
      12: ['SN', 'SSNN'],
      14: ['SN', 'NSSN'],
      3: ['TF', 'FTFT'],
      5: ['TF', 'FTFT'],
      11: ['TF', 'FTTF'],
      13: ['TF', 'FTFT'],
      4: ['JP', 'PJPJ'],
      9: ['JP', 'PJPJ'],
      15: ['JP', 'JPJP'],
      16: ['JP', 'PJPJ'],
    }
    for (const [n, [axis, letters]] of Object.entries(expected)) {
      const s = scoring(Number(n))
      expect(s?.axis).toBe(axis)
      expect(LETTERS.map((l) => s?.letters[l]).join('')).toBe(letters)
    }
  })
})
