export type PasswordOptions = {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeAmbiguous: boolean
}

export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong'

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

// Characters that look similar and can cause confusion
const AMBIGUOUS = new Set(['0', 'O', 'o', '1', 'l', 'I', '|'])

function filterAmbiguous(chars: string): string {
  return chars.split('').filter((c) => !AMBIGUOUS.has(c)).join('')
}

function buildCharset(options: PasswordOptions): string {
  let chars = ''
  if (options.includeUppercase) chars += UPPERCASE
  if (options.includeLowercase) chars += LOWERCASE
  if (options.includeNumbers) chars += NUMBERS
  if (options.includeSymbols) chars += SYMBOLS
  if (options.excludeAmbiguous) chars = filterAmbiguous(chars)
  return chars
}

/** Picks a random character from a non-empty string using a pre-seeded Uint32 value. */
function pickChar(pool: string, randomUint32: number): string {
  // pool is guaranteed non-empty at all call sites
  return pool.charAt(randomUint32 % pool.length)
}

/** Fills an array of `count` random characters from `charset`. */
function randomChars(charset: string, count: number): string[] {
  if (count <= 0) return []
  const arr = new Uint32Array(count)
  crypto.getRandomValues(arr)
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const v = arr[i]
    if (v !== undefined) result.push(pickChar(charset, v))
  }
  return result
}

/** Fisher-Yates shuffle using crypto.getRandomValues. */
function shuffle(chars: string[]): string[] {
  const arr = new Uint32Array(chars.length)
  crypto.getRandomValues(arr)
  for (let i = chars.length - 1; i > 0; i--) {
    const rndVal = arr[i]
    if (rndVal === undefined) continue
    const j = rndVal % (i + 1)
    const tmp = chars[i]
    const swp = chars[j]
    if (tmp !== undefined && swp !== undefined) {
      chars[i] = swp
      chars[j] = tmp
    }
  }
  return chars
}

/**
 * Generates a cryptographically secure random password using crypto.getRandomValues.
 * Guarantees at least one character from each enabled character class.
 *
 * Math.random() is intentionally NOT used — it is not cryptographically secure.
 */
export function generatePassword(options: PasswordOptions): string {
  const length = Math.max(8, Math.min(64, options.length))
  const charset = buildCharset(options)

  // Fallback: if all options are false, use lowercase
  if (charset.length === 0) {
    return randomChars(LOWERCASE, length).join('')
  }

  // Build per-type pools to guarantee at least one char from each enabled type
  const pools: string[] = []
  if (options.includeUppercase) {
    const pool = options.excludeAmbiguous ? filterAmbiguous(UPPERCASE) : UPPERCASE
    if (pool.length > 0) pools.push(pool)
  }
  if (options.includeLowercase) {
    const pool = options.excludeAmbiguous ? filterAmbiguous(LOWERCASE) : LOWERCASE
    if (pool.length > 0) pools.push(pool)
  }
  if (options.includeNumbers) {
    const pool = options.excludeAmbiguous ? filterAmbiguous(NUMBERS) : NUMBERS
    if (pool.length > 0) pools.push(pool)
  }
  if (options.includeSymbols) {
    const pool = options.excludeAmbiguous ? filterAmbiguous(SYMBOLS) : SYMBOLS
    if (pool.length > 0) pools.push(pool)
  }

  // Pick one guaranteed character from each pool (up to `length` characters)
  const guaranteedCount = Math.min(pools.length, length)
  const guaranteed: string[] = []
  {
    const seedArr = new Uint32Array(guaranteedCount)
    crypto.getRandomValues(seedArr)
    for (let i = 0; i < guaranteedCount; i++) {
      const pool = pools[i]
      const rndVal = seedArr[i]
      if (pool && pool.length > 0 && rndVal !== undefined) {
        guaranteed.push(pickChar(pool, rndVal))
      }
    }
  }

  // Fill remaining positions from the full charset
  const filled = randomChars(charset, length - guaranteed.length)

  // Combine and shuffle
  return shuffle([...guaranteed, ...filled]).join('')
}

/**
 * Estimates password strength based on Shannon entropy.
 * Pool size is derived from which character classes appear in the password.
 *
 * Thresholds:
 *   < 40 bits  → weak
 *   40–59 bits → medium
 *   60–95 bits → strong
 *  ≥ 96 bits   → very-strong
 */
export function estimatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'weak'

  let poolSize = 0
  if (/[a-z]/.test(password)) poolSize += 26
  if (/[A-Z]/.test(password)) poolSize += 26
  if (/[0-9]/.test(password)) poolSize += 10
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32

  if (poolSize === 0) poolSize = 26

  const entropy = password.length * Math.log2(poolSize)

  if (entropy < 40) return 'weak'
  if (entropy < 60) return 'medium'
  if (entropy < 96) return 'strong'
  return 'very-strong'
}
