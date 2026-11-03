import { isAutomatedAuditUserAgent } from './auditUserAgent'

describe('isAutomatedAuditUserAgent', () => {
  it('detects Lighthouse (lhci in GitHub Actions, PageSpeed Insights)', () => {
    expect(
      isAutomatedAuditUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Chrome-Lighthouse'
      )
    ).toBe(true)
  })

  it('does not flag regular browsers', () => {
    expect(
      isAutomatedAuditUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      )
    ).toBe(false)
    expect(
      isAutomatedAuditUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
      )
    ).toBe(false)
  })

  it('treats a missing user agent as a regular visitor', () => {
    expect(isAutomatedAuditUserAgent(undefined)).toBe(false)
  })
})
