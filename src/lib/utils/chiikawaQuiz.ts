/**
 * Chiikawa Personality Test — Scoring Logic
 *
 * Pure functions: no side-effects, no fetch calls.
 * 채점표(Q1~Q16 scoring)와 기준 답안(answerKey)은 config 데이터에서 읽는다 — 여기 다시 적지 않는다.
 * 규칙 → docs/screens/fun-chiikawa-personality-test.md "성격 유형 산출", "캐릭터 매칭"
 */

import { CHIIKAWA_CHARACTERS } from '@/lib/config/chiikawaCharacters'
import { CHIIKAWA_QUESTIONS } from '@/lib/config/chiikawaQuestions'
import type {
  AnswerLetter,
  ChiikawaCharacterId,
  PersonalityAxis,
  PersonalityLetter,
  PersonalityType,
} from '@/types/chiikawa-quiz'

export type CharacterMatch = {
  id: ChiikawaCharacterId
  matches: number
  similarity: number
}

export type ChiikawaResult = {
  personalityType: PersonalityType
  /** 상위 3명, top[0]이 최종 결과 */
  top: CharacterMatch[]
}

const TOTAL_QUESTIONS = 24
/** Q17~Q24 = 인덱스 16~23 */
const CHARACTER_OFFSET = 16
const CHARACTER_QUESTIONS = 8
const VALID_LETTERS: readonly string[] = ['A', 'B', 'C', 'D']

const AXIS_ORDER: readonly PersonalityAxis[] = ['EI', 'SN', 'TF', 'JP']
const AXIS_LETTERS: Record<PersonalityAxis, readonly [PersonalityLetter, PersonalityLetter]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
}
/** 2:2 동점 시 기준 문항 번호 */
const TIE_BREAKER_QUESTION: Record<PersonalityAxis, number> = { EI: 1, SN: 7, TF: 3, JP: 4 }

function assertValidAnswers(answers: readonly AnswerLetter[]): void {
  if (answers.length !== TOTAL_QUESTIONS) {
    throw new RangeError(`Expected ${TOTAL_QUESTIONS} answers, got ${answers.length}`)
  }
  answers.forEach((answer, i) => {
    if (!VALID_LETTERS.includes(answer)) {
      throw new RangeError(`Invalid answer for Q${i + 1}: ${String(answer)}`)
    }
  })
}

function letterFor(questionNumber: number, answers: readonly AnswerLetter[]): PersonalityLetter {
  const scoring = CHIIKAWA_QUESTIONS[questionNumber - 1]?.scoring
  const answer = answers[questionNumber - 1]
  if (!scoring || !answer) throw new Error(`Q${questionNumber} has no scoring`)
  return scoring.letters[answer]
}

/** answers[i] = Q(i+1)의 응답. Q1~Q16만 사용한다. */
export function scorePersonalityType(answers: readonly AnswerLetter[]): PersonalityType {
  assertValidAnswers(answers)

  const counts: Partial<Record<PersonalityLetter, number>> = {}
  for (const question of CHIIKAWA_QUESTIONS) {
    if (!question.scoring) continue
    const letter = letterFor(question.number, answers)
    counts[letter] = (counts[letter] ?? 0) + 1
  }

  const type = AXIS_ORDER.map((axis) => {
    const [first, second] = AXIS_LETTERS[axis]
    const a = counts[first] ?? 0
    const b = counts[second] ?? 0
    if (a !== b) return a > b ? first : second
    return letterFor(TIE_BREAKER_QUESTION[axis], answers)
  }).join('')

  return type as PersonalityType
}

type ScoredCharacter = {
  index: number
  id: ChiikawaCharacterId
  matches: number
  /** hits[k] = Q(17+k)에서 기준 답과 일치 */
  hits: boolean[]
}

/**
 * 정렬: (1) 점수 내림차순 (2) Q24 → Q17 순으로 사용자 응답과 기준 답이 일치하는 캐릭터 우선
 * (3) CHIIKAWA_CHARACTERS 배열 순서
 */
function compareScored(a: ScoredCharacter, b: ScoredCharacter): number {
  if (a.matches !== b.matches) return b.matches - a.matches
  for (let k = CHARACTER_QUESTIONS - 1; k >= 0; k--) {
    if (a.hits[k] !== b.hits[k]) return a.hits[k] ? -1 : 1
  }
  return a.index - b.index
}

/** 16명 전체를 순위대로 정렬해 반환. Q17~Q24만 사용한다. */
export function rankCharacters(answers: readonly AnswerLetter[]): CharacterMatch[] {
  assertValidAnswers(answers)

  const scored: ScoredCharacter[] = CHIIKAWA_CHARACTERS.map((character, index) => {
    const hits = character.answerKey.map((key, k) => answers[CHARACTER_OFFSET + k] === key)
    return { index, id: character.id, matches: hits.filter(Boolean).length, hits }
  })

  return scored.sort(compareScored).map(({ id, matches }) => ({
    id,
    matches,
    similarity: (matches / CHARACTER_QUESTIONS) * 100,
  }))
}

export function getChiikawaResult(answers: readonly AnswerLetter[]): ChiikawaResult {
  return {
    personalityType: scorePersonalityType(answers),
    top: rankCharacters(answers).slice(0, 3),
  }
}
