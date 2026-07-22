export type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

export type DecodeResult =
  | { success: true; decoded: DecodedJwt }
  | { success: false; error: string }

export type ClaimExplanation = {
  key: string
  value: unknown
  explanation: string
}

/**
 * Decodes a JWT token (header + payload only, NO signature verification).
 * Returns a discriminated union — always check `success` before using `decoded`.
 */
export function decodeJwt(token: string): DecodeResult {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return {
      success: false,
      error: `A JWT must have exactly 3 segments separated by dots (got ${parts.length}).`,
    }
  }

  const headerB64 = parts[0] ?? ''
  const payloadB64 = parts[1] ?? ''
  const signature = parts[2] ?? ''

  // Decode header
  let header: Record<string, unknown>
  try {
    const decoded = base64UrlDecode(headerB64)
    const parsed: unknown = JSON.parse(decoded)
    if (!isPlainObject(parsed)) {
      throw new Error('Header is not a JSON object')
    }
    header = parsed
  } catch {
    return {
      success: false,
      error: 'Failed to decode the header segment. It must be a valid base64url-encoded JSON object.',
    }
  }

  // Decode payload
  let payload: Record<string, unknown>
  try {
    const decoded = base64UrlDecode(payloadB64)
    const parsed: unknown = JSON.parse(decoded)
    if (!isPlainObject(parsed)) {
      throw new Error('Payload is not a JSON object')
    }
    payload = parsed
  } catch {
    return {
      success: false,
      error: 'Failed to decode the payload segment. It must be a valid base64url-encoded JSON object.',
    }
  }

  return {
    success: true,
    decoded: { header, payload, signature },
  }
}

/**
 * Returns human-readable explanations for standard JWT claims present in the payload.
 * Does NOT perform signature verification — exp comparison is purely time-based.
 */
export function explainStandardClaims(
  payload: Record<string, unknown>,
  locale: 'en' | 'ko',
): ClaimExplanation[] {
  const results: ClaimExplanation[] = []
  const nowSec = Math.floor(Date.now() / 1000)

  const fmt = (unix: unknown): string => {
    if (typeof unix !== 'number') return String(unix)
    return new Date(unix * 1000).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  if ('exp' in payload) {
    const exp = payload['exp']
    const isExpired = typeof exp === 'number' && exp < nowSec
    let explanation: string
    if (locale === 'ko') {
      explanation = isExpired
        ? `만료 시각: ${fmt(exp)} — 만료 시각이 지났습니다 (시간 비교 기반; 암호학적 검증 아님)`
        : `만료 시각: ${fmt(exp)} — 아직 유효한 시각입니다 (시간 비교 기반; 암호학적 검증 아님)`
    } else {
      explanation = isExpired
        ? `Expiry time: ${fmt(exp)} — expired, this timestamp has passed (time-based check only; not a cryptographic check)`
        : `Expiry time: ${fmt(exp)} — still within the valid window (time-based check only; not a cryptographic check)`
    }
    results.push({ key: 'exp', value: exp, explanation })
  }

  if ('iat' in payload) {
    const iat = payload['iat']
    const explanation =
      locale === 'ko'
        ? `발급 시각: ${fmt(iat)} — 토큰이 발급된 시각입니다`
        : `Issued at: ${fmt(iat)} — when this token was issued`
    results.push({ key: 'iat', value: iat, explanation })
  }

  if ('nbf' in payload) {
    const nbf = payload['nbf']
    const isActive = typeof nbf === 'number' && nbf <= nowSec
    const explanation =
      locale === 'ko'
        ? `활성화 시각(not before): ${fmt(nbf)} — ${isActive ? '이미 활성화된 시각입니다' : '아직 활성화 전 시각입니다'}`
        : `Not before: ${fmt(nbf)} — token is ${isActive ? 'already active' : 'not yet active'} as of this timestamp`
    results.push({ key: 'nbf', value: nbf, explanation })
  }

  if ('iss' in payload) {
    const iss = payload['iss']
    const explanation =
      locale === 'ko'
        ? `발급자(issuer): 이 토큰을 발급한 서버/서비스입니다`
        : `Issuer: the server or service that issued this token`
    results.push({ key: 'iss', value: iss, explanation })
  }

  if ('aud' in payload) {
    const aud = payload['aud']
    const explanation =
      locale === 'ko'
        ? `대상(audience): 이 토큰이 사용될 서비스나 수신자입니다`
        : `Audience: the service or recipient this token is intended for`
    results.push({ key: 'aud', value: aud, explanation })
  }

  if ('sub' in payload) {
    const sub = payload['sub']
    const explanation =
      locale === 'ko'
        ? `주체(subject): 이 토큰이 나타내는 사용자 또는 엔티티 식별자입니다`
        : `Subject: the user or entity identifier this token represents`
    results.push({ key: 'sub', value: sub, explanation })
  }

  if ('jti' in payload) {
    const jti = payload['jti']
    const explanation =
      locale === 'ko'
        ? `토큰 ID(JWT ID): 이 토큰의 고유 식별자입니다 (재사용 방지 등에 활용)`
        : `JWT ID: a unique identifier for this specific token (used to prevent token reuse)`
    results.push({ key: 'jti', value: jti, explanation })
  }

  return results
}

// ── Internal helpers ────────────────────────────────────────────────────────

function base64UrlDecode(input: string): string {
  // Convert base64url → standard base64, then decode
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  // Works in both browser (atob) and Node (Buffer)
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
  }
  return Buffer.from(padded, 'base64').toString('utf-8')
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
