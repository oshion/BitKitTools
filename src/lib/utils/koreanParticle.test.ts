import { withAndParticle } from './koreanParticle'

describe('withAndParticle', () => {
  it("adds '와' after a syllable without a final consonant", () => {
    expect(withAndParticle('치이카와')).toBe('치이카와와')
    expect(withAndParticle('우사기')).toBe('우사기와')
  })

  it("adds '과' after a syllable with a final consonant", () => {
    expect(withAndParticle('곰')).toBe('곰과')
    expect(withAndParticle('라멘 갑옷씨')).toBe('라멘 갑옷씨와')
    expect(withAndParticle('장수풍뎅')).toBe('장수풍뎅과')
  })

  it('skips trailing non-Hangul characters such as parentheses', () => {
    expect(withAndParticle('카니(후루혼야)')).toBe('카니(후루혼야)와')
    expect(withAndParticle('곰 ')).toBe('곰 과')
  })

  it("adds '와(과)' when there is no Hangul at all", () => {
    expect(withAndParticle('Chiikawa')).toBe('Chiikawa와(과)')
    expect(withAndParticle('')).toBe('와(과)')
  })
})
