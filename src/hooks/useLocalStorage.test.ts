import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

// jsdom provides window.localStorage; clear between tests to avoid bleed.
beforeEach(() => {
  window.localStorage.clear()
})

describe('useLocalStorage', () => {
  test('returns the initialValue when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  test('persists the value to localStorage when setter is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', ''))

    act(() => {
      result.current[1]('saved')
    })

    expect(result.current[0]).toBe('saved')
    expect(window.localStorage.getItem('test-key')).toBe('"saved"')
  })

  test('reads an existing localStorage value synchronously on mount', () => {
    window.localStorage.setItem('test-key', JSON.stringify('pre-existing'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('pre-existing')
  })

  test('works with object values', () => {
    const { result } = renderHook(() =>
      useLocalStorage<{ from: string; to: string }>('country-key', { from: '', to: '' })
    )

    act(() => {
      result.current[1]({ from: 'KR', to: 'JP' })
    })

    expect(result.current[0]).toEqual({ from: 'KR', to: 'JP' })
    expect(JSON.parse(window.localStorage.getItem('country-key') ?? '{}')).toEqual({
      from: 'KR',
      to: 'JP',
    })
  })

  test('accepts an updater function as the setter argument', () => {
    const { result } = renderHook(() => useLocalStorage('count-key', 0))

    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(1)
  })

  test('reads pre-populated object from localStorage', () => {
    window.localStorage.setItem(
      'country-key',
      JSON.stringify({ from: 'KR', to: 'JP' })
    )

    const { result } = renderHook(() =>
      useLocalStorage<{ from: string; to: string }>('country-key', { from: '', to: '' })
    )

    expect(result.current[0]).toEqual({ from: 'KR', to: 'JP' })
  })

  test('returns initialValue when localStorage getItem throws', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('blocked')
        },
      },
      configurable: true,
    })

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))
    expect(result.current[0]).toBe('fallback')

    if (original) {
      Object.defineProperty(window, 'localStorage', original)
    }
  })
})
