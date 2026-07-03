import { generatePassword, estimatePasswordStrength } from './passwordGenerator'
import type { PasswordOptions } from './passwordGenerator'

const defaultOptions: PasswordOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: false,
}

describe('generatePassword', () => {
  describe('length', () => {
    it('generates a password of the requested length', () => {
      const pw = generatePassword({ ...defaultOptions, length: 16 })
      expect(pw).toHaveLength(16)
    })

    it('generates a password of length 8 (minimum)', () => {
      const pw = generatePassword({ ...defaultOptions, length: 8 })
      expect(pw).toHaveLength(8)
    })

    it('generates a password of length 64 (maximum)', () => {
      const pw = generatePassword({ ...defaultOptions, length: 64 })
      expect(pw).toHaveLength(64)
    })

    it('generates a password of length 32', () => {
      const pw = generatePassword({ ...defaultOptions, length: 32 })
      expect(pw).toHaveLength(32)
    })
  })

  describe('character classes', () => {
    it('uses only uppercase when only uppercase is enabled', () => {
      const pw = generatePassword({
        ...defaultOptions,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      })
      expect(pw).toMatch(/^[A-Z]+$/)
    })

    it('uses only lowercase when only lowercase is enabled', () => {
      const pw = generatePassword({
        ...defaultOptions,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
      })
      expect(pw).toMatch(/^[a-z]+$/)
    })

    it('uses only numbers when only numbers are enabled', () => {
      const pw = generatePassword({
        ...defaultOptions,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
      })
      expect(pw).toMatch(/^[0-9]+$/)
    })

    it('uses only symbols when only symbols are enabled', () => {
      const pw = generatePassword({
        ...defaultOptions,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: true,
      })
      expect(pw).toMatch(/^[!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$/)
    })

    it('contains at least one uppercase when uppercase is enabled', () => {
      // Run multiple times to reduce flakiness
      const passwords = Array.from({ length: 5 }, () =>
        generatePassword({ ...defaultOptions, length: 20 })
      )
      passwords.forEach((pw) => {
        expect(pw).toMatch(/[A-Z]/)
      })
    })

    it('contains at least one lowercase when lowercase is enabled', () => {
      const passwords = Array.from({ length: 5 }, () =>
        generatePassword({ ...defaultOptions, length: 20 })
      )
      passwords.forEach((pw) => {
        expect(pw).toMatch(/[a-z]/)
      })
    })

    it('contains at least one number when numbers are enabled', () => {
      const passwords = Array.from({ length: 5 }, () =>
        generatePassword({ ...defaultOptions, length: 20 })
      )
      passwords.forEach((pw) => {
        expect(pw).toMatch(/[0-9]/)
      })
    })

    it('contains at least one symbol when symbols are enabled', () => {
      const passwords = Array.from({ length: 5 }, () =>
        generatePassword({ ...defaultOptions, length: 20 })
      )
      passwords.forEach((pw) => {
        expect(pw).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/)
      })
    })
  })

  describe('excludeAmbiguous', () => {
    it('does not include ambiguous characters when excludeAmbiguous is true', () => {
      // Generate many passwords to increase chance of hitting ambiguous chars
      const passwords = Array.from({ length: 20 }, () =>
        generatePassword({
          ...defaultOptions,
          length: 32,
          excludeAmbiguous: true,
        })
      )
      passwords.forEach((pw) => {
        expect(pw).not.toMatch(/[0OoIl|1]/)
      })
    })

    it('may include ambiguous characters when excludeAmbiguous is false', () => {
      // This test verifies the character set is not restricted when false
      // We just check the password is generated without errors
      const pw = generatePassword({ ...defaultOptions, excludeAmbiguous: false })
      expect(pw).toHaveLength(defaultOptions.length)
    })
  })

  describe('randomness', () => {
    it('does not return the same password twice in a row', () => {
      const pw1 = generatePassword(defaultOptions)
      const pw2 = generatePassword(defaultOptions)
      // Statistically near-impossible to match with 16+ char password from large charset
      expect(pw1).not.toBe(pw2)
    })

    it('uses crypto.getRandomValues (not Math.random)', () => {
      const spy = jest.spyOn(globalThis.crypto, 'getRandomValues')
      generatePassword(defaultOptions)
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('fallback behavior', () => {
    it('still produces a string even when all options are false', () => {
      const pw = generatePassword({
        ...defaultOptions,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      })
      expect(typeof pw).toBe('string')
      expect(pw.length).toBeGreaterThan(0)
    })
  })
})

describe('estimatePasswordStrength', () => {
  it('returns weak for empty string', () => {
    expect(estimatePasswordStrength('')).toBe('weak')
  })

  it('returns weak for very short passwords', () => {
    expect(estimatePasswordStrength('abc')).toBe('weak')
  })

  it('returns weak for short lowercase-only passwords', () => {
    // 6 chars × log2(26) ≈ 28 bits → weak
    expect(estimatePasswordStrength('abcdef')).toBe('weak')
  })

  it('returns medium for 8-char mixed passwords', () => {
    // 8 chars lowercase+numbers: 8 × log2(36) ≈ 41 bits → medium
    expect(estimatePasswordStrength('abc123de')).toBe('medium')
  })

  it('returns strong for 12+ char mixed passwords', () => {
    // 12 chars with upper+lower+numbers: 12 × log2(62) ≈ 71 bits → strong
    expect(estimatePasswordStrength('Abcdef123456')).toBe('strong')
  })

  it('returns very-strong for 16+ char fully mixed passwords', () => {
    // 16 chars with all types: 16 × log2(94) ≈ 104 bits → very-strong
    expect(estimatePasswordStrength('Abcdef1!Ghijkl2@')).toBe('very-strong')
  })

  it('returns very-strong for 20-char all-type password', () => {
    const pw = 'P@ssw0rd!ExAmple#Xyz'
    expect(estimatePasswordStrength(pw)).toBe('very-strong')
  })

  it('recognizes symbol-only passwords', () => {
    // 4 symbols: 4 × log2(32) ≈ 20 bits → weak
    const result = estimatePasswordStrength('!@#$')
    expect(result).toBe('weak')
  })

  it('recognizes passwords with uppercase only as weak if short', () => {
    expect(estimatePasswordStrength('ABC')).toBe('weak')
  })
})
