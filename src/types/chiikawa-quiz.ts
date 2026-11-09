import type { LocalizedText } from './tool'

export type AnswerLetter = 'A' | 'B' | 'C' | 'D'
export type PersonalityAxis = 'EI' | 'SN' | 'TF' | 'JP'
export type PersonalityLetter = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
export type PersonalityType = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`
export type ChiikawaCharacterId =
  | 'chiikawa'
  | 'hachiware'
  | 'usagi'
  | 'momonga'
  | 'kurimanju'
  | 'shisa'
  | 'rakko'
  | 'kani'
  | 'anoko'
  | 'dekatsuyo'
  | 'ode'
  | 'pochette-armor'
  | 'labor-armor'
  | 'ramen-armor'
  | 'pajama-party'
  | 'kabutomushi'

export type ChiikawaQuestion = {
  /** 1~24 */
  number: number
  text: LocalizedText
  options: Record<AnswerLetter, LocalizedText>
  /** Q1~Q16만: 이 문항이 집계되는 축과 선택지별 글자 (스펙의 수정 채점표) */
  scoring?: { axis: PersonalityAxis; letters: Record<AnswerLetter, PersonalityLetter> }
}

export type LocalizedList = { en: string[]; ko: string[] }

export type ChiikawaCharacter = {
  id: ChiikawaCharacterId
  name: LocalizedText
  emoji: string
  /** Tailwind 색조 이름 (예: 'pink') — 중복 검사용 */
  color: string
  /** 완성된 Tailwind 클래스 문자열 — 동적 조합 금지 */
  cardClassName: string
  nameClassName: string
  /** OG 이미지 배경 등 Tailwind 밖에서 쓸 hex 색 */
  ogColor: string
  officialUrl: string
  /** 팬 설정 성격 유형 (공식 설정 아님) */
  fanType: PersonalityType
  tagline: LocalizedText
  coreTraits: LocalizedText
  strengths: LocalizedList
  cautions: LocalizedList
  relationships: LocalizedList
  compatibleIds: ChiikawaCharacterId[]
  learnFromIds: ChiikawaCharacterId[]
  /** Q17~Q24 기준 답안 8개 (스펙의 수정 기준 답안 표) */
  answerKey: readonly AnswerLetter[]
}
