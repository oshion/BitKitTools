import { buildLhciCollectArgs, LIGHTHOUSE_AUDIT_USER_AGENT } from '../lighthouseAudit'
import { isAutomatedAuditUserAgent } from '../../../src/lib/utils/auditUserAgent'

describe('LIGHTHOUSE_AUDIT_USER_AGENT', () => {
  it('is recognized by the site as an automated audit (lighthouse 12 no longer adds the token itself)', () => {
    expect(isAutomatedAuditUserAgent(LIGHTHOUSE_AUDIT_USER_AGENT)).toBe(true)
  })

  it('still looks like the default mobile device Lighthouse emulates', () => {
    expect(LIGHTHOUSE_AUDIT_USER_AGENT).toMatch(/Android/)
    expect(LIGHTHOUSE_AUDIT_USER_AGENT).toMatch(/Mobile Safari/)
  })
})

describe('buildLhciCollectArgs', () => {
  const args = buildLhciCollectArgs(['https://bitkittools.com/', 'https://bitkittools.com/a/'])

  it('passes every URL and skips the repo lighthouserc', () => {
    expect(args).toContain('--url=https://bitkittools.com/')
    expect(args).toContain('--url=https://bitkittools.com/a/')
    expect(args).toContain('--no-lighthouserc')
  })

  it('quotes the audit user agent because the command runs through a shell', () => {
    expect(args).toContain(`--settings.emulatedUserAgent="${LIGHTHOUSE_AUDIT_USER_AGENT}"`)
  })
})
