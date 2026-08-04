'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { AIRPORT_MCT_DATA } from '@/lib/config/airportMctData'
import type { ConnectionType } from '@/lib/config/airportMctData'
import {
  evaluateLayoverTime,
  type LayoverEvaluationResult,
} from '@/lib/utils/layoverCalculator'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const CONNECTION_TYPES: Array<{ id: ConnectionType; label: string; desc: string }> = [
  {
    id: 'domestic-domestic',
    label: 'Domestic → Domestic',
    desc: 'Both flights are domestic (within the same country)',
  },
  {
    id: 'domestic-international',
    label: 'Domestic → International',
    desc: 'Arriving on a domestic flight, departing internationally',
  },
  {
    id: 'international-domestic',
    label: 'International → Domestic',
    desc: 'Arriving from international, connecting to a domestic flight',
  },
  {
    id: 'international-international',
    label: 'International → International',
    desc: 'Both flights are international',
  },
]

const VERDICT_CONFIG = {
  comfortable: {
    label: 'Comfortable',
    sublabel: 'You have a comfortable buffer above the minimum.',
    textClass: 'text-white',
    borderClass: 'border-neutral-700',
    badgeClass: 'bg-neutral-800 text-neutral-300',
  },
  tight: {
    label: 'Tight',
    sublabel: 'Meets the minimum, but leaves little margin for delays.',
    textClass: 'text-[#f59e0b]',
    borderClass: 'border-amber-900/50',
    badgeClass: 'bg-amber-950/30 text-amber-300',
  },
  'below-mct': {
    label: 'Below Minimum',
    sublabel: 'Shorter than the recommended minimum connecting time. Consider more time if possible.',
    textClass: 'text-neutral-400',
    borderClass: 'border-neutral-800',
    badgeClass: 'bg-neutral-900 text-neutral-500',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type FormState = {
  airportCode: string
  connectionType: ConnectionType
  hours: number
  minutes: number
}

const DEFAULT_FORM: FormState = {
  airportCode: '',
  connectionType: 'international-international',
  hours: 1,
  minutes: 30,
}

export default function LayoverConnectionCalculatorTool() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [result, setResult] = useState<LayoverEvaluationResult | null>(null)
  const { sendEvent } = useAnalyticsEvent()
  const inputEnteredRef = useRef<boolean>(false)

  useEffect(() => {
    sendEvent('tool_open')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function fireInputEnterOnce() {
    if (!inputEnteredRef.current) {
      inputEnteredRef.current = true
      sendEvent('input_enter')
    }
  }

  // Filter airports by search query
  const filteredAirports = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return AIRPORT_MCT_DATA
    return AIRPORT_MCT_DATA.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.en.toLowerCase().includes(q)
    )
  }, [query])

  const selectedAirport = AIRPORT_MCT_DATA.find((a) => a.code === form.airportCode)

  function handleAirportSelect(code: string) {
    fireInputEnterOnce()
    setForm((prev) => ({ ...prev, airportCode: code }))
    const airport = AIRPORT_MCT_DATA.find((a) => a.code === code)
    setQuery(airport ? `${airport.code} — ${airport.name.en}` : code)
    setShowDropdown(false)
    setResult(null)
  }

  function handleManualInput(value: string) {
    fireInputEnterOnce()
    // Allow free text entry for airports not in the database
    setQuery(value)
    // Extract potential IATA code (uppercase letters, 3 chars)
    const match = value.trim().toUpperCase().match(/^([A-Z]{3})/)
    if (match?.[1]) {
      setForm((prev) => ({ ...prev, airportCode: match[1] as string }))
    }
    setShowDropdown(true)
    setResult(null)
  }

  function handleCalculate() {
    const totalMinutes = form.hours * 60 + form.minutes
    const evaluation = evaluateLayoverTime({
      airportCode: form.airportCode,
      connectionType: form.connectionType,
      availableMinutes: totalMinutes,
    })
    setResult(evaluation)
    sendEvent('calculate')
  }

  const totalAvailableMinutes = form.hours * 60 + form.minutes
  const isInputValid = form.airportCode.trim().length >= 3 && totalAvailableMinutes > 0

  return (
    <div className="space-y-6">
      {/* Step 1: Airport */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 1 — Connecting Airport
        </h2>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleManualInput(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search airport (e.g. ICN, Incheon, Frankfurt…)"
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            aria-label="Connecting airport"
            aria-autocomplete="list"
          />
          {showDropdown && (
            <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-neutral-800 bg-[#141414] shadow-lg max-h-56 overflow-y-auto">
              {filteredAirports.length === 0 ? (
                <p className="px-4 py-3 text-sm text-neutral-500">
                  Airport not in database — enter the IATA code above and the general recommended
                  MCT will be used.
                </p>
              ) : (
                filteredAirports.map((a) => (
                  <button
                    key={a.code}
                    onMouseDown={() => handleAirportSelect(a.code)}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    <span className="font-mono font-medium text-white">{a.code}</span>
                    <span className="ml-2 text-neutral-500">{a.name.en}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {form.airportCode && !selectedAirport && form.airportCode.length >= 3 && (
          <p className="text-xs text-neutral-500 leading-relaxed">
            <span className="text-amber-400 font-medium">{form.airportCode}</span> is not in our
            database — general industry-recommended MCT values will be used instead.
          </p>
        )}
      </section>

      {/* Step 2: Connection type */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 2 — Connection Type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CONNECTION_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => {
                fireInputEnterOnce()
                setForm((prev) => ({ ...prev, connectionType: ct.id }))
                setResult(null)
              }}
              className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                form.connectionType === ct.id
                  ? 'border-[#f59e0b] bg-amber-950/20 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="block font-medium">{ct.label}</span>
              <span className="text-xs text-neutral-500">{ct.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Step 3: Available time */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 3 — Available Layover Time
        </h2>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Hours</label>
            <input
              type="number"
              min={0}
              max={24}
              value={form.hours}
              onChange={(e) => {
                fireInputEnterOnce()
                setForm((prev) => ({ ...prev, hours: Math.max(0, Math.min(24, Number(e.target.value))) }))
                setResult(null)
              }}
              className="w-20 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-neutral-600"
              aria-label="Hours"
            />
          </div>
          <span className="text-neutral-600 pb-2.5 text-lg">:</span>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500">Minutes</label>
            <input
              type="number"
              min={0}
              max={59}
              value={form.minutes}
              onChange={(e) => {
                fireInputEnterOnce()
                setForm((prev) => ({ ...prev, minutes: Math.max(0, Math.min(59, Number(e.target.value))) }))
                setResult(null)
              }}
              className="w-20 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-neutral-600"
              aria-label="Minutes"
            />
          </div>
          <span className="text-neutral-500 text-xs pb-2.5 ml-1">
            = {totalAvailableMinutes} min total
          </span>
        </div>
      </section>

      {/* Calculate button */}
      <button
        onClick={handleCalculate}
        disabled={!isInputValid}
        className="w-full px-4 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Check Connection Time
      </button>

      {/* Result */}
      {result !== null && (
        <div
          className={`rounded-lg border p-5 space-y-4 ${VERDICT_CONFIG[result.verdict].borderClass} bg-[#141414]`}
          role="region"
          aria-label="Connection time evaluation result"
        >
          {/* Verdict headline */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Verdict</p>
              <p className={`text-4xl font-bold ${VERDICT_CONFIG[result.verdict].textClass}`}>
                {VERDICT_CONFIG[result.verdict].label}
              </p>
            </div>
            <span
              className={`mt-1 shrink-0 px-2 py-1 rounded text-xs font-medium ${VERDICT_CONFIG[result.verdict].badgeClass}`}
            >
              {totalAvailableMinutes} min available
            </span>
          </div>

          {/* Sublabel */}
          <p className="text-sm text-neutral-400 leading-relaxed">
            {VERDICT_CONFIG[result.verdict].sublabel}
          </p>

          {/* MCT reference */}
          <div className="border-t border-neutral-800 pt-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500">
                Recommended minimum connecting time:
              </span>
              <span className="text-sm font-semibold text-neutral-300">
                {result.mctMinutes} min
              </span>
              {!result.isKnownAirport && (
                <span className="px-2 py-0.5 rounded text-xs bg-neutral-800 text-neutral-500">
                  General default
                </span>
              )}
            </div>

            {/* Mandatory disclaimer */}
            <p className="text-xs text-neutral-500 leading-relaxed">
              This is a reference guide only. Actual transit time depends on terminal layout,
              queue lengths, and real-time conditions. Even a{' '}
              <strong className="text-neutral-400">&ldquo;Comfortable&rdquo;</strong> result does not
              guarantee you will make the connection.
            </p>

            {/* Source */}
            {result.isKnownAirport && selectedAirport ? (
              <p className="text-xs text-neutral-600">
                Source:{' '}
                <a
                  href={selectedAirport.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-neutral-400 underline underline-offset-2 transition-colors"
                >
                  {selectedAirport.sourceName}
                </a>
              </p>
            ) : (
              <p className="text-xs text-neutral-600">
                Source:{' '}
                <a
                  href="https://www.iata.org/en/publications/manuals/station-standard-minimum-connecting-time-mct/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-neutral-400 underline underline-offset-2 transition-colors"
                >
                  IATA Recommended Practice 1670 (general default)
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
