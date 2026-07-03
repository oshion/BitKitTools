export type AnalyticsEventName = 'tool_open' | 'calculate' | 'copy_result' | 'share'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (command: string, ...args: unknown[]) => void
  }
}
