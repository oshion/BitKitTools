export type AnalyticsEventName = 'tool_open' | 'calculate' | 'copy_result' | 'share' | 'input_enter'

type GoogleFcQueueItem = Record<string, () => void>

// Minimal shape of window.googlefc used by AnalyticsScripts.tsx. The queue itself
// may exist before Google's script does (that's the point — see ConsentManager.tsx),
// so the methods below are only guaranteed once CONSENT_MODE_DATA_READY fires.
// Numeric enum exposed as googlefc.ConsentModePurposeStatusEnum (keys verified in the
// browser on the live site — they are NOT plain GRANTED/DENIED).
export type ConsentModePurposeStatusEnum = {
  CONSENT_MODE_PURPOSE_STATUS_UNKNOWN: number
  CONSENT_MODE_PURPOSE_STATUS_GRANTED: number
  CONSENT_MODE_PURPOSE_STATUS_DENIED: number
  CONSENT_MODE_PURPOSE_STATUS_NOT_APPLICABLE: number
  CONSENT_MODE_PURPOSE_STATUS_NOT_CONFIGURED: number
}

type GoogleFc = {
  callbackQueue: GoogleFcQueueItem[]
  getGoogleConsentModeValues?: () => { analyticsStoragePurposeConsentStatus: number }
  ConsentModePurposeStatusEnum?: ConsentModePurposeStatusEnum
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (command: string, ...args: unknown[]) => void
    googlefc?: GoogleFc
  }
}
