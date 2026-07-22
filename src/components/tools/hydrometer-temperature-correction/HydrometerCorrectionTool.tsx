'use client'

import { useState, useEffect, useRef } from 'react'
import {
  correctGravity,
  fahrenheitFromCelsius,
  celsiusFromFahrenheit,
} from '@/lib/utils/hydrometerCorrection'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// ── Types ─────────────────────────────────────────────────────────────────────

type TempUnit = '°F' | '°C'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Round to N decimal places for display. */
function round(v: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(v * factor) / factor
}

/** Convert a temperature value between units. */
function convertTemp(value: number, from: TempUnit, to: TempUnit): number {
  if (from === to) return value
  if (from === '°F' && to === '°C') return round(celsiusFromFahrenheit(value), 1)
  return round(fahrenheitFromCelsius(value), 1)
}

// Preset calibration temperatures as Fahrenheit values
const CALIB_PRESETS: { label: string; fahrenheit: number }[] = [
  { label: '59°F / 15°C', fahrenheit: 59 },
  { label: '68°F / 20°C', fahrenheit: 68 },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function HydrometerCorrectionTool() {
  const { sendEvent } = useAnalyticsEvent()
  const hasFiredOpenRef = useRef(false)

  // Opt-in localStorage: persist calibration temp (in °F) when user checks the box
  const [savedCalibF, setSavedCalibF] = useLocalStorage<number | null>(
    'hydrometer-temperature-correction:calibration-temp',
    null
  )
  const [saveCalib, setSaveCalib] = useState(savedCalibF !== null)

  // Temperature unit toggle — affects how both temperature fields are displayed
  const [tempUnit, setTempUnit] = useState<TempUnit>('°F')

  // ── Measured gravity ────────────────────────────────────────────────────────
  const [measuredInput, setMeasuredInput] = useState('1.052')

  // ── Sample temperature ──────────────────────────────────────────────────────
  const [sampleTempInput, setSampleTempInput] = useState('75')

  // ── Calibration temperature ─────────────────────────────────────────────────
  // Internal state kept in °F; display converted to tempUnit
  const [calibTempF, setCalibTempF] = useState<number>(
    savedCalibF !== null ? savedCalibF : 59
  )
  const [calibTempInput, setCalibTempInput] = useState<string>(
    savedCalibF !== null
      ? tempUnit === '°F'
        ? String(savedCalibF)
        : String(round(celsiusFromFahrenheit(savedCalibF), 1))
      : '59'
  )

  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Unit toggle handler ─────────────────────────────────────────────────────
  function handleUnitToggle(unit: TempUnit) {
    if (unit === tempUnit) return

    // Convert existing sample temperature value
    const sampleNum = parseFloat(sampleTempInput)
    if (!isNaN(sampleNum)) {
      setSampleTempInput(String(convertTemp(sampleNum, tempUnit, unit)))
    }

    // Convert existing calibration temperature display
    const calibDisplayValue =
      unit === '°F' ? calibTempF : round(celsiusFromFahrenheit(calibTempF), 1)
    setCalibTempInput(String(calibDisplayValue))

    setTempUnit(unit)
  }

  // ── Calibration temp: sync internal °F state from display input ─────────────
  function handleCalibInputChange(raw: string) {
    setCalibTempInput(raw)
    const v = parseFloat(raw)
    if (!isNaN(v)) {
      const asF = tempUnit === '°F' ? v : fahrenheitFromCelsius(v)
      setCalibTempF(round(asF, 2))
      if (saveCalib) setSavedCalibF(round(asF, 2))
    }
  }

  // ── Preset button handler ───────────────────────────────────────────────────
  function handlePreset(fahrenheit: number) {
    setCalibTempF(fahrenheit)
    const displayValue =
      tempUnit === '°F' ? fahrenheit : round(celsiusFromFahrenheit(fahrenheit), 1)
    setCalibTempInput(String(displayValue))
    if (saveCalib) setSavedCalibF(fahrenheit)
  }

  // ── Save-calibration toggle ─────────────────────────────────────────────────
  function handleSaveCalibToggle(checked: boolean) {
    setSaveCalib(checked)
    if (checked) {
      setSavedCalibF(calibTempF)
    } else {
      setSavedCalibF(null)
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const measured = parseFloat(measuredInput)
  const measuredValid = !isNaN(measured) && measured >= 0.99 && measured <= 1.2

  const sampleTempNum = parseFloat(sampleTempInput)
  const sampleTempF =
    !isNaN(sampleTempNum)
      ? tempUnit === '°F'
        ? sampleTempNum
        : fahrenheitFromCelsius(sampleTempNum)
      : NaN
  const sampleValid = !isNaN(sampleTempF) && sampleTempF >= 32 && sampleTempF <= 212

  const calibValid = calibTempF >= 32 && calibTempF <= 212

  const canCalculate = measuredValid && sampleValid && calibValid

  const result = canCalculate
    ? correctGravity({
        measuredGravity: measured,
        sampleTempF,
        calibrationTempF: calibTempF,
      })
    : null

  function handleCalculate() {
    if (canCalculate) sendEvent('calculate')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const deltaSign =
    result !== null ? (result.deltaFromMeasured >= 0 ? '+' : '') : ''

  return (
    <div className="space-y-6">
      {/* ── Input Panel ───────────────────────────────────────────────────── */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
            Hydrometer Reading
          </h2>
          {/* °F / °C toggle */}
          <div className="flex rounded-lg border border-neutral-800 overflow-hidden">
            {(['°F', '°C'] as TempUnit[]).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => handleUnitToggle(unit)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  tempUnit === unit
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Measured gravity */}
        <div className="space-y-1.5">
          <label htmlFor="measured-gravity" className="block text-sm text-neutral-400">
            Measured Gravity (SG)
          </label>
          <input
            id="measured-gravity"
            type="number"
            min={0.99}
            max={1.2}
            step={0.001}
            value={measuredInput}
            onChange={(e) => setMeasuredInput(e.target.value)}
            onBlur={() => {
              const v = parseFloat(measuredInput)
              if (!isNaN(v)) setMeasuredInput(Math.min(Math.max(v, 0.99), 1.2).toFixed(3))
            }}
            placeholder="e.g. 1.052"
            className={`w-40 rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
              measuredInput && !measuredValid ? 'border-red-800' : 'border-neutral-800'
            }`}
          />
          {measuredInput && !measuredValid && (
            <p className="text-xs text-red-400">Enter a value between 0.990 and 1.200</p>
          )}
        </div>

        {/* Temperature inputs side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Sample temperature */}
          <div className="space-y-1.5">
            <label htmlFor="sample-temp" className="block text-sm text-neutral-400">
              Sample Temperature ({tempUnit})
            </label>
            <input
              id="sample-temp"
              type="number"
              step={0.1}
              value={sampleTempInput}
              onChange={(e) => setSampleTempInput(e.target.value)}
              placeholder={tempUnit === '°F' ? 'e.g. 75' : 'e.g. 24'}
              className={`w-full rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
                sampleTempInput && !sampleValid ? 'border-red-800' : 'border-neutral-800'
              }`}
            />
            {sampleTempInput && !sampleValid && (
              <p className="text-xs text-red-400">
                Enter a valid temperature ({tempUnit === '°F' ? '32–212°F' : '0–100°C'})
              </p>
            )}
          </div>

          {/* Calibration temperature */}
          <div className="space-y-1.5">
            <label htmlFor="calib-temp" className="block text-sm text-neutral-400">
              Calibration Temperature ({tempUnit})
            </label>
            <input
              id="calib-temp"
              type="number"
              step={0.1}
              value={calibTempInput}
              onChange={(e) => handleCalibInputChange(e.target.value)}
              placeholder={tempUnit === '°F' ? 'e.g. 59' : 'e.g. 15'}
              className={`w-full rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
                calibTempInput && !calibValid ? 'border-red-800' : 'border-neutral-800'
              }`}
            />
            {calibTempInput && !calibValid && (
              <p className="text-xs text-red-400">
                Enter a valid calibration temperature
              </p>
            )}
            {/* Preset buttons */}
            <div className="flex gap-2">
              {CALIB_PRESETS.map(({ label, fahrenheit }) => {
                const isActive = Math.abs(calibTempF - fahrenheit) < 0.5
                return (
                  <button
                    key={fahrenheit}
                    type="button"
                    onClick={() => handlePreset(fahrenheit)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                      isActive
                        ? 'border-neutral-600 bg-neutral-700 text-white'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Save calibration opt-in */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={saveCalib}
            onChange={(e) => handleSaveCalibToggle(e.target.checked)}
            className="rounded border-neutral-700 bg-neutral-900 accent-neutral-400"
          />
          <span className="text-xs text-neutral-500">
            Remember my calibration temperature for next visit
          </span>
        </label>
      </section>

      {/* ── Calculate Button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleCalculate}
        disabled={!canCalculate}
        className="w-full rounded-lg bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Correct Gravity
      </button>

      {/* ── Result Card ───────────────────────────────────────────────────── */}
      <section
        className="rounded-lg border border-neutral-700 bg-[#141414] p-5 space-y-4 animate-fade-in"
        aria-label="Corrected gravity result"
      >
        <p className="text-xs text-neutral-500 uppercase tracking-wide">
          Corrected Specific Gravity
        </p>

        {result !== null ? (
          <>
            <p className="text-5xl font-bold text-[#f59e0b] tabular-nums leading-none">
              {result.correctedGravity.toFixed(4)}
            </p>
            <p className="text-sm text-neutral-400 tabular-nums">
              {deltaSign}
              {result.deltaFromMeasured.toFixed(4)} from measured ({measuredInput})
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed border-t border-neutral-800 pt-3">
              Formula: CG = MG × f(ST) / f(CT), where f(T) is the standard brewing
              temperature correction polynomial. This is the brewing industry&apos;s established
              standard correction method — widely used by professional and homebrewing references.
            </p>
          </>
        ) : (
          <p className="text-2xl font-medium text-neutral-500">
            Enter values above to correct
          </p>
        )}
      </section>
    </div>
  )
}
