'use client'

import { useState, useCallback } from 'react'

/**
 * Syncs a React state value to localStorage.
 *
 * Reads the stored value synchronously via a lazy useState initializer.
 * SSR-safe: when `window` is not defined (server render), returns `initialValue`.
 *
 * Silently ignores storage errors (private mode, quota exceeded, etc.).
 * The returned setter accepts either a new value or an updater function,
 * matching the useState API.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      // Storage may be blocked in private mode or by security settings
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // Silently fail if storage is unavailable
        }
        return next
      })
    },
    [key]
  )

  return [storedValue, setValue]
}
