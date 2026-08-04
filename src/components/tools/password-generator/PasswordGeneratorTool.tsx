'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { generatePassword, estimatePasswordStrength } from '@/lib/utils/passwordGenerator'
import type { PasswordOptions, PasswordStrength } from '@/lib/utils/passwordGenerator'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

const DEFAULT_OPTIONS: PasswordOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: false,
}

const STRENGTH_LABELS: Record<PasswordStrength, { en: string; color: string; widthClass: string }> = {
  weak: { en: 'Weak', color: '#ef4444', widthClass: 'w-1/4' },
  medium: { en: 'Medium', color: '#f59e0b', widthClass: 'w-2/4' },
  strong: { en: 'Strong', color: '#22c55e', widthClass: 'w-3/4' },
  'very-strong': { en: 'Very Strong', color: '#22c55e', widthClass: 'w-full' },
}

export default function PasswordGeneratorTool() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS)
  // Lazy initializer: generates the first password without a useEffect setState call
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTIONS))
  const [strength, setStrength] = useState<PasswordStrength>(() =>
    estimatePasswordStrength(generatePassword(DEFAULT_OPTIONS))
  )
  const [copied, setCopied] = useState(false)
  const passwordRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const inputEnteredRef = useRef(false)
  const { sendEvent } = useAnalyticsEvent()

  const regenerate = useCallback(
    (opts: PasswordOptions) => {
      const pw = generatePassword(opts)
      setPassword(pw)
      setStrength(estimatePasswordStrength(pw))
      sendEvent('calculate')
    },
    [sendEvent]
  )

  // Fire tool_open once on mount
  useEffect(() => {
    sendEvent('tool_open')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate password text on change
  useEffect(() => {
    if (!password) return
    const el = passwordRef.current
    if (!el) return
    el.style.opacity = '0'
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.4s ease'
      el.style.opacity = '1'
    })
    return () => cancelAnimationFrame(raf)
  }, [password])

  function updateOption<K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) {
    if (!inputEnteredRef.current) {
      inputEnteredRef.current = true
      sendEvent('input_enter')
    }
    const next = { ...options, [key]: value }
    setOptions(next)
    regenerate(next)
  }

  async function handleCopy() {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      sendEvent('copy_result')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable; silent fail
    }
  }

  const strengthInfo = STRENGTH_LABELS[strength]

  return (
    <div className="space-y-6">
      {/* Password display */}
      <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-neutral-400">Generated Password</label>
          <button
            onClick={handleCopy}
            disabled={!password}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div ref={passwordRef}>
          <p className="font-mono text-xl text-white break-all leading-relaxed tracking-wide select-all">
            {password || '—'}
          </p>
        </div>

        {/* Strength gauge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Strength</span>
            <span className="text-xs font-medium" style={{ color: strengthInfo.color }}>
              {strengthInfo.en}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              ref={barRef}
              className={`h-full rounded-full transition-all duration-500 ease-out ${strengthInfo.widthClass}`}
              style={{ backgroundColor: strengthInfo.color }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-5">
        {/* Length slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">Length</label>
            <span className="text-sm font-medium text-[#f59e0b] tabular-nums">{options.length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) => updateOption('length', Number(e.target.value))}
            className="w-full accent-[#f59e0b] cursor-pointer"
          />
          <div className="flex justify-between text-xs text-neutral-600">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        {/* Character type checkboxes */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-300">Character Types</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: 'includeUppercase', label: 'Uppercase (A–Z)' },
                { key: 'includeLowercase', label: 'Lowercase (a–z)' },
                { key: 'includeNumbers', label: 'Numbers (0–9)' },
                { key: 'includeSymbols', label: 'Symbols (!@#…)' },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(e) => updateOption(key, e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 accent-[#f59e0b] cursor-pointer"
                />
                <span className="text-sm text-neutral-300 group-hover:text-neutral-200 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Exclude ambiguous */}
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={options.excludeAmbiguous}
            onChange={(e) => updateOption('excludeAmbiguous', e.target.checked)}
            className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 accent-[#f59e0b] cursor-pointer"
          />
          <span className="text-sm text-neutral-300 group-hover:text-neutral-200 transition-colors">
            Exclude ambiguous characters{' '}
            <span className="text-neutral-500">(0, O, o, 1, l, I, |)</span>
          </span>
        </label>

        {/* Regenerate button */}
        <button
          onClick={() => regenerate(options)}
          className="w-full px-4 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          Regenerate Password
        </button>
      </div>
    </div>
  )
}
