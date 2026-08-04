'use client'

import { useEffect, useRef, useState } from 'react'
import {
  estimateCompensation,
  estimateDeniedBoardingCompensationUs,
  type FlightDelayInput,
  type CompensationEstimate,
  type DisruptionType,
} from '@/lib/utils/flightDelayCompensation'
import { FLIGHT_COMPENSATION_RULES, US_DENIED_BOARDING_RULES } from '@/lib/config/flightCompensationRules'
import type { DistanceCategory, RegulationType } from '@/lib/config/flightCompensationRules'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

type FormState = {
  regulation: RegulationType
  disruptionType: DisruptionType
  distanceCategory: DistanceCategory
  delayHours: number
  reason: 'airline-fault' | 'force-majeure'
  /** One-way fare amount — only used for US_DOT + denied-boarding */
  fareAmount: string
  isInternational: boolean
}

const DEFAULT_STATE: FormState = {
  regulation: 'EU261',
  disruptionType: 'delay',
  distanceCategory: 'short',
  delayHours: 3,
  reason: 'airline-fault',
  fareAmount: '',
  isInternational: false,
}

const REGULATIONS: Array<{ id: RegulationType; label: string }> = [
  { id: 'EU261', label: 'EU Regulation 261/2004' },
  { id: 'US_DOT', label: 'US DOT (Domestic / Trans-Atlantic)' },
]

const DISRUPTION_TYPES: Array<{ id: DisruptionType; label: string; desc: string }> = [
  { id: 'delay', label: 'Delay', desc: 'Flight arrived late at the destination' },
  { id: 'cancellation', label: 'Cancellation', desc: 'Flight was cancelled by the airline' },
  {
    id: 'denied-boarding',
    label: 'Denied Boarding',
    desc: 'Involuntarily bumped (e.g. overbooking)',
  },
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

/** True when the form requires fare-based input (US DOT + denied boarding) */
function isFareBased(form: FormState): boolean {
  return form.regulation === 'US_DOT' && form.disruptionType === 'denied-boarding'
}

/** True when the delay/reason step should be hidden */
function showReasonStep(form: FormState): boolean {
  return !isFareBased(form)
}

export default function FlightDelayCompensationTool() {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE)
  const [result, setResult] = useState<CompensationEstimate | null>(null)
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

  // Reset result whenever form inputs change
  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    fireInputEnterOnce()
    setForm((prev) => ({ ...prev, [key]: value }))
    setResult(null)
  }

  function handleCalculate() {
    if (isFareBased(form)) {
      const fareNum = parseFloat(form.fareAmount)
      if (isNaN(fareNum) || fareNum <= 0) return
      const estimate = estimateDeniedBoardingCompensationUs(
        fareNum,
        'USD',
        form.delayHours,
        form.isInternational
      )
      setResult(estimate)
    } else {
      const input: FlightDelayInput = {
        regulation: form.regulation,
        distanceCategory: form.distanceCategory,
        delayHours: form.delayHours,
        reason: form.reason,
        disruptionType: form.disruptionType,
      }
      const estimate = estimateCompensation(input)
      setResult(estimate)
    }
    sendEvent('calculate')
  }

  function handleShare() {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('reg', form.regulation)
    url.searchParams.set('disruption', form.disruptionType)
    url.searchParams.set('dist', form.distanceCategory)
    url.searchParams.set('delay', String(form.delayHours))
    url.searchParams.set('reason', form.reason)
    if (isFareBased(form)) {
      url.searchParams.set('fare', form.fareAmount)
      url.searchParams.set('intl', form.isInternational ? '1' : '0')
    }
    void navigator.clipboard.writeText(url.toString()).catch(() => null)
    sendEvent('share')
  }

  const regulationConfig = FLIGHT_COMPENSATION_RULES[form.regulation]
  const fareBased = isFareBased(form)

  // Note text for EU261 denied boarding (force majeure does not apply)
  const showDeniedBoardingForceMajeureNote =
    form.regulation === 'EU261' && form.disruptionType === 'denied-boarding'

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
              onClick={() => update('regulation', reg.id)}
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

      {/* Step 2: Disruption type */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 2 — Type of Disruption
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DISRUPTION_TYPES.map((d) => (
            <button
              key={d.id}
              onClick={() => update('disruptionType', d.id)}
              className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                form.disruptionType === d.id
                  ? 'border-[#f59e0b] bg-amber-950/20 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="block font-medium">{d.label}</span>
              <span className="text-xs text-neutral-500">{d.desc}</span>
            </button>
          ))}
        </div>
        {showDeniedBoardingForceMajeureNote && (
          <p className="text-xs text-amber-400/80 leading-relaxed border border-amber-900/40 rounded-lg px-3 py-2 bg-amber-950/10">
            Under EU261, airlines cannot use force majeure as a defence for denied boarding
            (overbooking). If you were involuntarily bumped, compensation is owed regardless
            of the airline&apos;s stated reason.
          </p>
        )}
      </section>

      {/* Step 3: Distance category OR fare input (fare-based for US DOT denied boarding) */}
      {fareBased ? (
        <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4 animate-fade-in">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
            Step 3 — One-Way Fare & Flight Type
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            US DOT denied boarding compensation is based on your purchased one-way fare (or
            proportional value for a round trip). Enter the one-way fare in USD.
          </p>
          <div className="space-y-3">
            <label className="block text-sm text-neutral-300">
              One-way fare (USD)
              <input
                type="number"
                min={0}
                step={1}
                value={form.fareAmount}
                onChange={(e) => update('fareAmount', e.target.value)}
                placeholder="e.g. 350"
                className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
              />
            </label>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-neutral-300">Flight type</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: false, label: 'Domestic', desc: 'Within the United States' },
                { value: true, label: 'International', desc: 'To or from a US airport' },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => update('isInternational', opt.value)}
                  className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                    form.isInternational === opt.value
                      ? 'border-[#f59e0b] bg-amber-950/20 text-white'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="block font-medium">{opt.label}</span>
                  <span className="text-xs text-neutral-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-600">
            Source:{' '}
            <a
              href={US_DENIED_BOARDING_RULES.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-400 underline underline-offset-2 transition-colors"
            >
              {US_DENIED_BOARDING_RULES.sourceName}
            </a>{' '}
            (verified {US_DENIED_BOARDING_RULES.verifiedAt})
          </p>
        </section>
      ) : (
        <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4 animate-fade-in">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
            Step 3 — Flight Distance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DISTANCE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => update('distanceCategory', cat.id)}
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
      )}

      {/* Step 4: Delay hours — label changes for denied boarding */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Step 4 —{' '}
          {fareBased
            ? 'How Late Did the Alternate Flight Arrive?'
            : 'Arrival Delay'}
        </h2>
        {fareBased && (
          <p className="text-xs text-neutral-500 leading-relaxed">
            Enter how many hours later than your original scheduled arrival the offered
            alternate transportation arrives (or would arrive).
          </p>
        )}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-300">
              {fareBased ? 'Alternate arrival delay' : 'Delay duration'}
            </label>
            <span className="text-sm font-semibold text-[#f59e0b] tabular-nums">
              {form.delayHours} {form.delayHours === 1 ? 'hour' : 'hours'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            value={form.delayHours}
            onChange={(e) => update('delayHours', Number(e.target.value))}
            className="w-full accent-[#f59e0b] cursor-pointer"
            aria-label={fareBased ? 'Alternate arrival delay hours' : 'Delay hours'}
          />
          <div className="flex justify-between text-xs text-neutral-600">
            <span>0h</span>
            <span>12h</span>
            <span>24h</span>
          </div>
        </div>
      </section>

      {/* Step 5: Cause — hidden for US DOT denied boarding */}
      {showReasonStep(form) && (
        <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4 animate-fade-in">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
            Step 5 — Cause of Disruption
          </h2>
          <div className="space-y-3">
            {REASONS.map((r) => (
              <button
                key={r.id}
                onClick={() => update('reason', r.id)}
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
      )}

      {/* Calculate button */}
      <button
        onClick={handleCalculate}
        disabled={fareBased && (form.fareAmount === '' || parseFloat(form.fareAmount) <= 0)}
        className="w-full px-4 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                className={`text-5xl font-bold tabular-nums ${
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

          {/* EU261 denied boarding note */}
          {showDeniedBoardingForceMajeureNote && result.eligible && (
            <p className="text-xs text-amber-400/70 leading-relaxed border-t border-neutral-800 pt-3">
              EU261 does not allow force majeure as a defence for denied boarding. This
              compensation applies regardless of the airline&apos;s stated reason for overbooking.
            </p>
          )}

          {/* Mandatory notice — always shown */}
          <p className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-800 pt-3">
            This is an estimate only. Actual compensation depends on your airline, the
            specific route, the exact cause of disruption, and the applicable authority&apos;s
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
            {fareBased ? (
              <a
                href={US_DENIED_BOARDING_RULES.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-neutral-400 underline underline-offset-2 transition-colors"
              >
                {US_DENIED_BOARDING_RULES.sourceName}
              </a>
            ) : (
              <a
                href={regulationConfig.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-neutral-400 underline underline-offset-2 transition-colors"
              >
                {regulationConfig.sourceName.en}
              </a>
            )}
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
