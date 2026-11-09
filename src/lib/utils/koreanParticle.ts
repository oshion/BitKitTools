const HANGUL_START = 0xac00
const HANGUL_END = 0xd7a3
/** 한글 음절 = 초성 × 588 + 중성 × 28 + 종성 — 종성 0이면 받침 없음 */
const FINAL_CONSONANT_COUNT = 28

/** 이름 뒤에 붙을 '와'/'과'를 고른다. 문자열의 마지막 한글 음절 받침 유무로 판단(괄호·공백 등 비한글은 건너뜀) */
export function withAndParticle(name: string): string {
  for (let i = name.length - 1; i >= 0; i--) {
    const code = name.charCodeAt(i)
    if (code < HANGUL_START || code > HANGUL_END) continue
    const hasFinal = (code - HANGUL_START) % FINAL_CONSONANT_COUNT !== 0
    return `${name}${hasFinal ? '과' : '와'}`
  }
  return `${name}와(과)`
}
