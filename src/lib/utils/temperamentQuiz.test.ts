import { scoreQuiz, getPersonaCode } from './temperamentQuiz'
import type { QuizAnswer, AxisResult } from './temperamentQuiz'
import { TEMPERAMENT_PERSONAS, getPersonaByCode } from '@/lib/config/temperamentPersonas'

// ---------------------------------------------------------------------------
// scoreQuiz
// ---------------------------------------------------------------------------

describe('scoreQuiz', () => {
  test('all answers in one direction returns clear winner', () => {
    const answers: QuizAnswer[] = [
      ...Array(5).fill(null).map(() => ({ axis: 'activity' as const, pole: 'active' })),
      ...Array(5).fill(null).map(() => ({ axis: 'social' as const, pole: 'social' })),
      ...Array(5).fill(null).map(() => ({ axis: 'adaptability' as const, pole: 'flexible' })),
      ...Array(5).fill(null).map(() => ({ axis: 'reactivity' as const, pole: 'expressive' })),
    ]
    const result = scoreQuiz(answers)
    expect(result.activity).toBe('active')
    expect(result.social).toBe('social')
    expect(result.adaptability).toBe('flexible')
    expect(result.reactivity).toBe('expressive')
  })

  test('all answers in the opposite direction returns correct winner', () => {
    const answers: QuizAnswer[] = [
      ...Array(5).fill(null).map(() => ({ axis: 'activity' as const, pole: 'calm' })),
      ...Array(5).fill(null).map(() => ({ axis: 'social' as const, pole: 'shy' })),
      ...Array(5).fill(null).map(() => ({ axis: 'adaptability' as const, pole: 'cautious' })),
      ...Array(5).fill(null).map(() => ({ axis: 'reactivity' as const, pole: 'mellow' })),
    ]
    const result = scoreQuiz(answers)
    expect(result.activity).toBe('calm')
    expect(result.social).toBe('shy')
    expect(result.adaptability).toBe('cautious')
    expect(result.reactivity).toBe('mellow')
  })

  test('3:2 majority wins on each axis', () => {
    const answers: QuizAnswer[] = [
      // activity: 3 active, 2 calm → active wins
      { axis: 'activity', pole: 'active' },
      { axis: 'activity', pole: 'active' },
      { axis: 'activity', pole: 'active' },
      { axis: 'activity', pole: 'calm' },
      { axis: 'activity', pole: 'calm' },
      // social: 2 social, 3 shy → shy wins
      { axis: 'social', pole: 'social' },
      { axis: 'social', pole: 'social' },
      { axis: 'social', pole: 'shy' },
      { axis: 'social', pole: 'shy' },
      { axis: 'social', pole: 'shy' },
      // adaptability: 3 flexible, 2 cautious → flexible wins
      { axis: 'adaptability', pole: 'flexible' },
      { axis: 'adaptability', pole: 'flexible' },
      { axis: 'adaptability', pole: 'flexible' },
      { axis: 'adaptability', pole: 'cautious' },
      { axis: 'adaptability', pole: 'cautious' },
      // reactivity: 2 expressive, 3 mellow → mellow wins
      { axis: 'reactivity', pole: 'expressive' },
      { axis: 'reactivity', pole: 'expressive' },
      { axis: 'reactivity', pole: 'mellow' },
      { axis: 'reactivity', pole: 'mellow' },
      { axis: 'reactivity', pole: 'mellow' },
    ]
    const result = scoreQuiz(answers)
    expect(result.activity).toBe('active')
    expect(result.social).toBe('shy')
    expect(result.adaptability).toBe('flexible')
    expect(result.reactivity).toBe('mellow')
  })

  test('4:1 majority is correctly resolved', () => {
    const answers: QuizAnswer[] = [
      ...Array(4).fill(null).map(() => ({ axis: 'activity' as const, pole: 'calm' })),
      { axis: 'activity', pole: 'active' },
      ...Array(5).fill(null).map(() => ({ axis: 'social' as const, pole: 'social' })),
      ...Array(5).fill(null).map(() => ({ axis: 'adaptability' as const, pole: 'cautious' })),
      ...Array(5).fill(null).map(() => ({ axis: 'reactivity' as const, pole: 'mellow' })),
    ]
    const result = scoreQuiz(answers)
    expect(result.activity).toBe('calm')
  })

  test('empty answers array returns deterministic default without throwing', () => {
    const result = scoreQuiz([])
    expect(['active', 'calm']).toContain(result.activity)
    expect(['social', 'shy']).toContain(result.social)
    expect(['flexible', 'cautious']).toContain(result.adaptability)
    expect(['expressive', 'mellow']).toContain(result.reactivity)
  })

  test('answers with invalid poles are ignored', () => {
    const answers: QuizAnswer[] = [
      { axis: 'activity', pole: 'active' },
      { axis: 'activity', pole: 'INVALID_POLE' },
      { axis: 'activity', pole: 'active' },
      { axis: 'activity', pole: 'active' },
      { axis: 'activity', pole: 'active' },
      ...Array(5).fill(null).map(() => ({ axis: 'social' as const, pole: 'social' })),
      ...Array(5).fill(null).map(() => ({ axis: 'adaptability' as const, pole: 'flexible' })),
      ...Array(5).fill(null).map(() => ({ axis: 'reactivity' as const, pole: 'expressive' })),
    ]
    const result = scoreQuiz(answers)
    // 4 valid 'active' vs 0 valid 'calm' (invalid poles ignored)
    expect(result.activity).toBe('active')
  })

  test('tied vote resolves deterministically without throwing', () => {
    // 2 active vs 2 calm — tie. Should not throw and should return a valid value.
    const answers: QuizAnswer[] = [
      { axis: 'activity', pole: 'active' },
      { axis: 'activity', pole: 'active' },
      { axis: 'activity', pole: 'calm' },
      { axis: 'activity', pole: 'calm' },
      ...Array(5).fill(null).map(() => ({ axis: 'social' as const, pole: 'social' })),
      ...Array(5).fill(null).map(() => ({ axis: 'adaptability' as const, pole: 'flexible' })),
      ...Array(5).fill(null).map(() => ({ axis: 'reactivity' as const, pole: 'expressive' })),
    ]
    expect(() => scoreQuiz(answers)).not.toThrow()
    const result = scoreQuiz(answers)
    expect(['active', 'calm']).toContain(result.activity)
    // Verify it's the same result every time (deterministic)
    const result2 = scoreQuiz(answers)
    expect(result.activity).toBe(result2.activity)
  })
})

// ---------------------------------------------------------------------------
// getPersonaCode
// ---------------------------------------------------------------------------

describe('getPersonaCode', () => {
  test('constructs the correct code string', () => {
    const result: AxisResult = {
      activity: 'active',
      social: 'social',
      adaptability: 'flexible',
      reactivity: 'expressive',
    }
    expect(getPersonaCode(result)).toBe('active-social-flexible-expressive')
  })

  test('all-calm-shy-cautious-mellow produces correct code', () => {
    const result: AxisResult = {
      activity: 'calm',
      social: 'shy',
      adaptability: 'cautious',
      reactivity: 'mellow',
    }
    expect(getPersonaCode(result)).toBe('calm-shy-cautious-mellow')
  })

  test('mixed axes produce correct code', () => {
    const result: AxisResult = {
      activity: 'calm',
      social: 'social',
      adaptability: 'cautious',
      reactivity: 'expressive',
    }
    expect(getPersonaCode(result)).toBe('calm-social-cautious-expressive')
  })
})

// ---------------------------------------------------------------------------
// Critical: all 16 persona codes exist in TEMPERAMENT_PERSONAS
// ---------------------------------------------------------------------------

describe('all 16 persona combinations are defined', () => {
  const activityPoles = ['active', 'calm'] as const
  const socialPoles = ['social', 'shy'] as const
  const adaptabilityPoles = ['flexible', 'cautious'] as const
  const reactivityPoles = ['expressive', 'mellow'] as const

  for (const activity of activityPoles) {
    for (const social of socialPoles) {
      for (const adaptability of adaptabilityPoles) {
        for (const reactivity of reactivityPoles) {
          const result: AxisResult = { activity, social, adaptability, reactivity }
          const code = getPersonaCode(result)

          test(`persona exists for code: ${code}`, () => {
            const persona = getPersonaByCode(code)
            expect(persona).toBeDefined()
          })

          test(`persona tips are non-empty for code: ${code}`, () => {
            const persona = getPersonaByCode(code)
            expect(persona).toBeDefined()
            expect(persona!.tips.en.length).toBeGreaterThanOrEqual(2)
            expect(persona!.tips.ko.length).toBeGreaterThanOrEqual(2)
          })

          test(`persona name is non-empty for code: ${code}`, () => {
            const persona = getPersonaByCode(code)
            expect(persona).toBeDefined()
            expect(persona!.name.en.length).toBeGreaterThan(0)
            expect(persona!.name.ko.length).toBeGreaterThan(0)
          })
        }
      }
    }
  }

  test('TEMPERAMENT_PERSONAS has exactly 16 entries', () => {
    expect(TEMPERAMENT_PERSONAS).toHaveLength(16)
  })

  test('all persona codes are unique', () => {
    const codes = TEMPERAMENT_PERSONAS.map((p) => p.code)
    const unique = new Set(codes)
    expect(unique.size).toBe(16)
  })

  test('all colorHue values are unique', () => {
    const hues = TEMPERAMENT_PERSONAS.map((p) => p.colorHue)
    const unique = new Set(hues)
    expect(unique.size).toBe(16)
  })

  test('all colorHue values are in [0, 359]', () => {
    for (const persona of TEMPERAMENT_PERSONAS) {
      expect(persona.colorHue).toBeGreaterThanOrEqual(0)
      expect(persona.colorHue).toBeLessThanOrEqual(359)
    }
  })
})
