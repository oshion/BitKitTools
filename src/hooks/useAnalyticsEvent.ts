import type { AnalyticsEventName } from '@/types/analytics'

// Safe wrapper around window.gtag.
// No-ops silently when:
//   - Running server-side (window undefined)
//   - Analytics consent not yet given (gtag not loaded)
//   - CMP script not configured
// This makes it safe to call from any tool component without consent-state checks.
export function useAnalyticsEvent(): {
  sendEvent: (
    name: AnalyticsEventName,
    payload?: Record<string, string | number>
  ) => void
} {
  function sendEvent(
    name: AnalyticsEventName,
    payload?: Record<string, string | number>
  ): void {
    if (typeof window === 'undefined') return
    if (typeof window.gtag !== 'function') return
    window.gtag('event', name, payload ?? {})
  }

  return { sendEvent }
}
