import type { ConsentModePurposeStatusEnum } from '@/types/analytics'

// Documented values of googlefc.ConsentModePurposeStatusEnum, used when the enum
// object itself is unavailable. https://developers.google.com/funding-choices/fc-api-docs
const FALLBACK_STATUS = {
  GRANTED: 1,
  NOT_APPLICABLE: 3,
  NOT_CONFIGURED: 4,
} as const

// Analytics may load when the visitor granted consent, or when Google's CMP has no
// consent requirement for them (NOT_APPLICABLE / NOT_CONFIGURED — e.g. visitors outside
// the regions the consent message targets). DENIED and UNKNOWN (not answered yet) block.
export function isAnalyticsAllowed(
  status: number | undefined,
  statusEnum: ConsentModePurposeStatusEnum | undefined
): boolean {
  if (status === undefined) return false

  const allowed = [
    statusEnum?.CONSENT_MODE_PURPOSE_STATUS_GRANTED ?? FALLBACK_STATUS.GRANTED,
    statusEnum?.CONSENT_MODE_PURPOSE_STATUS_NOT_APPLICABLE ?? FALLBACK_STATUS.NOT_APPLICABLE,
    statusEnum?.CONSENT_MODE_PURPOSE_STATUS_NOT_CONFIGURED ?? FALLBACK_STATUS.NOT_CONFIGURED,
  ]
  return allowed.includes(status)
}
