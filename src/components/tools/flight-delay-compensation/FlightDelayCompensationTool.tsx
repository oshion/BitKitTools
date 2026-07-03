'use client'

import { useEffect, useState } from 'react'
import {
  estimateCompensation,
  type FlightDelayInput,
  type CompensationEstimate,
} from '@/lib/utils/flightDelayCompensation'
import { FLIGHT_COMPENSATION_RULES } from '@/lib/config/flightCompensationRules'
import type { DistanceCategory, RegulationType } from '@/lib/config/flightCompensationRules'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

type FormState = {
  regulation: RegulationType
  distanceCategory: DistanceCategory
  delayHours: number
  reason: 'airline-fault' | 'force-majeure'
}

const DEFAULT_STATE: FormState = {
  regulation: 'EU261',
  distanceCategory: 'short',
  delayHours: 3,
  reason: 'airline-fault',
}

const REGULATIONS: Array<{ id: RegulationType; label: string }> = [
  { id: 'EU261', label: 'EU Regulation 261/2004' },
  { id: 'US_DOT', label: 'US DOT (Domestic / Trans-Atlantic)' },
]

const DISTANCE_CATEGORIES: Array<{ id: DistanceCategory; label: string; desc: string }> = [
  { id: 'short', label: 'Short-haul', desc: 'Up to 1,500 km' },
  { id: 'medium', label: 'Medium-haul', desc: '1,500 – 3,500 km' },
  { id: 'long', label: 'Long-haul', desc: 'Over 3,500 km' },
]

const REASONS: Array<{ id: 'airline-fault' | 'force-majeure'; label: string; desc: string }> = [
  {
    id: 'airline-fault',
    label: 'Airline fault',
    desc: 'Technical issues, crew problems, overbooking, etc.',
  },
  {
    id: 'force-majeure',
    label: 'Force majeure / Extraordinary circumstances',
    desc: 'Severe weather, security threats, ATC strikes, political unrest, etc.',
  },
]

function formatAmount(min: number, max: number, currency: string): string {
  if (min === 0 && max === 0) return '—'
  const symbol = currency === 'EUR' ? '€' : '$'
  if (min === max) return `${symbol}${min.toLocaleString()}`
  return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}`
}

export default function FlightDelayCompensationTool() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE)
  const [result, setResult] = useState<CompensationEstimate | null>(null)
  const { sendEvent } = useAnalyticsEvent()

  useEffect(() => {
    sendEvent('tool_open')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCalculate() {
    const input: FlightDelayInput = {
      regulation: form.regulation,
      distanceCategory: form.distanceCategory,
      delayHours: form.delayHours,
      reason: form.reason,
    }
    const estimate = estimateCompensation(input)
    setResult(estimate)
    sendEvent('calculate')
  }

  function handleShare() {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('reg', form.regulation)
    url.searchParams.set('dist', form.distanceCategory)
    url.searchParams.set('delay', String(form.delayHours))
    url.searchParams.set('reason', form.reason)
    void navigator.clipboard.writeText(url.toString()).catch(() => null)
    sendEvent('share')
  }

  const regulationConfig = FLIGHT_COMPENSATION_RULES[form.regulation]

  return (
    <div className="space-y-6">
      {/* Step 1: Regulation */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 1 — Select Regulation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REGULATIONS.map((reg) => (
            <button
              key={reg.id}
              onClick={() => setForm((prev) => ({ ...prev, regulation: reg.id }))}
              className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                form.regulation === reg.id
                  ? 'border-[#f59e0b] bg-amber-950/20 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="font-medium">{reg.label}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">
          {regulationConfig.applies.en}
        </p>
      </section>

      {/* Step 2: Distance category */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 2 — Flight Distance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DISTANCE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setForm((prev) => ({ ...prev, distanceCategory: cat.id }))}
              className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                form.distanceCategory === cat.id
                  ? 'border-[#f59e0b] bg-amber-950/20 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="block font-medium">{cat.label}</span>
              <span className="text-xs text-neutral-500">{cat.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Step 3: Delay hours */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 3 — Arrival Delay
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-300">Delay duration</label>
            <span className="text-sm font-semibold text-[#f59e0b] tabular-nums">
              {form.delayHours} {form.delayHours === 1 ? 'hour' : 'hours'}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={24}
            value={form.delayHours}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, delayHours: Number(e.target.value) }))
            }
            className="w-full accent-[#f59e0b] cursor-pointer"
            aria-label="Delay hours"
          />
          <div className="flex justify-between text-xs text-neutral-600">
            <span>1h</span>
            <span>12h</span>
            <span>24h</span>
          </div>
        </div>
      </section>

      {/* Step 4: Delay reason */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 4 — Cause of Delay
        </h2>
        <div className="space-y-3">
          {REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setForm((prev) => ({ ...prev, reason: r.id }))}
              className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                form.reason === r.id
                  ? 'border-[#f59e0b] bg-amber-950/20 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="block font-medium">{r.label}</span>
              <span className="text-xs text-neutral-500">{r.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Calculate button */}
      <button
        onClick={handleCalculate}
        className="w-full px-4 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
      >
        Estimate Compensation
      </button>

      {/* Result */}
      {result !== null && (
        <div
          className={`rounded-lg border p-5 space-y-3 ${
            result.eligible
              ? 'border-neutral-700 bg-[#141414]'
              : 'border-neutral-800 bg-neutral-900/60'
          }`}
          role="region"
          aria-label="Compensation estimate result"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">
                Estimated compensation
              </p>
              <p
                className={`text-3xl font-bold tabular-nums ${
                  result.eligible ? 'text-[#f59e0b]' : 'text-neutral-500'
                }`}
              >
                {formatAmount(
                  result.amountRange.min,
                  result.amountRange.max,
                  result.currency
                )}
              </p>
            </div>
            <span
              className={`mt-1 shrink-0 px-2 py-1 rounded text-xs font-medium ${
                result.eligible
                  ? 'bg-neutral-800 text-neutral-300'
                  : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              {result.eligible ? 'Potentially eligible' : 'Not eligible'}
            </span>
          </div>

          {/* Mandatory notice — always shown */}
          <p className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-800 pt-3">
            This is an estimate only. Actual compensation depends on your airline, the
            specific route, the exact cause of delay, and the applicable authority&apos;s
            final determination.{' '}
            <strong className="text-neutral-300">
              Always verify your claim directly with your airline or a passenger rights
              service.
            </strong>
          </p>

          {result.reason && (
            <p className="text-xs text-neutral-500 leading-relaxed">{result.reason}</p>
          )}

          {/* Regulation source link */}
          <p className="text-xs text-neutral-600">
            Source:{' '}
            <a
              href={regulationConfig.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-400 underline underline-offset-2 transition-colors"
            >
              {regulationConfig.sourceName.en}
            </a>
          </p>

          <button
            onClick={handleShare}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Copy shareable link
          </button>
        </div>
      )}
    </div>
  )
}
