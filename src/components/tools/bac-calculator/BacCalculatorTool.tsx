'use client'

import { useEffect, useReducer, useRef } from 'react'
import { calculateBac, lbsToKg, kgToLbs } from '@/lib/utils/bacCalculator'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import BacSafetyWarning from './BacSafetyWarning'

// ── Types ────────────────────────────────────────────────────────────────────

type WeightUnit = 'kg' | 'lbs'

type DrinkEntry = {
  id: number
  presetKey: string
  abvPercent: number
  volumeMl: number
}

type State = {
  gender: 'male' | 'female'
  weightValue: number
  weightUnit: WeightUnit
  drinks: DrinkEntry[]
  hoursElapsed: number
  nextId: number
}

type Action =
  | { type: 'SET_GENDER'; value: 'male' | 'female' }
  | { type: 'SET_WEIGHT_VALUE'; value: number }
  | { type: 'SET_WEIGHT_UNIT'; value: WeightUnit }
  | { type: 'ADD_DRINK' }
  | { type: 'REMOVE_DRINK'; id: number }
  | { type: 'UPDATE_DRINK'; id: number; field: 'abvPercent' | 'volumeMl' | 'presetKey'; value: number | string }
  | { type: 'SET_HOURS'; value: number }

// ── Drink presets ────────────────────────────────────────────────────────────

type DrinkPreset = {
  label: string
  abvPercent: number
  volumeMl: number
}

const DRINK_PRESETS: Record<string, DrinkPreset> = {
  beer_regular: { label: 'Beer (Regular, ~5%)', abvPercent: 5, volumeMl: 355 },
  beer_strong: { label: 'Beer (Craft/Strong, ~8%)', abvPercent: 8, volumeMl: 355 },
  wine: { label: 'Wine (~12%)', abvPercent: 12, volumeMl: 150 },
  spirits: { label: 'Spirits / Liquor (~40%)', abvPercent: 40, volumeMl: 44 },
  sake: { label: 'Sake (~15%)', abvPercent: 15, volumeMl: 180 },
  cocktail: { label: 'Cocktail (est. ~15%)', abvPercent: 15, volumeMl: 120 },
  custom: { label: 'Custom', abvPercent: 5, volumeMl: 355 },
}

const DEFAULT_PRESET_KEY = 'beer_regular'

function makeDefaultDrink(id: number): DrinkEntry {
  const preset = DRINK_PRESETS[DEFAULT_PRESET_KEY]!
  return {
    id,
    presetKey: DEFAULT_PRESET_KEY,
    abvPercent: preset.abvPercent,
    volumeMl: preset.volumeMl,
  }
}

// ── Reducer ──────────────────────────────────────────────────────────────────

const INITIAL_STATE: State = {
  gender: 'male',
  weightValue: 70,
  weightUnit: 'kg',
  drinks: [makeDefaultDrink(1)],
  hoursElapsed: 1,
  nextId: 2,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GENDER':
      return { ...state, gender: action.value }

    case 'SET_WEIGHT_VALUE':
      return { ...state, weightValue: action.value }

    case 'SET_WEIGHT_UNIT': {
      if (action.value === state.weightUnit) return state
      const converted =
        action.value === 'kg'
          ? lbsToKg(state.weightValue)
          : kgToLbs(state.weightValue)
      return { ...state, weightUnit: action.value, weightValue: converted }
    }

    case 'ADD_DRINK':
      return {
        ...state,
        drinks: [...state.drinks, makeDefaultDrink(state.nextId)],
        nextId: state.nextId + 1,
      }

    case 'REMOVE_DRINK':
      return {
        ...state,
        drinks: state.drinks.filter((d) => d.id !== action.id),
      }

    case 'UPDATE_DRINK':
      return {
        ...state,
        drinks: state.drinks.map((d) => {
          if (d.id !== action.id) return d
          if (action.field === 'presetKey' && typeof action.value === 'string') {
            const preset = DRINK_PRESETS[action.value] ?? DRINK_PRESETS[DEFAULT_PRESET_KEY]!
            return {
              ...d,
              presetKey: action.value,
              abvPercent: preset.abvPercent,
              volumeMl: preset.volumeMl,
            }
          }
          if (action.field === 'abvPercent' && typeof action.value === 'number') {
            return { ...d, abvPercent: action.value, presetKey: 'custom' }
          }
          if (action.field === 'volumeMl' && typeof action.value === 'number') {
            return { ...d, volumeMl: action.value, presetKey: 'custom' }
          }
          return d
        }),
      }

    case 'SET_HOURS':
      return { ...state, hoursElapsed: action.value }

    default:
      return state
  }
}

// ── Input helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BacCalculatorTool() {
  const { sendEvent } = useAnalyticsEvent()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const hasFiredOpenRef = useRef(false)

  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive weight in kg for calculation
  const weightKg =
    state.weightUnit === 'kg' ? state.weightValue : lbsToKg(state.weightValue)

  // Derive BAC result
  const bacResult = calculateBac({
    gender: state.gender,
    weightKg,
    drinks: state.drinks,
    hoursElapsed: state.hoursElapsed,
  })

  function handleCalculate() {
    // Fire analytics without personal data payload (ADR-014, screen spec)
    sendEvent('calculate')
  }

  return (
    <div className="space-y-6">
      {/* ── Safety warning — always visible, no close button (ADR-014) ─── */}
      <BacSafetyWarning />

      {/* ── Input panel ─────────────────────────────────────────────────── */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Your Information
        </h2>

        {/* Gender selector */}
        <div className="space-y-1.5">
          <label className="block text-sm text-neutral-400">Biological Sex</label>
          <div className="flex gap-3">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => dispatch({ type: 'SET_GENDER', value: g })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  state.gender === g
                    ? 'bg-neutral-700 border-neutral-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-600">
            Used to determine the Widmark distribution factor (r).
          </p>
        </div>

        {/* Weight */}
        <div className="space-y-1.5">
          <label htmlFor="weight-input" className="block text-sm text-neutral-400">
            Body Weight
          </label>
          <div className="flex gap-2">
            <input
              id="weight-input"
              type="number"
              min={30}
              max={300}
              step={0.5}
              value={state.weightValue}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) {
                  dispatch({
                    type: 'SET_WEIGHT_VALUE',
                    value: clamp(v, 30, 300),
                  })
                }
              }}
              className="w-32 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums"
            />
            <div className="flex rounded-lg border border-neutral-800 overflow-hidden">
              {(['kg', 'lbs'] as WeightUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_WEIGHT_UNIT', value: unit })}
                  className={`px-3 py-2 text-sm transition-colors ${
                    state.weightUnit === unit
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

        {/* Hours elapsed */}
        <div className="space-y-1.5">
          <label htmlFor="hours-input" className="block text-sm text-neutral-400">
            Hours since you started drinking
          </label>
          <div className="flex items-center gap-3">
            <input
              id="hours-input"
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={state.hoursElapsed}
              onChange={(e) =>
                dispatch({ type: 'SET_HOURS', value: parseFloat(e.target.value) })
              }
              className="flex-1 accent-[#f59e0b]"
            />
            <span className="w-16 text-right text-sm font-semibold text-[#f59e0b] tabular-nums">
              {state.hoursElapsed % 1 === 0
                ? `${state.hoursElapsed}h`
                : `${state.hoursElapsed}h`}
            </span>
          </div>
        </div>
      </section>

      {/* ── Drinks panel ─────────────────────────────────────────────────── */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Drinks Consumed
        </h2>

        <div className="space-y-3">
          {state.drinks.map((drink, index) => (
            <div
              key={drink.id}
              className="rounded-lg border border-neutral-700 bg-neutral-900/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-medium">
                  Drink {index + 1}
                </span>
                {state.drinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'REMOVE_DRINK', id: drink.id })}
                    className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                    aria-label={`Remove drink ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Preset selector */}
              <div className="space-y-1.5">
                <label className="block text-xs text-neutral-500">Type</label>
                <select
                  value={drink.presetKey}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_DRINK',
                      id: drink.id,
                      field: 'presetKey',
                      value: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white focus:border-neutral-600 outline-none transition-colors"
                >
                  {Object.entries(DRINK_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ABV + Volume */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs text-neutral-500">ABV (%)</label>
                  <input
                    type="number"
                    min={0.5}
                    max={95}
                    step={0.1}
                    value={drink.abvPercent}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) {
                        dispatch({
                          type: 'UPDATE_DRINK',
                          id: drink.id,
                          field: 'abvPercent',
                          value: clamp(v, 0.1, 95),
                        })
                      }
                    }}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-neutral-500">Volume (mL)</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    step={10}
                    value={drink.volumeMl}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) {
                        dispatch({
                          type: 'UPDATE_DRINK',
                          id: drink.id,
                          field: 'volumeMl',
                          value: clamp(v, 10, 2000),
                        })
                      }
                    }}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: 'ADD_DRINK' })}
          className="w-full rounded-lg border border-dashed border-neutral-700 py-2.5 text-sm text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 transition-colors"
        >
          + Add another drink
        </button>
      </section>

      {/* ── Calculate button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleCalculate}
        className="w-full rounded-lg bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 transition-colors"
      >
        Calculate Estimated BAC
      </button>

      {/* ── Result ───────────────────────────────────────────────────────── */}
      <section
        className="rounded-lg border border-neutral-700 bg-[#141414] p-5 space-y-4 animate-fade-in"
        aria-label="BAC estimate result"
      >
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            Estimated BAC (Blood Alcohol Concentration)
          </p>
          {/* Neutral number display only — NO color coding, NO pass/fail indicators (ADR-014) */}
          <p className="text-4xl font-bold text-[#f59e0b] tabular-nums">
            {bacResult.bacPercent.toFixed(3)}
            <span className="text-xl font-normal text-neutral-400 ml-1">%</span>
          </p>
          <p className="text-xs text-neutral-500">
            = {(bacResult.bacPercent * 10).toFixed(2)} g/L &nbsp;·&nbsp;{' '}
            {(bacResult.bacPercent * 1000).toFixed(1)} mg/dL
          </p>
        </div>

        {/* Widmark formula source citation — required (screen spec) */}
        <p className="text-xs text-neutral-600 leading-relaxed border-t border-neutral-800 pt-3">
          Calculated using the{' '}
          <strong className="text-neutral-500">Widmark formula</strong> (Widmark EMP, 1932).
          Ethanol density: 0.789 g/mL. Elimination rate: 0.015 g/dL/hr. Distribution
          factors: male r = 0.68, female r = 0.55. Individual results may vary significantly.
        </p>

        {/* Mandatory safety reminder — always shown, never conditional on BAC value (ADR-014) */}
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2.5 text-xs text-red-300 leading-relaxed">
          This estimate is for informational reference only. Do not drive or operate machinery
          after consuming alcohol. The only safe BAC for driving is 0.000%.
        </div>
      </section>

      {/* Standard medical disclaimer (separate from, and in addition to, BacSafetyWarning) */}
      <DisclaimerBanner disclaimerType="medical" />
    </div>
  )
}
