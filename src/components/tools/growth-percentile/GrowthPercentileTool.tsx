'use client'

import { useState, useEffect, useRef } from 'react'
import { calculatePercentile } from '@/lib/utils/growthPercentile'
import type { GrowthInput, GrowthPercentileResult } from '@/lib/utils/growthPercentile'
import type { GrowthStandard } from '@/lib/config/growthStandards'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// ── Types ─────────────────────────────────────────────────────────────────────

type Gender = 'male' | 'female'

type SavedInputs = {
  ageMonths: string
  weightKg: string
  heightCm: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

type PercentileGaugeProps = {
  label: string
  percentile: number
}

function PercentileGauge({ label, percentile }: PercentileGaugeProps) {
  const pct = clamp(percentile, 0.1, 99.9)
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-neutral-400">{label}</span>
        <span className="text-3xl font-bold text-[#f59e0b] tabular-nums">
          {pct.toFixed(1)}
          <span className="text-base font-normal text-neutral-400 ml-1">th %ile</span>
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#f59e0b] transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct.toFixed(1)}th percentile`}
        />
      </div>
      <div className="flex justify-between text-xs text-neutral-600">
        <span>0th</span>
        <span>50th</span>
        <span>100th</span>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GrowthPercentileTool() {
  const { sendEvent } = useAnalyticsEvent()
  const hasFiredOpenRef = useRef(false)

  // ── LocalStorage opt-in state ─────────────────────────────────────────────
  const [saveEnabled, setSaveEnabled] = useState(false)
  const [savedInputs, setSavedInputs] = useLocalStorage<SavedInputs>(
    'growth-percentile:last-inputs',
    { ageMonths: '', weightKg: '', heightCm: '' }
  )

  // ── Form state ────────────────────────────────────────────────────────────
  const [gender, setGender] = useState<Gender>('male')
  const [standard, setStandard] = useState<GrowthStandard>('WHO')
  const [ageInput, setAgeInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [heightInput, setHeightInput] = useState('')

  // ── Result state ──────────────────────────────────────────────────────────
  const [result, setResult] = useState<GrowthPercentileResult | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  // ── Fire tool_open once ───────────────────────────────────────────────────
  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist inputs to localStorage when opt-in is enabled ────────────────
  useEffect(() => {
    if (saveEnabled) {
      setSavedInputs({ ageMonths: ageInput, weightKg: weightInput, heightCm: heightInput })
    }
  }, [saveEnabled, ageInput, weightInput, heightInput, setSavedInputs])

  // ── Restore saved inputs when user opts in ────────────────────────────────
  function handleSaveToggle(enabled: boolean) {
    setSaveEnabled(enabled)
    if (enabled && (savedInputs.ageMonths || savedInputs.weightKg || savedInputs.heightCm)) {
      setAgeInput(savedInputs.ageMonths)
      setWeightInput(savedInputs.weightKg)
      setHeightInput(savedInputs.heightCm)
    }
  }

  // ── Derived validation ────────────────────────────────────────────────────
  const age = parseInt(ageInput, 10)
  const weight = parseFloat(weightInput)
  const height = parseFloat(heightInput)

  const ageValid = !isNaN(age) && age >= 0 && age <= 60
  const weightValid = !isNaN(weight) && weight > 0 && weight <= 50
  const heightValid = !isNaN(height) && height > 0 && height <= 130

  const canCalculate = ageValid && weightValid && heightValid

  // ── Calculate ─────────────────────────────────────────────────────────────
  function handleCalculate() {
    if (!canCalculate) return

    const input: GrowthInput = {
      gender,
      ageMonths: age,
      weightKg: weight,
      heightCm: height,
    }

    const percentileResult = calculatePercentile(input, standard)
    setResult(percentileResult)
    setHasCalculated(true)
    sendEvent('calculate')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Input Panel ───────────────────────────────────────────────────── */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Child&apos;s Information
        </h2>

        {/* Gender */}
        <div className="space-y-1.5">
          <span className="block text-sm text-neutral-400">Sex</span>
          <div className="flex gap-2">
            {(['male', 'female'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGender(g)
                  setResult(null)
                  setHasCalculated(false)
                }}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  gender === g
                    ? 'bg-neutral-700 border-neutral-600 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {g === 'male' ? 'Male (Boy)' : 'Female (Girl)'}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div className="space-y-1.5">
          <label htmlFor="age-input" className="block text-sm text-neutral-400">
            Age (months)
          </label>
          <input
            id="age-input"
            type="number"
            min={0}
            max={60}
            step={1}
            value={ageInput}
            onChange={(e) => {
              setAgeInput(e.target.value)
              setResult(null)
              setHasCalculated(false)
            }}
            placeholder="e.g. 12"
            className={`w-36 rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
              ageInput && !ageValid ? 'border-red-800' : 'border-neutral-800'
            }`}
          />
          {ageInput && !ageValid && (
            <p className="text-xs text-red-400">Enter a value between 0 and 60 months</p>
          )}
        </div>

        {/* Weight & Height */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="weight-input" className="block text-sm text-neutral-400">
              Weight (kg)
            </label>
            <input
              id="weight-input"
              type="number"
              min={0.5}
              max={50}
              step={0.1}
              value={weightInput}
              onChange={(e) => {
                setWeightInput(e.target.value)
                setResult(null)
                setHasCalculated(false)
              }}
              placeholder="e.g. 9.5"
              className={`w-full rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
                weightInput && !weightValid ? 'border-red-800' : 'border-neutral-800'
              }`}
            />
            {weightInput && !weightValid && (
              <p className="text-xs text-red-400">Enter a valid weight (0–50 kg)</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="height-input" className="block text-sm text-neutral-400">
              Height / Length (cm)
            </label>
            <input
              id="height-input"
              type="number"
              min={30}
              max={130}
              step={0.1}
              value={heightInput}
              onChange={(e) => {
                setHeightInput(e.target.value)
                setResult(null)
                setHasCalculated(false)
              }}
              placeholder="e.g. 75"
              className={`w-full rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
                heightInput && !heightValid ? 'border-red-800' : 'border-neutral-800'
              }`}
            />
            {heightInput && !heightValid && (
              <p className="text-xs text-red-400">Enter a valid height (30–130 cm)</p>
            )}
          </div>
        </div>

        {/* Reference standard */}
        <div className="space-y-1.5">
          <span className="block text-sm text-neutral-400">Growth Reference</span>
          <div className="flex gap-2">
            {(['WHO', 'CDC'] as GrowthStandard[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStandard(s)
                  setResult(null)
                  setHasCalculated(false)
                }}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  standard === s
                    ? 'bg-neutral-700 border-neutral-600 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {s === 'WHO' ? 'WHO (International)' : 'CDC (US)'}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            WHO is recommended for children 0–2 years worldwide; CDC is commonly
            used for US children 2 years and older.
          </p>
        </div>

        {/* LocalStorage opt-in */}
        <div className="border-t border-neutral-800 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveEnabled}
              onChange={(e) => handleSaveToggle(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-[#f59e0b] cursor-pointer"
            />
            <span className="text-xs text-neutral-500 leading-relaxed">
              Save age, weight, and height in this browser for next visit.{' '}
              <span className="text-neutral-600">
                (Optional. Data stays on your device — never sent to any server.)
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* ── Calculate button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleCalculate}
        disabled={!canCalculate}
        className="w-full rounded-lg bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Calculate Percentile
      </button>

      {/* ── Result Panel ──────────────────────────────────────────────────── */}
      {hasCalculated && result && (
        <section
          className="rounded-lg border border-neutral-700 bg-[#141414] p-5 space-y-6 animate-fade-in"
          aria-label="Growth percentile results"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
              Percentile Results
            </h2>
            <span className="text-xs text-neutral-600">
              {standard} reference · {gender === 'male' ? 'Boy' : 'Girl'} · {age}m
            </span>
          </div>

          <PercentileGauge label="Weight for Age" percentile={result.weightPercentile} />
          <PercentileGauge label="Height / Length for Age" percentile={result.heightPercentile} />

          {/* Mandatory reference note — always visible, cannot be hidden */}
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 px-4 py-3 text-xs text-amber-300 leading-relaxed">
            <strong>For reference only.</strong> These results are based on population
            statistics and do not indicate whether your child&apos;s growth is healthy or
            concerning. A wide range of percentiles (approximately 3rd to 97th) is
            considered typical. For any concerns about your child&apos;s growth, please
            consult a qualified paediatrician.
          </div>

          {/* Source attribution */}
          <p className="text-xs text-neutral-600 leading-relaxed">
            Source:{' '}
            {standard === 'WHO'
              ? 'WHO Child Growth Standards (2006). World Health Organization.'
              : 'CDC Growth Charts (Kuczmarski et al., 2002). Centers for Disease Control and Prevention.'}
          </p>
        </section>
      )}
    </div>
  )
}
