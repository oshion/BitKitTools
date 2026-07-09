'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  calculateMidParentalHeight,
  cmToFeetInches,
  feetInchesToCm,
} from '@/lib/utils/heightPredictor'
import type { HeightPredictionResult } from '@/lib/utils/heightPredictor'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// ── Types ─────────────────────────────────────────────────────────────────────

type Sex = 'male' | 'female'
type Unit = 'cm' | 'ft-in'

type SavedInputs = {
  sex: Sex
  unit: Unit
  motherCm: string
  fatherCm: string
}

// ── Growth factor checklist items ─────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  {
    label: 'Adequate Sleep',
    description:
      'Growth hormone (GH) is largely secreted during deep (slow-wave) sleep. Studies show a higher prevalence of short stature in children with sleep disorders.',
    source: 'Source: Paediatric sleep–short stature research, PMC.',
  },
  {
    label: 'Balanced Nutrition',
    description:
      'Protein, calcium, vitamin D, and zinc are involved in bone growth and IGF-1 action. Insufficient energy and protein intake is associated with decreased IGF-1 levels.',
    source: 'Source: Nutritional adequacy–height percentile study in US children, PMC.',
  },
  {
    label: 'Regular Physical Activity',
    description:
      'Age-appropriate physical activity supports skeletal development and overall metabolism. Note: the causal claim that "exercise makes children taller" is not scientifically established — physical activity supports healthy skeletal development.',
    source: '',
  },
  {
    label: 'Regular Paediatric Check-ups',
    description:
      'Undiagnosed conditions such as growth hormone deficiency, hypothyroidism, or coeliac disease can impair growth. Early detection through regular check-ups helps children reach their genetic potential.',
    source: '',
  },
] as const

// ── Tree SVG stages ───────────────────────────────────────────────────────────

function TreeStage({ count }: { count: number }) {
  // 4 stages: seed (0), seedling (1-2), sapling (3), tree (4)
  const stage = count === 0 ? 0 : count <= 2 ? 1 : count === 3 ? 2 : 3

  const svgs = [
    // Stage 0: seed
    <svg key="seed" viewBox="0 0 40 60" className="w-10 h-14 transition-all duration-500" aria-label="Seed">
      <ellipse cx="20" cy="48" rx="7" ry="5" fill="#4ade80" opacity="0.7" />
    </svg>,
    // Stage 1: seedling / sprout
    <svg key="seedling" viewBox="0 0 40 60" className="w-10 h-14 transition-all duration-500" aria-label="Seedling">
      <rect x="19" y="32" width="2" height="18" fill="#86efac" rx="1" />
      <ellipse cx="20" cy="50" rx="7" ry="4" fill="#4ade80" opacity="0.6" />
      <ellipse cx="13" cy="36" rx="7" ry="4" fill="#4ade80" transform="rotate(-30 13 36)" />
      <ellipse cx="27" cy="36" rx="7" ry="4" fill="#4ade80" transform="rotate(30 27 36)" />
    </svg>,
    // Stage 2: sapling
    <svg key="sapling" viewBox="0 0 40 60" className="w-10 h-14 transition-all duration-500" aria-label="Sapling">
      <rect x="18" y="20" width="4" height="32" fill="#86efac" rx="2" />
      <ellipse cx="20" cy="52" rx="9" ry="4" fill="#4ade80" opacity="0.5" />
      <ellipse cx="20" cy="24" rx="12" ry="10" fill="#22c55e" />
      <ellipse cx="12" cy="30" rx="8" ry="6" fill="#4ade80" />
      <ellipse cx="28" cy="30" rx="8" ry="6" fill="#4ade80" />
    </svg>,
    // Stage 3: tree
    <svg key="tree" viewBox="0 0 40 60" className="w-10 h-14 transition-all duration-500" aria-label="Tree">
      <rect x="17" y="30" width="6" height="24" fill="#86efac" rx="3" />
      <ellipse cx="20" cy="54" rx="10" ry="4" fill="#4ade80" opacity="0.4" />
      <circle cx="20" cy="22" r="16" fill="#16a34a" />
      <circle cx="11" cy="28" r="10" fill="#22c55e" />
      <circle cx="29" cy="28" r="10" fill="#22c55e" />
      <circle cx="20" cy="14" r="10" fill="#4ade80" />
    </svg>,
  ]

  return svgs[stage] ?? null
}

// ── Height input (cm or ft-in) ────────────────────────────────────────────────

type HeightInputFieldProps = {
  label: string
  unit: Unit
  cmValue: string
  ftValue: string
  inValue: string
  onCmChange: (v: string) => void
  onFtChange: (v: string) => void
  onInChange: (v: string) => void
  errorMsg?: string
}

function HeightInputField({
  label,
  unit,
  cmValue,
  ftValue,
  inValue,
  onCmChange,
  onFtChange,
  onInChange,
  errorMsg,
}: HeightInputFieldProps) {
  const hasError = Boolean(errorMsg)
  const borderClass = hasError ? 'border-red-800' : 'border-neutral-800'
  const inputBase =
    'rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums'

  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-neutral-400">{label}</label>
      {unit === 'cm' ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={100}
            max={230}
            step={0.1}
            value={cmValue}
            onChange={(e) => onCmChange(e.target.value)}
            placeholder="e.g. 165"
            className={`w-28 ${inputBase} ${borderClass}`}
          />
          <span className="text-xs text-neutral-600">cm</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={3}
            max={7}
            step={1}
            value={ftValue}
            onChange={(e) => onFtChange(e.target.value)}
            placeholder="ft"
            className={`w-20 ${inputBase} ${borderClass}`}
          />
          <span className="text-xs text-neutral-600">ft</span>
          <input
            type="number"
            min={0}
            max={11}
            step={1}
            value={inValue}
            onChange={(e) => onInChange(e.target.value)}
            placeholder="in"
            className={`w-20 ${inputBase} ${borderClass}`}
          />
          <span className="text-xs text-neutral-600">in</span>
        </div>
      )}
      {hasError && <p className="text-xs text-red-400">{errorMsg}</p>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function HeightPredictorTool() {
  const { sendEvent } = useAnalyticsEvent()
  const hasFiredOpenRef = useRef(false)
  const animationRef = useRef<number | null>(null)

  // ── LocalStorage opt-in ───────────────────────────────────────────────────
  const [saveEnabled, setSaveEnabled] = useState(false)
  const [savedInputs, setSavedInputs] = useLocalStorage<SavedInputs>(
    'height-predictor:last-inputs',
    { sex: 'male', unit: 'cm', motherCm: '', fatherCm: '' }
  )

  // ── Form state ────────────────────────────────────────────────────────────
  const [sex, setSex] = useState<Sex>('male')
  const [unit, setUnit] = useState<Unit>('cm')

  // cm mode values
  const [motherCm, setMotherCm] = useState('')
  const [fatherCm, setFatherCm] = useState('')

  // ft-in mode values
  const [motherFt, setMotherFt] = useState('')
  const [motherIn, setMotherIn] = useState('')
  const [fatherFt, setFatherFt] = useState('')
  const [fatherIn, setFatherIn] = useState('')

  // ── Result state ──────────────────────────────────────────────────────────
  const [result, setResult] = useState<HeightPredictionResult | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [displayCm, setDisplayCm] = useState(0)

  // ── Checklist state ───────────────────────────────────────────────────────
  const [checkedItems, setCheckedItems] = useState([false, false, false, false])
  const [expandedItems, setExpandedItems] = useState([false, false, false, false])

  // ── tool_open event ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist inputs when opt-in active ────────────────────────────────────
  useEffect(() => {
    if (saveEnabled) {
      setSavedInputs({ sex, unit, motherCm, fatherCm })
    }
  }, [saveEnabled, sex, unit, motherCm, fatherCm, setSavedInputs])

  function handleSaveToggle(enabled: boolean) {
    setSaveEnabled(enabled)
    if (enabled && (savedInputs.motherCm || savedInputs.fatherCm)) {
      setSex(savedInputs.sex)
      setUnit(savedInputs.unit)
      setMotherCm(savedInputs.motherCm)
      setFatherCm(savedInputs.fatherCm)
      // Also populate ft-in fields from saved cm values if in ft-in mode
      if (savedInputs.unit === 'ft-in') {
        const mCm = parseFloat(savedInputs.motherCm)
        const fCm = parseFloat(savedInputs.fatherCm)
        if (!isNaN(mCm)) {
          const m = cmToFeetInches(mCm)
          setMotherFt(String(m.feet))
          setMotherIn(String(m.inches))
        }
        if (!isNaN(fCm)) {
          const f = cmToFeetInches(fCm)
          setFatherFt(String(f.feet))
          setFatherIn(String(f.inches))
        }
      }
    }
  }

  // ── Unit toggle logic ─────────────────────────────────────────────────────

  function handleUnitChange(newUnit: Unit) {
    if (newUnit === unit) return

    if (newUnit === 'ft-in') {
      // cm → ft-in
      const mCm = parseFloat(motherCm)
      const fCm = parseFloat(fatherCm)
      if (!isNaN(mCm) && mCm > 0) {
        const m = cmToFeetInches(mCm)
        setMotherFt(String(m.feet))
        setMotherIn(String(m.inches))
      } else {
        setMotherFt('')
        setMotherIn('')
      }
      if (!isNaN(fCm) && fCm > 0) {
        const f = cmToFeetInches(fCm)
        setFatherFt(String(f.feet))
        setFatherIn(String(f.inches))
      } else {
        setFatherFt('')
        setFatherIn('')
      }
    } else {
      // ft-in → cm
      const mFt = parseFloat(motherFt)
      const mIn = parseFloat(motherIn)
      const fFt = parseFloat(fatherFt)
      const fIn = parseFloat(fatherIn)
      if (!isNaN(mFt) && !isNaN(mIn)) {
        setMotherCm(String(Math.round(feetInchesToCm(mFt, mIn) * 10) / 10))
      } else {
        setMotherCm('')
      }
      if (!isNaN(fFt) && !isNaN(fIn)) {
        setFatherCm(String(Math.round(feetInchesToCm(fFt, fIn) * 10) / 10))
      } else {
        setFatherCm('')
      }
    }

    setUnit(newUnit)
    setResult(null)
    setHasCalculated(false)
  }

  // ── Derived cm values (always in cm for calculation) ──────────────────────

  function getMotherHeightCm(): number {
    if (unit === 'cm') return parseFloat(motherCm)
    const ft = parseFloat(motherFt)
    const inches = parseFloat(motherIn)
    if (isNaN(ft) || isNaN(inches)) return NaN
    return feetInchesToCm(ft, inches)
  }

  function getFatherHeightCm(): number {
    if (unit === 'cm') return parseFloat(fatherCm)
    const ft = parseFloat(fatherFt)
    const inches = parseFloat(fatherIn)
    if (isNaN(ft) || isNaN(inches)) return NaN
    return feetInchesToCm(ft, inches)
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function isValidHeightCm(cm: number): boolean {
    return !isNaN(cm) && cm >= 100 && cm <= 230
  }

  const motherHeightCm = getMotherHeightCm()
  const fatherHeightCm = getFatherHeightCm()

  const motherValid = unit === 'cm'
    ? (motherCm === '' ? true : isValidHeightCm(parseFloat(motherCm)))
    : (motherFt === '' && motherIn === '' ? true : isValidHeightCm(motherHeightCm))
  const fatherValid = unit === 'cm'
    ? (fatherCm === '' ? true : isValidHeightCm(parseFloat(fatherCm)))
    : (fatherFt === '' && fatherIn === '' ? true : isValidHeightCm(fatherHeightCm))

  const hasMotherInput = unit === 'cm' ? motherCm !== '' : motherFt !== '' || motherIn !== ''
  const hasFatherInput = unit === 'cm' ? fatherCm !== '' : fatherFt !== '' || fatherIn !== ''

  const canCalculate =
    hasMotherInput && hasFatherInput &&
    isValidHeightCm(motherHeightCm) &&
    isValidHeightCm(fatherHeightCm)

  // ── Count-up animation ────────────────────────────────────────────────────

  const animateTo = useCallback((target: number) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplayCm(target)
      return
    }

    const duration = 500
    const startTime = performance.now()

    function tick() {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayCm(Math.floor(eased * target))
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayCm(target)
      }
    }

    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // ── Calculate ─────────────────────────────────────────────────────────────

  function handleCalculate() {
    if (!canCalculate || isCalculating) return

    const mCm = motherHeightCm
    const fCm = fatherHeightCm

    setIsCalculating(true)
    sendEvent('calculate')

    // Compute immediately, but delay showing result by 600ms
    const computed = calculateMidParentalHeight({ sex, motherHeightCm: mCm, fatherHeightCm: fCm })

    setTimeout(() => {
      setResult(computed)
      setHasCalculated(true)
      setIsCalculating(false)
      animateTo(Math.round(computed.predictedHeightCm))
    }, 600)
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  function handleShare() {
    if (!result) return
    const { predictedHeightCm, rangeLowCm, rangeHighCm } = result
    const text = `Predicted adult height: ${predictedHeightCm}cm (${rangeLowCm}–${rangeHighCm}cm range)`

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Child Height Predictor',
        text,
        url: window.location.href,
      }).catch(() => {/* user cancelled */})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {/* ignore */})
    }
    sendEvent('share')
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function formatCmWithFtIn(cm: number): string {
    const { feet, inches } = cmToFeetInches(cm)
    return `${Math.round(cm)}cm (${feet}'${inches}")`
  }

  function resetResult() {
    setResult(null)
    setHasCalculated(false)
  }

  const checkedCount = checkedItems.filter(Boolean).length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Input Panel ───────────────────────────────────────────────────── */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Parents&apos; Information
        </h2>

        {/* Sex selection */}
        <div className="space-y-1.5">
          <span className="block text-sm text-neutral-400">Child&apos;s Sex</span>
          <div className="flex gap-2">
            {(['male', 'female'] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSex(s)
                  resetResult()
                }}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  sex === s
                    ? 'bg-neutral-700 border-neutral-600 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {s === 'male' ? 'Boy (Male)' : 'Girl (Female)'}
              </button>
            ))}
          </div>
        </div>

        {/* Unit toggle */}
        <div className="space-y-1.5">
          <span className="block text-sm text-neutral-400">Unit</span>
          <div className="flex gap-2">
            {(['cm', 'ft-in'] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => handleUnitChange(u)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  unit === u
                    ? 'bg-neutral-700 border-neutral-600 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {u === 'cm' ? 'cm' : 'ft / in'}
              </button>
            ))}
          </div>
        </div>

        {/* Mother's height */}
        <HeightInputField
          label="Mother's Height"
          unit={unit}
          cmValue={motherCm}
          ftValue={motherFt}
          inValue={motherIn}
          onCmChange={(v) => { setMotherCm(v); resetResult() }}
          onFtChange={(v) => { setMotherFt(v); resetResult() }}
          onInChange={(v) => { setMotherIn(v); resetResult() }}
          errorMsg={hasMotherInput && !motherValid ? 'Enter a height between 100–230cm (3\'4"–7\'7")' : undefined}
        />

        {/* Father's height */}
        <HeightInputField
          label="Father's Height"
          unit={unit}
          cmValue={fatherCm}
          ftValue={fatherFt}
          inValue={fatherIn}
          onCmChange={(v) => { setFatherCm(v); resetResult() }}
          onFtChange={(v) => { setFatherFt(v); resetResult() }}
          onInChange={(v) => { setFatherIn(v); resetResult() }}
          errorMsg={hasFatherInput && !fatherValid ? 'Enter a height between 100–230cm (3\'4"–7\'7")' : undefined}
        />

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
              Save parent heights and child&apos;s sex in this browser for next visit.{' '}
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
        disabled={!canCalculate || isCalculating}
        className="w-full rounded-lg bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isCalculating ? (
          <>
            {/* Simple CSS spinner */}
            <span
              className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"
              aria-hidden="true"
            />
            Calculating…
          </>
        ) : (
          'Predict Adult Height'
        )}
      </button>

      {/* ── Result Panel ──────────────────────────────────────────────────── */}
      {hasCalculated && result && (
        <section
          className="rounded-lg border border-neutral-700 bg-[#141414] p-5 space-y-5 animate-fade-in"
          aria-label="Height prediction results"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
              Predicted Adult Height
            </h2>
            <button
              type="button"
              onClick={handleShare}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2"
            >
              Share
            </button>
          </div>

          {/* Main predicted value with count-up */}
          <div className="text-center py-2">
            <p className="text-5xl font-bold text-[#f59e0b] tabular-nums">
              {displayCm}
              <span className="text-2xl font-normal text-neutral-400 ml-2">cm</span>
            </p>
            <p className="text-sm text-neutral-400 mt-2">
              {cmToFeetInches(result.predictedHeightCm).feet}&apos;{cmToFeetInches(result.predictedHeightCm).inches}&quot;
            </p>
            <p className="text-xs text-neutral-600 mt-3">
              Typical range: {formatCmWithFtIn(result.rangeLowCm)} – {formatCmWithFtIn(result.rangeHighCm)}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              (3rd–97th percentile of expected adult height · Tanner et al., 1970)
            </p>
          </div>

          {/* Mandatory disclaimer note — always visible */}
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 px-4 py-3 text-xs text-amber-300 leading-relaxed">
            <strong>Statistical estimate only.</strong> This is based on parent heights using the
            Mid-Parental Height method (Tanner, Goldstein &amp; Whitehouse, 1970,{' '}
            <em>Archives of Disease in Childhood</em>). Actual growth depends on nutrition, sleep,
            health, and other factors. For accurate assessment, consult a paediatrician.
          </div>
        </section>
      )}

      {/* ── Growth factor checklist ────────────────────────────────────────── */}
      <section className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
              Supporting Your Child&apos;s Genetic Potential
            </h2>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Reference checklist only — these factors do not affect the predicted height above.
            </p>
          </div>
          {/* Tree animation */}
          <div className="flex flex-col items-center gap-1" aria-hidden="true">
            <TreeStage count={checkedCount} />
            <span className="text-xs text-neutral-600">{checkedCount}/4</span>
          </div>
        </div>

        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item, i) => (
            <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
              {/* Checkbox row */}
              <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-800 transition-colors">
                <input
                  type="checkbox"
                  checked={checkedItems[i]}
                  onChange={(e) => {
                    const next = [...checkedItems]
                    next[i] = e.target.checked
                    setCheckedItems(next)
                  }}
                  className="mt-0.5 w-4 h-4 rounded accent-[#f59e0b] cursor-pointer"
                />
                <span className="text-sm text-neutral-300 flex-1">{item.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    const next = [...expandedItems]
                    next[i] = !next[i]
                    setExpandedItems(next)
                  }}
                  aria-expanded={expandedItems[i]}
                  className="text-neutral-600 hover:text-neutral-400 transition-colors text-xs ml-2 shrink-0"
                >
                  {expandedItems[i] ? '▲' : '▼'}
                </button>
              </label>

              {/* Accordion */}
              {expandedItems[i] && (
                <div className="px-4 pb-3 text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3 space-y-1">
                  <p>{item.description}</p>
                  {item.source && <p className="text-neutral-600">{item.source}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
