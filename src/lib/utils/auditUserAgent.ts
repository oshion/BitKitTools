// Lighthouse (lhci in the weekly-report workflow, PageSpeed Insights) appends this
// token to its user agent. These are our own monitoring visits, not users.
const LIGHTHOUSE_TOKEN = 'Chrome-Lighthouse'

// True for automated audit runs whose visits must not be recorded as GA4/Clarity
// sessions — the weekly Lighthouse run otherwise adds one fake session per audited page.
export function isAutomatedAuditUserAgent(userAgent: string | undefined): boolean {
  return typeof userAgent === 'string' && userAgent.includes(LIGHTHOUSE_TOKEN)
}
