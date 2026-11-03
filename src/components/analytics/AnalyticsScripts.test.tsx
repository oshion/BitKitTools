import { render, act } from '@testing-library/react'
import AnalyticsScripts from './AnalyticsScripts'

// next/script injects into document.head at runtime; render a marker element instead so
// the test can assert which scripts would load and with which strategy.
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ id, src, strategy }: { id?: string; src?: string; strategy?: string }) => (
    <span data-testid="script" data-id={id ?? ''} data-src={src ?? ''} data-strategy={strategy ?? ''} />
  ),
}))

const ENUM = {
  CONSENT_MODE_PURPOSE_STATUS_UNKNOWN: 0,
  CONSENT_MODE_PURPOSE_STATUS_GRANTED: 1,
  CONSENT_MODE_PURPOSE_STATUS_DENIED: 2,
  CONSENT_MODE_PURPOSE_STATUS_NOT_APPLICABLE: 3,
  CONSENT_MODE_PURPOSE_STATUS_NOT_CONFIGURED: 4,
}

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

// Simulates Google's CMP: fires CONSENT_MODE_DATA_READY for every queued callback.
function fireConsentReady(status: number) {
  const fc = window.googlefc
  if (!fc) return
  fc.getGoogleConsentModeValues = () => ({ analyticsStoragePurposeConsentStatus: status })
  fc.ConsentModePurposeStatusEnum = ENUM
  act(() => {
    for (const item of fc.callbackQueue) item.CONSENT_MODE_DATA_READY?.()
  })
}

const ORIGINAL_UA = window.navigator.userAgent

beforeEach(() => {
  process.env.NEXT_PUBLIC_GA_ID = 'G-TEST'
  process.env.NEXT_PUBLIC_CLARITY_ID = 'clarity-test'
  window.googlefc = undefined
  window.gtag = jest.fn()
})

afterEach(() => {
  setUserAgent(ORIGINAL_UA)
  delete process.env.NEXT_PUBLIC_GA_ID
  delete process.env.NEXT_PUBLIC_CLARITY_ID
})

describe('AnalyticsScripts', () => {
  it('loads GA4 and Clarity with lazyOnload once analytics is allowed', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36')
    const { queryAllByTestId } = render(<AnalyticsScripts />)
    expect(queryAllByTestId('script')).toHaveLength(0)

    fireConsentReady(ENUM.CONSENT_MODE_PURPOSE_STATUS_NOT_CONFIGURED)

    const scripts = queryAllByTestId('script')
    expect(scripts.map((s) => s.getAttribute('data-id') || s.getAttribute('data-src'))).toEqual([
      'https://www.googletagmanager.com/gtag/js?id=G-TEST',
      'ga4-init',
      'clarity-init',
    ])
    for (const s of scripts) expect(s.getAttribute('data-strategy')).toBe('lazyOnload')
  })

  it('never loads analytics for Lighthouse audit visits', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0.0.0 Safari/537.36 Chrome-Lighthouse')
    const { queryAllByTestId } = render(<AnalyticsScripts />)

    fireConsentReady(ENUM.CONSENT_MODE_PURPOSE_STATUS_GRANTED)

    expect(queryAllByTestId('script')).toHaveLength(0)
    expect(window.gtag).not.toHaveBeenCalled()
  })

  it('does not load analytics when the visitor denied consent', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36')
    const { queryAllByTestId } = render(<AnalyticsScripts />)

    fireConsentReady(ENUM.CONSENT_MODE_PURPOSE_STATUS_DENIED)

    expect(queryAllByTestId('script')).toHaveLength(0)
  })
})
