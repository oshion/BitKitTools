import {
  TEMPERAMENT_QUESTIONS,
  getQuestionsForAgeBand,
  AXIS_ORDER,
} from './temperamentQuestions'
import type { AgeBand, Axis } from './temperamentQuestions'

const AGE_BANDS: AgeBand[] = ['infant', 'toddler', 'preschooler']

const VALID_POLES_BY_AXIS: Record<Axis, readonly string[]> = {
  activity: ['active', 'calm'],
  social: ['social', 'shy'],
  adaptability: ['flexible', 'cautious'],
  reactivity: ['expressive', 'mellow'],
}

describe('TEMPERAMENT_QUESTIONS structure', () => {
  test('total question count is 60 (3 age bands × 20 questions)', () => {
    expect(TEMPERAMENT_QUESTIONS).toHaveLength(60)
  })

  test('all question IDs are unique', () => {
    const ids = TEMPERAMENT_QUESTIONS.map((q) => q.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(60)
  })

  for (const ageBand of AGE_BANDS) {
    describe(`ageBand: ${ageBand}`, () => {
      let questions: ReturnType<typeof getQuestionsForAgeBand>

      beforeEach(() => {
        questions = getQuestionsForAgeBand(ageBand)
      })

      test('has exactly 20 questions', () => {
        expect(questions).toHaveLength(20)
      })

      test('has exactly 5 questions per axis', () => {
        for (const axis of AXIS_ORDER) {
          const axisQuestions = questions.filter((q) => q.axis === axis)
          expect(axisQuestions).toHaveLength(5)
        }
      })

      test('all questions have non-empty EN prompts', () => {
        for (const q of questions) {
          expect(q.prompt.en.length).toBeGreaterThan(0)
        }
      })

      test('all questions have non-empty KO prompts', () => {
        for (const q of questions) {
          expect(q.prompt.ko.length).toBeGreaterThan(0)
        }
      })

      test('all questions have exactly 2 options', () => {
        for (const q of questions) {
          expect(q.options).toHaveLength(2)
        }
      })

      test('each option has valid poles for its axis', () => {
        for (const q of questions) {
          const validPoles = VALID_POLES_BY_AXIS[q.axis]
          for (const option of q.options) {
            expect(validPoles).toContain(option.pole)
          }
        }
      })

      test('each question has exactly one option per pole (no duplicate poles)', () => {
        for (const q of questions) {
          const poles = q.options.map((o) => o.pole)
          const unique = new Set(poles)
          expect(unique.size).toBe(2)
        }
      })

      test('both poles for each axis are covered by the two options', () => {
        for (const q of questions) {
          const validPoles = VALID_POLES_BY_AXIS[q.axis]
          const optionPoles = q.options.map((o) => o.pole).sort()
          expect(optionPoles).toEqual([...validPoles].sort())
        }
      })

      test('all option labels have non-empty EN and KO text', () => {
        for (const q of questions) {
          for (const option of q.options) {
            expect(option.label.en.length).toBeGreaterThan(0)
            expect(option.label.ko.length).toBeGreaterThan(0)
          }
        }
      })

      test('all question IDs start with the correct ageBand prefix', () => {
        for (const q of questions) {
          expect(q.id).toMatch(new RegExp(`^${ageBand}-`))
        }
      })
    })
  }
})

describe('AXIS_ORDER', () => {
  test('contains exactly 4 axes in canonical order', () => {
    expect(AXIS_ORDER).toEqual(['activity', 'social', 'adaptability', 'reactivity'])
  })
})
