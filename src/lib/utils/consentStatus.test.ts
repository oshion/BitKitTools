import { isAnalyticsAllowed } from './consentStatus'

// Real enum as returned by window.googlefc.ConsentModePurposeStatusEnum (verified on
// bitkittools.com 2026-10-26).
const ENUM = {
  CONSENT_MODE_PURPOSE_STATUS_UNKNOWN: 0,
  CONSENT_MODE_PURPOSE_STATUS_GRANTED: 1,
  CONSENT_MODE_PURPOSE_STATUS_DENIED: 2,
  CONSENT_MODE_PURPOSE_STATUS_NOT_APPLICABLE: 3,
  CONSENT_MODE_PURPOSE_STATUS_NOT_CONFIGURED: 4,
}

describe('isAnalyticsAllowed', () => {
  it('allows when the visitor granted analytics consent', () => {
    expect(isAnalyticsAllowed(1, ENUM)).toBe(true)
  })

  it('allows when consent is not applicable to the visitor (e.g. non-regulated region)', () => {
    expect(isAnalyticsAllowed(3, ENUM)).toBe(true)
  })

  it('allows when no consent message is configured for the visitor (status seen from Korea)', () => {
    expect(isAnalyticsAllowed(4, ENUM)).toBe(true)
  })

  it('blocks when the visitor denied analytics consent', () => {
    expect(isAnalyticsAllowed(2, ENUM)).toBe(false)
  })

  it('blocks while consent is still unknown (message not answered yet)', () => {
    expect(isAnalyticsAllowed(0, ENUM)).toBe(false)
  })

  it('blocks when the status is missing', () => {
    expect(isAnalyticsAllowed(undefined, ENUM)).toBe(false)
  })

  it('falls back to the documented numeric values when the enum is unavailable', () => {
    expect(isAnalyticsAllowed(4, undefined)).toBe(true)
    expect(isAnalyticsAllowed(2, undefined)).toBe(false)
  })
})
