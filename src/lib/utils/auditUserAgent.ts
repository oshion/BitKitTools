// Marks our own monitoring visits, which are not users. Lighthouse 12 no longer adds this
// token by itself, so the weekly audit sets it explicitly (scripts/lib/lighthouseAudit.ts).
export const LIGHTHOUSE_AUDIT_TOKEN = 'Chrome-Lighthouse'

// True for automated audit runs whose visits must not be recorded as GA4/Clarity
// sessions — the weekly Lighthouse run otherwise adds one fake session per audited page.
export function isAutomatedAuditUserAgent(userAgent: string | undefined): boolean {
  return typeof userAgent === 'string' && userAgent.includes(LIGHTHOUSE_AUDIT_TOKEN)
}
