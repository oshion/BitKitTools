'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { calculateAbv, calculateDilution, type AbvFormula } from '@/lib/utils/homebrewCalculator'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { localeHref } from '@/lib/utils/locale-href'

// ── Types ─────────────────────────────────────────────────────────────────────

type VolumeUnit = 'L' | 'gal'

type SavedRecipe = {
  batchSizeValue: number
  batchSizeUnit: VolumeUnit
  og: string
  fg: string
}

const GALLON_TO_LITRE = 3.78541

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDisplayVolume(litres: number, unit: VolumeUnit): number {
  if (unit === 'gal') return Math.round((litres / GALLON_TO_LITRE) * 100) / 100
  return litres
}

function toLitres(value: number, unit: VolumeUnit): number {
  if (unit === 'gal') return value * GALLON_TO_LITRE
  return value
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomebrewRecipeCalculatorTool() {
  const { sendEvent } = useAnalyticsEvent()
  const locale = useLocale() as 'en' | 'ko'
  const hasFiredOpenRef = useRef(false)
  const inputEnteredRef = useRef(false)

  // Persisted recipe inputs
  const [savedRecipe, setSavedRecipe] = useLocalStorage<SavedRecipe>(
    'homebrew-recipe-calculator:last-recipe',
    { batchSizeValue: 20, batchSizeUnit: 'L', og: '1.050', fg: '1.010' }
  )

  // ABV section state (derived from saved recipe)
  const [batchSizeValue, setBatchSizeValue] = useState(savedRecipe.batchSizeValue)
  const [batchSizeUnit, setBatchSizeUnit] = useState<VolumeUnit>(savedRecipe.batchSizeUnit)
  const [ogInput, setOgInput] = useState(savedRecipe.og)
  const [fgInput, setFgInput] = useState(savedRecipe.fg)

  // Formula toggle state — user must explicitly switch; auto-suggest only
  const [formula, setFormula] = useState<AbvFormula>('standard')

  // Dilution section state
  const [showDilution, setShowDilution] = useState(false)
  const [targetAbvInput, setTargetAbvInput] = useState('')
  const [hasCopied, setHasCopied] = useState(false)

  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist inputs whenever they change
  useEffect(() => {
    setSavedRecipe({ batchSizeValue, batchSizeUnit, og: ogInput, fg: fgInput })
  }, [batchSizeValue, batchSizeUnit, ogInput, fgInput, setSavedRecipe])

  // ── Derived values ───────────────────────────────────────────────────────────

  const og = parseFloat(ogInput)
  const fg = parseFloat(fgInput)
  const ogValid = !isNaN(og) && og >= 1.0 && og <= 1.2
  const fgValid = !isNaN(fg) && fg >= 1.0 && fg <= 1.15
  const gravityValid = ogValid && fgValid

  // Suggest high-gravity formula when OG >= 1.070 (no auto-switch)
  const suggestHighGravity = ogValid && og >= 1.070 && formula === 'standard'

  const abv = gravityValid ? calculateAbv(og, fg, formula) : null
  const batchSizeLitres = toLitres(batchSizeValue, batchSizeUnit)

  const targetAbv = parseFloat(targetAbvInput)
  const targetAbvValid = !isNaN(targetAbv) && targetAbv > 0 && abv !== null && targetAbv < abv
  const dilutionResult =
    abv !== null && targetAbvValid
      ? calculateDilution(abv, batchSizeLitres, targetAbv)
      : null

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function fireInputEnterOnce() {
    if (!inputEnteredRef.current) {
      inputEnteredRef.current = true
      sendEvent('input_enter')
    }
  }

  function handleCalculate() {
    sendEvent('calculate')
  }

  async function handleCopyResult() {
    if (abv === null) return
    const formulaLabel = formula === 'high-gravity' ? 'high-gravity non-linear' : 'standard linear'
    const lines = [
      `Batch size: ${batchSizeValue} ${batchSizeUnit}`,
      `OG: ${ogInput}  FG: ${fgInput}`,
      `Estimated ABV: ${abv.toFixed(2)}% (${formulaLabel} formula)`,
    ]
    if (dilutionResult && targetAbvValid) {
      lines.push(
        `Dilution target: ${targetAbv}% ABV`,
        `Water to add: ${dilutionResult.waterToAddL} L`,
        `Final volume: ${dilutionResult.finalVolumeL} L`
      )
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setHasCopied(true)
      sendEvent('copy_result')
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      // Clipboard API may be blocked in some environments — silently ignore
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── ABV Input Panel ───────────────────────────────────────────────── */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Recipe Details
        </h2>

        {/* Batch size */}
        <div className="space-y-1.5">
          <label htmlFor="batch-size" className="block text-sm text-neutral-400">
            Batch Size
          </label>
          <div className="flex gap-2">
            <input
              id="batch-size"
              type="number"
              min={1}
              max={1000}
              step={0.5}
              value={batchSizeValue}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) { fireInputEnterOnce(); setBatchSizeValue(clamp(v, 0.1, 1000)) }
              }}
              className="w-32 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums"
            />
            <div className="flex rounded-lg border border-neutral-800 overflow-hidden">
              {(['L', 'gal'] as VolumeUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => {
                    if (unit === batchSizeUnit) return
                    fireInputEnterOnce()
                    // Convert displayed value to new unit
                    const litres = toLitres(batchSizeValue, batchSizeUnit)
                    setBatchSizeValue(
                      Math.round(toDisplayVolume(litres, unit) * 100) / 100
                    )
                    setBatchSizeUnit(unit)
                  }}
                  className={`px-3 py-2 text-sm transition-colors ${
                    batchSizeUnit === unit
                      ? 'bg-neutral-700 text-white'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gravity inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="og-input" className="block text-sm text-neutral-400">
              Original Gravity (OG)
            </label>
            <input
              id="og-input"
              type="number"
              min={1.0}
              max={1.2}
              step={0.001}
              value={ogInput}
              onChange={(e) => { fireInputEnterOnce(); setOgInput(e.target.value) }}
              onBlur={() => {
                const v = parseFloat(ogInput)
                if (!isNaN(v)) setOgInput(clamp(v, 1.0, 1.2).toFixed(3))
              }}
              placeholder="e.g. 1.050"
              className={`w-full rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
                ogInput && !ogValid ? 'border-red-800' : 'border-neutral-800'
              }`}
            />
            {ogInput && !ogValid && (
              <p className="text-xs text-red-400">Enter a value between 1.000 and 1.200</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fg-input" className="block text-sm text-neutral-400">
              Final Gravity (FG)
            </label>
            <input
              id="fg-input"
              type="number"
              min={1.0}
              max={1.15}
              step={0.001}
              value={fgInput}
              onChange={(e) => { fireInputEnterOnce(); setFgInput(e.target.value) }}
              onBlur={() => {
                const v = parseFloat(fgInput)
                if (!isNaN(v)) setFgInput(clamp(v, 1.0, 1.15).toFixed(3))
              }}
              placeholder="e.g. 1.010"
              className={`w-full rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
                fgInput && !fgValid ? 'border-red-800' : 'border-neutral-800'
              }`}
            />
            {fgInput && !fgValid && (
              <p className="text-xs text-red-400">Enter a value between 1.000 and 1.150</p>
            )}
          </div>
        </div>

        {/* Hydrometer temperature correction link */}
        <p className="text-xs text-neutral-500 leading-relaxed">
          Measure gravity with a hydrometer or refractometer. OG is measured before
          fermentation; FG after fermentation is complete.{' '}
          <Link
            href={localeHref(locale, '/beer/hydrometer-temperature-correction')}
            className="text-neutral-400 underline underline-offset-2 hover:text-neutral-300 transition-colors"
          >
            Need temperature correction? →
          </Link>
        </p>

        {/* Formula toggle */}
        <div className="space-y-1.5">
          <span className="block text-sm text-neutral-400">ABV Formula</span>
          <div className="flex rounded-lg border border-neutral-800 overflow-hidden w-fit">
            {(['standard', 'high-gravity'] as AbvFormula[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { fireInputEnterOnce(); setFormula(f) }}
                className={`px-4 py-2 text-sm transition-colors ${
                  formula === f
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {f === 'standard' ? 'Standard (linear)' : 'High-gravity (non-linear)'}
              </button>
            ))}
          </div>
          {suggestHighGravity && (
            <p className="text-xs text-amber-400">
              OG ≥ 1.070 detected — consider switching to the high-gravity formula for better accuracy.
            </p>
          )}
          <p className="text-xs text-neutral-600">
            {formula === 'standard'
              ? 'ABV ≈ (OG − FG) × 131.25 — best for most beers (OG below 1.070).'
              : 'ABV = (76.08 × (OG − FG) / (1.775 − OG)) × (FG / 0.794) — better for barleywine, imperial stout, etc.'}
          </p>
        </div>
      </section>

      {/* ── Calculate button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleCalculate}
        disabled={!gravityValid}
        className="w-full rounded-lg bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Calculate ABV
      </button>

      {/* ── ABV Result ───────────────────────────────────────────────────── */}
      <section
        className="rounded-lg border border-neutral-700 bg-[#141414] p-5 space-y-4 animate-fade-in"
        aria-label="ABV result"
      >
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            Estimated Alcohol By Volume
          </p>
          {abv !== null && gravityValid ? (
            <p className="text-5xl font-bold text-[#f59e0b] tabular-nums">
              {abv.toFixed(2)}
              <span className="text-xl font-normal text-neutral-400 ml-1">% ABV</span>
            </p>
          ) : (
            <p className="text-2xl font-medium text-neutral-500">
              Enter OG &amp; FG to calculate
            </p>
          )}
        </div>

        {abv !== null && gravityValid && (
          <div className="space-y-2 border-t border-neutral-800 pt-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3">
                <p className="text-xs text-neutral-500 mb-1">OG</p>
                <p className="text-sm font-semibold text-neutral-200 tabular-nums">{og.toFixed(3)}</p>
              </div>
              <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3">
                <p className="text-xs text-neutral-500 mb-1">FG</p>
                <p className="text-sm font-semibold text-neutral-200 tabular-nums">{fg.toFixed(3)}</p>
              </div>
              <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3">
                <p className="text-xs text-neutral-500 mb-1">Attenuation</p>
                <p className="text-sm font-semibold text-neutral-200 tabular-nums">
                  {(((og - fg) / (og - 1.0)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Formula used:{' '}
              <span className="text-neutral-400">
                {formula === 'standard'
                  ? 'Standard linear — ABV ≈ (OG − FG) × 131.25 (Fix & Fix, 1997). Best for most beers below OG 1.070. Actual ABV may vary ±0.1–0.3%.'
                  : 'High-gravity non-linear — ABV = (76.08 × (OG − FG) / (1.775 − OG)) × (FG / 0.794). A well-known correction formula for high-gravity beers (barleywine, imperial stout, etc.); widely used in the homebrewing community. Precise academic origin unclear — described honestly as a brewing community standard.'}
              </span>
            </p>
          </div>
        )}

        {/* Copy button */}
        {abv !== null && gravityValid && (
          <button
            type="button"
            onClick={handleCopyResult}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {hasCopied ? '✓ Copied' : 'Copy result'}
          </button>
        )}
      </section>

      {/* ── Dilution section toggle ──────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowDilution((v) => !v)}
          className="w-full rounded-lg border border-dashed border-neutral-700 py-2.5 text-sm text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 transition-colors"
        >
          {showDilution ? '▲ Hide dilution calculator' : '▼ Dilute to target ABV'}
        </button>
      </div>

      {/* ── Dilution Panel ───────────────────────────────────────────────── */}
      {showDilution && (
        <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4 animate-fade-in">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
            Dilution Calculator
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Enter a target ABV below your current estimated ABV to find out how much
            water to add to your{' '}
            <span className="text-neutral-400 tabular-nums">
              {batchSizeValue} {batchSizeUnit}
            </span>{' '}
            batch.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="target-abv" className="block text-sm text-neutral-400">
              Target ABV (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="target-abv"
                type="number"
                min={0.1}
                max={abv !== null ? abv - 0.1 : 99}
                step={0.1}
                value={targetAbvInput}
                onChange={(e) => setTargetAbvInput(e.target.value)}
                placeholder={abv !== null ? `< ${abv.toFixed(2)}` : 'Calculate ABV first'}
                disabled={abv === null || !gravityValid}
                className="w-32 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-neutral-500">%</span>
            </div>
            {targetAbvInput && abv !== null && !targetAbvValid && (
              <p className="text-xs text-red-400">
                Target ABV must be between 0.1% and {(abv - 0.01).toFixed(2)}%
              </p>
            )}
          </div>

          {/* Dilution result */}
          {dilutionResult && targetAbvValid && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4 space-y-3 animate-fade-in">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#f59e0b] tabular-nums">
                  +{dilutionResult.waterToAddL} L
                </span>
                <span className="text-sm text-neutral-400">water to add</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3">
                  <p className="text-xs text-neutral-500 mb-1">Final Volume</p>
                  <p className="text-sm font-semibold text-neutral-200 tabular-nums">
                    {dilutionResult.finalVolumeL} L
                    {batchSizeUnit === 'gal' && (
                      <span className="text-neutral-500 text-xs ml-1">
                        ({toDisplayVolume(dilutionResult.finalVolumeL, 'gal').toFixed(2)} gal)
                      </span>
                    )}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-3">
                  <p className="text-xs text-neutral-500 mb-1">Target ABV</p>
                  <p className="text-sm font-semibold text-neutral-200 tabular-nums">
                    {targetAbv.toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Using dilution formula C₁V₁ = C₂V₂. Add water gradually and re-measure
                gravity to confirm target ABV. Dilution may affect body and flavour.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
