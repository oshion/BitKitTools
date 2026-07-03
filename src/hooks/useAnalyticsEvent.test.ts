import { renderHook, act } from '@testing-library/react'
import { useAnalyticsEvent } from './useAnalyticsEvent'

describe('useAnalyticsEvent', () => {
  afterEach(() => {
    // Reset window.gtag after each test
    Object.defineProperty(window, 'gtag', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it('returns a sendEvent function', () => {
    const { result } = renderHook(() => useAnalyticsEvent())
    expect(typeof result.current.sendEvent).toBe('function')
  })

  it('does not throw when window.gtag is not available', () => {
    const { result } = renderHook(() => useAnalyticsEvent())
    expect(() => {
      act(() => {
        result.current.sendEvent('tool_open')
      })
    }).not.toThrow()
  })

  it('does not throw when called with a payload', () => {
    const { result } = renderHook(() => useAnalyticsEvent())
    expect(() => {
      act(() => {
        result.current.sendEvent('calculate', { tool: 'json-formatter', count: 1 })
      })
    }).not.toThrow()
  })

  it('calls window.gtag with event name and payload when gtag is available', () => {
    const mockGtag = jest.fn()
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useAnalyticsEvent())
    act(() => {
      result.current.sendEvent('calculate', { tool: 'password-generator' })
    })

    expect(mockGtag).toHaveBeenCalledWith('event', 'calculate', { tool: 'password-generator' })
  })

  it('calls window.gtag with empty payload when no payload is provided', () => {
    const mockGtag = jest.fn()
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useAnalyticsEvent())
    act(() => {
      result.current.sendEvent('tool_open')
    })

    expect(mockGtag).toHaveBeenCalledWith('event', 'tool_open', {})
  })

  it('does not include personal data in payload (smoke test)', () => {
    const mockGtag = jest.fn()
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useAnalyticsEvent())
    act(() => {
      result.current.sendEvent('share', { tool: 'bac-calculator' })
    })

    const [, , payload] = mockGtag.mock.calls[0] as [string, string, Record<string, unknown>]
    // Payload must only contain string or number values (no raw input values)
    for (const value of Object.values(payload)) {
      expect(typeof value === 'string' || typeof value === 'number').toBe(true)
    }
  })
})
