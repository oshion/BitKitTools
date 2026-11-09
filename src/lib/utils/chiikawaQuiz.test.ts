import { CHIIKAWA_CHARACTERS } from '@/lib/config/chiikawaCharacters'
import { CHIIKAWA_QUESTIONS } from '@/lib/config/chiikawaQuestions'
import type { AnswerLetter, PersonalityAxis, PersonalityLetter } from '@/types/chiikawa-quiz'
import { getChiikawaResult, rankCharacters, scorePersonalityType } from './chiikawaQuiz'

const LETTERS: AnswerLetter[] = ['A', 'B', 'C', 'D']

/** Q1~Q16 전부 A, Q17~Q24는 주어진 값(기본 전부 A) */
function makeAnswers(
  overrides: Record<number, AnswerLetter> = {},
  base: AnswerLetter = 'A',
): AnswerLetter[] {
  const answers: AnswerLetter[] = Array.from({ length: 24 }, () => base)
  for (const [q, letter] of Object.entries(overrides)) answers[Number(q) - 1] = letter
  return answers
}

/** 질문 번호 → 원하는 글자를 주는 선택지 */
function optionFor(questionNumber: number, letter: PersonalityLetter): AnswerLetter {
  const scoring = CHIIKAWA_QUESTIONS[questionNumber - 1].scoring
  if (!scoring) throw new Error(`Q${questionNumber} has no scoring`)
  const found = LETTERS.find((l) => scoring.letters[l] === letter)
  if (!found) throw new Error(`Q${questionNumber} has no option for ${letter}`)
  return found
}

function questionsOf(axis: PersonalityAxis): number[] {
  return CHIIKAWA_QUESTIONS.filter((q) => q.scoring?.axis === axis).map((q) => q.number)
}

const AXIS_POSITION: Record<PersonalityAxis, number> = { EI: 0, SN: 1, TF: 2, JP: 3 }
const TIE_BREAKER: Record<PersonalityAxis, number> = { EI: 1, SN: 7, TF: 3, JP: 4 }
const AXIS_LETTERS: Record<PersonalityAxis, [PersonalityLetter, PersonalityLetter]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
}

function withCharacterAnswers(key: readonly AnswerLetter[]): AnswerLetter[] {
  const answers = makeAnswers()
  key.forEach((letter, i) => {
    answers[16 + i] = letter
  })
  return answers
}

describe('scorePersonalityType', () => {
  it('returns letters in EI-SN-TF-JP order from majority votes', () => {
    const overrides: Record<number, AnswerLetter> = {}
    for (const q of questionsOf('EI')) overrides[q] = optionFor(q, 'E')
    for (const q of questionsOf('SN')) overrides[q] = optionFor(q, 'N')
    for (const q of questionsOf('TF')) overrides[q] = optionFor(q, 'T')
    for (const q of questionsOf('JP')) overrides[q] = optionFor(q, 'P')
    expect(scorePersonalityType(makeAnswers(overrides))).toBe('ENTP')
  })

  it('uses a 3:1 majority', () => {
    const [q1, q2, q3, q4] = questionsOf('EI')
    const answers = makeAnswers({
      [q1]: optionFor(q1, 'I'),
      [q2]: optionFor(q2, 'E'),
      [q3]: optionFor(q3, 'E'),
      [q4]: optionFor(q4, 'E'),
    })
    expect(scorePersonalityType(answers)[0]).toBe('E')
  })

  it.each(['EI', 'SN', 'TF', 'JP'] as PersonalityAxis[])(
    'breaks a 2:2 tie on %s using the tie-breaker question',
    (axis) => {
      const tieQ = TIE_BREAKER[axis]
      const others = questionsOf(axis).filter((q) => q !== tieQ)
      for (const winner of AXIS_LETTERS[axis]) {
        const loser = AXIS_LETTERS[axis].find((l) => l !== winner) as PersonalityLetter
        // tie-breaker + one other → winner, remaining two → loser (2:2)
        const answers = makeAnswers({
          [tieQ]: optionFor(tieQ, winner),
          [others[0]]: optionFor(others[0], loser),
          [others[1]]: optionFor(others[1], loser),
          [others[2]]: optionFor(others[2], winner),
        })
        expect(scorePersonalityType(answers)[AXIS_POSITION[axis]]).toBe(winner)
      }
    },
  )

  it('is not affected by Q17~Q24', () => {
    const base = makeAnswers({ 2: 'B', 7: 'C', 11: 'D' })
    const changed = [...base]
    for (let i = 16; i < 24; i++) changed[i] = 'D'
    expect(scorePersonalityType(changed)).toBe(scorePersonalityType(base))
  })

  it.each(['EI', 'SN', 'TF', 'JP'] as PersonalityAxis[])(
    'splits %s exactly 50:50 over all 256 combinations',
    (axis) => {
      const qs = questionsOf(axis)
      expect(qs).toHaveLength(4)
      const counts: Record<string, number> = {}
      const answers = makeAnswers()
      for (const a of LETTERS)
        for (const b of LETTERS)
          for (const c of LETTERS)
            for (const d of LETTERS) {
              answers[qs[0] - 1] = a
              answers[qs[1] - 1] = b
              answers[qs[2] - 1] = c
              answers[qs[3] - 1] = d
              const letter = scorePersonalityType(answers)[AXIS_POSITION[axis]]
              counts[letter] = (counts[letter] ?? 0) + 1
            }
      const [first, second] = AXIS_LETTERS[axis]
      expect(counts[first]).toBe(128)
      expect(counts[second]).toBe(128)
    },
  )
})

describe('rankCharacters', () => {
  it('returns all 16 characters without duplicates', () => {
    const ranked = rankCharacters(makeAnswers())
    expect(ranked).toHaveLength(16)
    expect(new Set(ranked.map((m) => m.id)).size).toBe(16)
  })

  it.each(CHIIKAWA_CHARACTERS.map((c) => [c.id, c.answerKey] as const))(
    'ranks %s first with similarity 100 when answering its key',
    (id, key) => {
      const [first] = rankCharacters(withCharacterAnswers(key))
      expect(first.id).toBe(id)
      expect(first.matches).toBe(8)
      expect(first.similarity).toBe(100)
    },
  )

  it('computes similarity as matches / 8 * 100', () => {
    const key = [...CHIIKAWA_CHARACTERS[0].answerKey]
    key[0] = key[0] === 'B' ? 'C' : 'B'
    const match = rankCharacters(withCharacterAnswers(key)).find((m) => m.id === 'chiikawa')
    expect(match?.matches).toBe(7)
    expect(match?.similarity).toBe(87.5)
  })

  it('sorts by score descending', () => {
    const ranked = rankCharacters(withCharacterAnswers(['B', 'C', 'D', 'A', 'B', 'C', 'D', 'A']))
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].matches).toBeGreaterThanOrEqual(ranked[i].matches)
    }
  })

  it('is not affected by Q1~Q16', () => {
    const base = withCharacterAnswers(['B', 'C', 'D', 'A', 'B', 'C', 'D', 'A'])
    const changed = [...base]
    for (let i = 0; i < 16; i++) changed[i] = 'D'
    expect(rankCharacters(changed)).toEqual(rankCharacters(base))
  })

  it('breaks a score tie by Q24 match first', () => {
    // chiikawa  A-A-A-D-A-A-A-A, hachiware B-A-A-A-A-B-A-B
    // user      C-C-A-D-A-C-A-B
    // chiikawa:  Q19,20,21,23 = 4 (Q24 miss)
    // hachiware: Q19,21,23,24 = 4 (Q24 hit) → 앞순위 (데이터 순서는 chiikawa가 먼저)
    const answers = withCharacterAnswers(['C', 'C', 'A', 'D', 'A', 'C', 'A', 'B'])
    const ranked = rankCharacters(answers)
    const chiikawa = ranked.findIndex((m) => m.id === 'chiikawa')
    const hachiware = ranked.findIndex((m) => m.id === 'hachiware')
    expect(ranked[chiikawa].matches).toBe(4)
    expect(ranked[hachiware].matches).toBe(4)
    expect(hachiware).toBeLessThan(chiikawa)
  })

  it('falls back to Q23 when Q24 is equal', () => {
    // rakko     D-C-B-B-B-D-B-D
    // anoko     C-B-D-D-C-C-D-D
    // user:     D C D D C C B D
    // rakko:  17,18,23,24 = 4; Q24 hit, Q23 hit
    // anoko:  19,20,21,22,24 = 5 → drop Q22
    // user:     D C D D C A B D
    // rakko:  17,18,23,24 = 4 (Q24 hit, Q23 hit)
    // anoko:  19,20,21,24 = 4 (Q24 hit, Q23 miss)
    const answers = withCharacterAnswers(['D', 'C', 'D', 'D', 'C', 'A', 'B', 'D'])
    const ranked = rankCharacters(answers)
    const rakko = ranked.findIndex((m) => m.id === 'rakko')
    const anoko = ranked.findIndex((m) => m.id === 'anoko')
    expect(ranked[rakko].matches).toBe(4)
    expect(ranked[anoko].matches).toBe(4)
    expect(rakko).toBeLessThan(anoko)
  })

  it('falls back to data order when every question compares equal', () => {
    // pajama-party B-B-C-A-B-C-C-B, kabutomushi B-B-C-A-C-B-C-C
    // differ only at Q21, Q22, Q24. Answer D on those → both 5, identical hit pattern.
    const answers = withCharacterAnswers(['B', 'B', 'C', 'A', 'D', 'D', 'C', 'D'])
    const ranked = rankCharacters(answers)
    const pajama = ranked.findIndex((m) => m.id === 'pajama-party')
    const kabuto = ranked.findIndex((m) => m.id === 'kabutomushi')
    expect(ranked[pajama].matches).toBe(ranked[kabuto].matches)
    expect(pajama).toBeLessThan(kabuto)
  })

  it('does not mutate the input', () => {
    const answers = makeAnswers({ 20: 'C' })
    const copy = [...answers]
    rankCharacters(answers)
    scorePersonalityType(answers)
    getChiikawaResult(answers)
    expect(answers).toEqual(copy)
  })

  it('gives every character first place in 3%~12% of all 65,536 combinations', () => {
    const wins: Record<string, number> = {}
    const answers = makeAnswers()
    const total = 4 ** 8
    for (let n = 0; n < total; n++) {
      let x = n
      for (let i = 0; i < 8; i++) {
        answers[16 + i] = LETTERS[x % 4]
        x = Math.floor(x / 4)
      }
      const id = getChiikawaResult(answers).top[0].id
      wins[id] = (wins[id] ?? 0) + 1
    }
    expect(Object.keys(wins)).toHaveLength(16)
    for (const c of CHIIKAWA_CHARACTERS) {
      const ratio = (wins[c.id] ?? 0) / total
      expect(ratio).toBeGreaterThanOrEqual(0.03)
      expect(ratio).toBeLessThanOrEqual(0.12)
    }
  })
})

describe('getChiikawaResult', () => {
  it('returns the personality type and top 3 matches', () => {
    const answers = withCharacterAnswers(CHIIKAWA_CHARACTERS[2].answerKey)
    const result = getChiikawaResult(answers)
    expect(result.personalityType).toBe(scorePersonalityType(answers))
    expect(result.top).toHaveLength(3)
    expect(result.top).toEqual(rankCharacters(answers).slice(0, 3))
    expect(result.top[0].id).toBe('usagi')
  })
})

describe('input validation', () => {
  it('throws RangeError for wrong length', () => {
    const short = makeAnswers().slice(0, 23)
    expect(() => scorePersonalityType(short)).toThrow(RangeError)
    expect(() => rankCharacters(short)).toThrow(RangeError)
    expect(() => getChiikawaResult(short)).toThrow(RangeError)
  })

  it('throws RangeError for invalid letters', () => {
    const bad = makeAnswers() as string[]
    bad[5] = 'E'
    const invalid = bad as AnswerLetter[]
    expect(() => scorePersonalityType(invalid)).toThrow(RangeError)
    expect(() => rankCharacters(invalid)).toThrow(RangeError)
  })
})
