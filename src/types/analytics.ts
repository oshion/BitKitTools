export type AnalyticsEventName = 'tool_open' | 'calculate' | 'copy_result' | 'share' | 'input_enter'

type GoogleFcQueueItem = Record<string, () => void>

// Minimal shape of window.googlefc used by AnalyticsScripts.tsx. The queue itself
// may exist before Google's script does (that's the point — see ConsentManager.tsx),
// so the methods below are only guaranteed once CONSENT_MODE_DATA_READY fires.
type GoogleFc = {
  callbackQueue: GoogleFcQueueItem[]
  getGoogleConsentModeValues?: () => { analyticsStoragePurposeConsentStatus: string }
  ConsentModePurposeStatusEnum?: { GRANTED: string; DENIED: string }
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (command: string, ...args: unknown[]) => void
    googlefc?: GoogleFc
  }
}
