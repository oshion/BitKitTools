import { decodeJwt, explainStandardClaims } from './jwtDecoder'

// Helper: encode a JS value to base64url (Node-compatible)
function toBase64Url(obj: unknown): string {
  const json = JSON.stringify(obj)
  return Buffer.from(json).toString('base64url')
}

function buildToken(header: unknown, payload: unknown, sig = 'fakesig'): string {
  return `${toBase64Url(header)}.${toBase64Url(payload)}.${sig}`
}

const validHeader = { alg: 'HS256', typ: 'JWT' }
const validPayload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 }

// ── decodeJwt ──────────────────────────────────────────────────────────────

describe('decodeJwt', () => {
  it('decodes a valid JWT token', () => {
    const token = buildToken(validHeader, validPayload)
    const result = decodeJwt(token)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.decoded.header).toEqual(validHeader)
    expect(result.decoded.payload).toEqual(validPayload)
    expect(result.decoded.signature).toBe('fakesig')
  })

  it('fails when token has fewer than 3 segments', () => {
    const result = decodeJwt('onlyone.parts')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toMatch(/3/)
  })

  it('fails when token has more than 3 segments', () => {
    const result = decodeJwt('a.b.c.d')
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toMatch(/3/)
  })

  it('fails when token is an empty string', () => {
    const result = decodeJwt('')
    expect(result.success).toBe(false)
  })

  it('fails when header segment is not valid base64url', () => {
    const token = `!!!.${toBase64Url(validPayload)}.sig`
    const result = decodeJwt(token)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toMatch(/header/i)
  })

  it('fails when payload segment is not valid base64url JSON', () => {
    const badPayload = Buffer.from('not valid json').toString('base64url')
    const token = `${toBase64Url(validHeader)}.${badPayload}.sig`
    const result = decodeJwt(token)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toMatch(/payload/i)
  })

  it('fails when header decodes to a non-object JSON type', () => {
    const token = `${Buffer.from('"just a string"').toString('base64url')}.${toBase64Url(validPayload)}.sig`
    const result = decodeJwt(token)
    expect(result.success).toBe(false)
  })

  it('fails when payload decodes to a non-object JSON type', () => {
    const token = `${toBase64Url(validHeader)}.${Buffer.from('[1,2,3]').toString('base64url')}.sig`
    const result = decodeJwt(token)
    expect(result.success).toBe(false)
  })

  it('preserves the raw signature segment without modification', () => {
    const sig = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const token = `${toBase64Url(validHeader)}.${toBase64Url(validPayload)}.${sig}`
    const result = decodeJwt(token)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.decoded.signature).toBe(sig)
  })

  it('decodes a token with extra claims in payload', () => {
    const payload = {
      sub: 'user-42',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: 'https://example.com',
      aud: 'my-app',
      jti: 'unique-token-id',
      role: 'admin',
    }
    const token = buildToken(validHeader, payload)
    const result = decodeJwt(token)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.decoded.payload).toEqual(payload)
  })
})

// ── explainStandardClaims ──────────────────────────────────────────────────

describe('explainStandardClaims', () => {
  const nowSec = Math.floor(Date.now() / 1000)

  it('returns an empty array for a payload with no standard claims', () => {
    const explanations = explainStandardClaims({ name: 'John', role: 'admin' }, 'en')
    expect(explanations).toEqual([])
  })

  it('explains iat (issued at) with a human-readable date', () => {
    const payload = { iat: nowSec }
    const explanations = explainStandardClaims(payload, 'en')
    const iatEntry = explanations.find((e) => e.key === 'iat')
    expect(iatEntry).toBeDefined()
    expect(iatEntry?.explanation).toMatch(/issued/i)
  })

  it('explains exp that is in the future as valid', () => {
    const payload = { exp: nowSec + 3600 }
    const explanations = explainStandardClaims(payload, 'en')
    const expEntry = explanations.find((e) => e.key === 'exp')
    expect(expEntry).toBeDefined()
    expect(expEntry?.explanation).not.toMatch(/expired/i)
    expect(expEntry?.explanation).toMatch(/expire|valid/i)
  })

  it('explains exp that is in the past as expired', () => {
    const payload = { exp: nowSec - 3600 }
    const explanations = explainStandardClaims(payload, 'en')
    const expEntry = explanations.find((e) => e.key === 'exp')
    expect(expEntry).toBeDefined()
    expect(expEntry?.explanation).toMatch(/expired/i)
  })

  it('explains nbf (not before) with a human-readable date', () => {
    const payload = { nbf: nowSec - 60 }
    const explanations = explainStandardClaims(payload, 'en')
    const nbfEntry = explanations.find((e) => e.key === 'nbf')
    expect(nbfEntry).toBeDefined()
    expect(nbfEntry?.explanation).toMatch(/not before|active/i)
  })

  it('explains iss, aud, sub, jti claims', () => {
    const payload = {
      iss: 'https://auth.example.com',
      aud: 'my-app',
      sub: 'user-42',
      jti: 'unique-id-123',
    }
    const explanations = explainStandardClaims(payload, 'en')
    expect(explanations.find((e) => e.key === 'iss')).toBeDefined()
    expect(explanations.find((e) => e.key === 'aud')).toBeDefined()
    expect(explanations.find((e) => e.key === 'sub')).toBeDefined()
    expect(explanations.find((e) => e.key === 'jti')).toBeDefined()
  })

  it('does not include "signature verified" or equivalent in any explanation (EN)', () => {
    const payload = { exp: nowSec + 3600, iss: 'example.com' }
    const explanations = explainStandardClaims(payload, 'en')
    for (const e of explanations) {
      expect(e.explanation).not.toMatch(/signature verif/i)
      expect(e.explanation).not.toMatch(/valid signature/i)
    }
  })

  it('returns Korean explanations when locale is ko', () => {
    const payload = { sub: 'user-1' }
    const explanations = explainStandardClaims(payload, 'ko')
    const subEntry = explanations.find((e) => e.key === 'sub')
    expect(subEntry).toBeDefined()
    // Korean explanation should contain Korean characters
    expect(subEntry?.explanation).toMatch(/[\uAC00-\uD7A3]/)
  })

  it('preserves the original value in the returned ClaimExplanation', () => {
    const payload = { sub: 'user-99' }
    const explanations = explainStandardClaims(payload, 'en')
    const subEntry = explanations.find((e) => e.key === 'sub')
    expect(subEntry?.value).toBe('user-99')
  })
})
