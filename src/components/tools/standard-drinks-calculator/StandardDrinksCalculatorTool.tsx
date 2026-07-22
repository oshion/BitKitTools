'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  calculateStandardDrinks,
  GRAMS_PER_STANDARD_DRINK,
  type DrinkStandard,
} from '@/lib/utils/standardDrinksCalculator'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

// ── Types ─────────────────────────────────────────────────────────────────────

type VolumeUnit = 'ml' | 'floz'

/** Weekly recommended limits per country (health authority guidelines). */
const WEEKLY_RECOMMENDED_LIMITS: Record<
  DrinkStandard,
  { male?: number; female?: number; both?: number; source: string }
> = {
  us: {
    male: 14,
    female: 7,
    source: 'NIAAA (National Institute on Alcohol Abuse and Alcoholism)',
  },
  uk: {
    both: 14,
    source: 'NHS / UK Chief Medical Officers',
  },
  'au-sg': {
    both: 10,
    source: 'Australian Department of Health',
  },
  canada: {
    male: 15,
    female: 10,
    source: 'CCSA (Canadian Centre on Substance Use and Addiction)',
  },
}

// ── Drink presets (defined independently — rule 8, no import from bac-calculator) ──

type DrinkPreset = {
  label: string
  abvPercent: number
  defaultVolumeMl: number
}

const DRINK_PRESETS: Record<string, DrinkPreset> = {
  beer_regular: { label: 'Beer — Regular (~5%)', abvPercent: 5, defaultVolumeMl: 355 },
  beer_light: { label: 'Beer — Light (~3.5%)', abvPercent: 3.5, defaultVolumeMl: 355 },
  beer_craft: { label: 'Beer — Craft/Strong (~8%)', abvPercent: 8, defaultVolumeMl: 355 },
  wine: { label: 'Wine (~12%)', abvPercent: 12, defaultVolumeMl: 150 },
  wine_champagne: { label: 'Champagne / Sparkling (~12%)', abvPercent: 12, defaultVolumeMl: 150 },
  spirits: { label: 'Spirits / Liquor (~40%)', abvPercent: 40, defaultVolumeMl: 44 },
  sake: { label: 'Sake (~15%)', abvPercent: 15, defaultVolumeMl: 180 },
  cocktail: { label: 'Cocktail (est. ~15%)', abvPercent: 15, defaultVolumeMl: 120 },
  custom: { label: 'Custom', abvPercent: 5, defaultVolumeMl: 355 },
}

const DEFAULT_PRESET_KEY = 'beer_regular'

// ── Country label helpers ─────────────────────────────────────────────────────

const STANDARD_LABELS: Record<DrinkStandard, string> = {
  us: 'US (14 g)',
  uk: 'UK (8 g)',
  'au-sg': 'AU / SG (10 g)',
  canada: 'Canada (13.45 g)',
}

// ── Unit helpers ──────────────────────────────────────────────────────────────

function flOzToMl(floz: number): number {
  return floz * 29.5735
}

function mlToFlOz(ml: number): number {
  return ml / 29.5735
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StandardDrinksCalculatorTool() {
  const { sendEvent } = useAnalyticsEvent()
  const hasFiredOpenRef = useRef(false)

  const [presetKey, setPresetKey] = useState<string>(DEFAULT_PRESET_KEY)
  const [abvPercent, setAbvPercent] = useState<number>(
    DRINK_PRESETS[DEFAULT_PRESET_KEY]!.abvPercent,
  )
  const [volumeValue, setVolumeValue] = useState<number>(
    DRINK_PRESETS[DEFAULT_PRESET_KEY]!.defaultVolumeMl,
  )
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('ml')
  const [standard, setStandard] = useState<DrinkStandard>('us')

  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive volume in mL for calculation
  const volumeMl = volumeUnit === 'ml' ? volumeValue : flOzToMl(volumeValue)

  const result = calculateStandardDrinks({ volumeMl, abvPercent, standard })

  function handlePresetChange(key: string) {
    setPresetKey(key)
    if (key !== 'custom') {
      const preset = DRINK_PRESETS[key]!
      setAbvPercent(preset.abvPercent)
      const presetVolume =
        volumeUnit === 'ml'
          ? preset.defaultVolumeMl
          : Math.round(mlToFlOz(preset.defaultVolumeMl) * 10) / 10
      setVolumeValue(presetVolume)
    }
  }

  function handleAbvChange(value: number) {
    setAbvPercent(value)
    setPresetKey('custom')
  }

  function handleVolumeChange(value: number) {
    setVolumeValue(value)
    setPresetKey('custom')
  }

  function handleVolumeUnitToggle(newUnit: VolumeUnit) {
    if (newUnit === volumeUnit) return
    // Convert current volume value to new unit
    const converted =
      newUnit === 'floz'
        ? Math.round(mlToFlOz(volumeValue) * 10) / 10
        : Math.round(flOzToMl(volumeValue) * 10) / 10
    setVolumeUnit(newUnit)
    setVolumeValue(converted)
  }

  function handleCalculate() {
    sendEvent('calculate')
  }

  const weeklyLimit = WEEKLY_RECOMMENDED_LIMITS[standard]

  return (
    <div className="space-y-6">
      {/* ── Input panel ──────────────────────────────────────────────────── */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Drink Details
        </h2>

        {/* Drink type preset */}
        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-400">Drink Type</label>
          <select
            value={presetKey}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white focus:border-neutral-600 outline-none transition-colors"
          >
            {Object.entries(DRINK_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* ABV */}
        <div className="space-y-1.5">
          <label htmlFor="abv-input" className="block text-sm text-neutral-400">
            ABV (%)
          </label>
          <input
            id="abv-input"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={abvPercent}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) handleAbvChange(Math.min(Math.max(v, 0), 100))
            }}
            className="w-32 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums"
          />
        </div>

        {/* Volume */}
        <div className="space-y-1.5">
          <label htmlFor="volume-input" className="block text-sm text-neutral-400">
            Volume
          </label>
          <div className="flex gap-2">
            <input
              id="volume-input"
              type="number"
              min={0}
              step={volumeUnit === 'ml' ? 10 : 0.5}
              value={volumeValue}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v) && v >= 0) handleVolumeChange(v)
              }}
              className="w-32 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums"
            />
            {/* Unit toggle */}
            <div className="flex rounded-lg border border-neutral-800 overflow-hidden">
              {(['ml', 'floz'] as VolumeUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleVolumeUnitToggle(unit)}
                  className={`px-3 py-2 text-sm transition-colors ${
                    volumeUnit === unit
                      ? 'bg-neutral-700 text-white'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {unit === 'ml' ? 'mL' : 'fl oz'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Standard selector */}
        <div className="space-y-2">
          <label className="block text-sm text-neutral-400">
            Country Standard
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(GRAMS_PER_STANDARD_DRINK) as DrinkStandard[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStandard(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-center ${
                  standard === s
                    ? 'bg-neutral-700 border-neutral-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                {STANDARD_LABELS[s]}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-600">
            Standard drink definitions differ by country. Select the one that applies to you.
          </p>
        </div>
      </section>

      {/* ── Calculate button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleCalculate}
        className="w-full rounded-lg bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 transition-colors"
      >
        Calculate Standard Drinks
      </button>

      {/* ── Result ───────────────────────────────────────────────────────── */}
      <section
        className="rounded-lg border border-neutral-700 bg-[#141414] p-5 space-y-4 animate-fade-in"
        aria-label="Standard drinks result"
      >
        {/* Primary result: standard drinks count */}
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            Standard Drinks ({STANDARD_LABELS[standard]})
          </p>
          <p className="text-5xl font-bold text-[#f59e0b] tabular-nums">
            {result.standardDrinks.toFixed(2)}
            <span className="text-xl font-normal text-neutral-400 ml-2">drinks</span>
          </p>
        </div>

        {/* Secondary info */}
        <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4">
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Pure Alcohol</p>
            <p className="text-lg font-semibold text-neutral-200 tabular-nums">
              {result.pureAlcoholGrams.toFixed(2)}
              <span className="text-sm font-normal text-neutral-400 ml-1">g</span>
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Calories (alcohol only)</p>
            <p className="text-lg font-semibold text-neutral-200 tabular-nums">
              {result.caloriesKcal.toFixed(0)}
              <span className="text-sm font-normal text-neutral-400 ml-1">kcal</span>
            </p>
            <p className="text-xs text-neutral-600">approx. — alcohol only, not total beverage</p>
          </div>
        </div>

        {/* Weekly recommended limit reference */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-xs text-neutral-400 leading-relaxed space-y-1">
          <p className="font-medium text-neutral-300">
            Weekly recommended upper limit — {standard === 'uk' ? 'UK' : standard === 'au-sg' ? 'AU/SG' : standard === 'canada' ? 'Canada' : 'US'} ({weeklyLimit.source})
          </p>
          {weeklyLimit.both !== undefined ? (
            <p>≤ {weeklyLimit.both} standard drinks/week (all adults)</p>
          ) : (
            <p>
              ≤ {weeklyLimit.male} drinks/week (men) · ≤ {weeklyLimit.female} drinks/week (women)
            </p>
          )}
          <p className="text-neutral-600 mt-1">
            These are general guidelines — individual health conditions, medications, and other
            factors may require lower or no alcohol consumption. Consult a healthcare professional for
            personal advice.
          </p>
        </div>
      </section>

      {/* ── Link to BAC Calculator ───────────────────────────────────────── */}
      <p className="text-sm text-neutral-400 leading-relaxed">
        This tool converts alcohol content to standard drinks only — it does not estimate blood
        alcohol concentration (BAC).{' '}
        <Link
          href="/beer/bac-calculator"
          className="text-neutral-300 underline underline-offset-2 hover:text-white transition-colors"
        >
          Use the BAC Calculator
        </Link>{' '}
        if you need an estimated BAC figure.
      </p>
    </div>
  )
}
