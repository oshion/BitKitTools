'use client'

import { useState, useEffect, useRef } from 'react'
import { calculateSleepSchedule } from '@/lib/utils/sleepSchedule'
import type { SleepScheduleResult } from '@/lib/utils/sleepSchedule'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// ── Types ─────────────────────────────────────────────────────────────────────

type SavedInputs = {
  ageMonths: string
  wakeUpTime: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns "07:00" for the current local hour (rounded down) */
function defaultWakeTime(): string {
  return '07:00'
}

/** Converts "HH:MM" to a display string like "7:00 AM" */
function to12h(hhmm: string): string {
  const parts = hhmm.split(':').map(Number)
  const h = parts[0]
  const m = parts[1]
  if (h === undefined || m === undefined || isNaN(h) || isNaN(m)) return hhmm
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/** Computes duration in minutes between two HH:MM strings */
function durationMinutes(start: string, end: string): number {
  const sParts = start.split(':').map(Number)
  const eParts = end.split(':').map(Number)
  const sh = sParts[0] ?? 0
  const sm = sParts[1] ?? 0
  const eh = eParts[0] ?? 0
  const em = eParts[1] ?? 0
  return eh * 60 + em - (sh * 60 + sm)
}

// ── Sub-components ────────────────────────────────────────────────────────────

type TimelineBarProps = {
  naps: SleepScheduleResult['naps']
  bedtime: string
  wakeUpTime: string
}

function TimelineBar({ naps, bedtime, wakeUpTime }: TimelineBarProps) {
  // Render a simple horizontal timeline from wake-up to bedtime
  const wParts = wakeUpTime.split(':').map(Number)
  const bParts = bedtime.split(':').map(Number)
  const wh = wParts[0] ?? 0
  const wm = wParts[1] ?? 0
  const bh = bParts[0] ?? 20
  const bm = bParts[1] ?? 0
  const dayStart = wh * 60 + wm
  // Ensure bedtime is at least after last nap; clamp to midnight+
  let dayEnd = bh * 60 + bm
  if (dayEnd <= dayStart) dayEnd = dayStart + 840 // fallback 14h window

  const totalDuration = dayEnd - dayStart
  if (totalDuration <= 0) return null

  function pct(minutes: number) {
    return ((minutes - dayStart) / totalDuration) * 100
  }

  return (
    <div className="space-y-3">
      <div className="relative h-10 rounded-lg bg-neutral-800 overflow-hidden">
        {/* Awake baseline */}
        <div className="absolute inset-0 bg-neutral-800" />

        {/* Nap blocks */}
        {naps.map((nap, i) => {
          const nsParts = nap.start.split(':').map(Number)
          const neParts = nap.end.split(':').map(Number)
          const ns = nsParts[0] ?? 0
          const nm = nsParts[1] ?? 0
          const ne = neParts[0] ?? 0
          const nem = neParts[1] ?? 0
          const napStartMin = ns * 60 + nm
          const napEndMin = ne * 60 + nem
          const left = Math.max(0, pct(napStartMin))
          const width = Math.max(2, pct(napEndMin) - pct(napStartMin))

          return (
            <div
              key={i}
              className="absolute top-0 h-full bg-[#f59e0b]/80 transition-all duration-500"
              style={{ left: `${left}%`, width: `${width}%` }}
              role="img"
              aria-label={`Nap ${i + 1}: ${to12h(nap.start)} – ${to12h(nap.end)}`}
              title={`Nap ${i + 1}: ${to12h(nap.start)} – ${to12h(nap.end)}`}
            />
          )
        })}
      </div>

      {/* Timeline labels */}
      <div className="flex justify-between text-xs text-neutral-600">
        <span>{to12h(wakeUpTime)}</span>
        <span className="text-neutral-500">← awake (white) · nap (amber) →</span>
        <span>{to12h(bedtime)}</span>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SleepScheduleTool() {
  const { sendEvent } = useAnalyticsEvent()
  const hasFiredOpenRef = useRef(false)
  const inputEnteredRef = useRef<boolean>(false)

  function fireInputEnterOnce() {
    if (!inputEnteredRef.current) {
      inputEnteredRef.current = true
      sendEvent('input_enter')
    }
  }

  // ── LocalStorage opt-in ───────────────────────────────────────────────────
  const [saveEnabled, setSaveEnabled] = useState(false)
  const [savedInputs, setSavedInputs] = useLocalStorage<SavedInputs>(
    'sleep-schedule:last-inputs',
    { ageMonths: '', wakeUpTime: defaultWakeTime() }
  )

  // ── Form state ────────────────────────────────────────────────────────────
  const [ageInput, setAgeInput] = useState('')
  const [wakeUpTime, setWakeUpTime] = useState(defaultWakeTime())
  const [lastNapEndTime, setLastNapEndTime] = useState('')
  const [showLastNapInput, setShowLastNapInput] = useState(false)

  // ── Result state ──────────────────────────────────────────────────────────
  const [result, setResult] = useState<SleepScheduleResult | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  // ── tool_open event ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist inputs when opt-in is active ─────────────────────────────────
  useEffect(() => {
    if (saveEnabled) {
      setSavedInputs({ ageMonths: ageInput, wakeUpTime })
    }
  }, [saveEnabled, ageInput, wakeUpTime, setSavedInputs])

  function handleSaveToggle(enabled: boolean) {
    setSaveEnabled(enabled)
    if (enabled && (savedInputs.ageMonths || savedInputs.wakeUpTime !== defaultWakeTime())) {
      if (savedInputs.ageMonths) setAgeInput(savedInputs.ageMonths)
      if (savedInputs.wakeUpTime) setWakeUpTime(savedInputs.wakeUpTime)
    }
  }

  // ── Derived validation ────────────────────────────────────────────────────
  const age = parseInt(ageInput, 10)
  const ageValid = !isNaN(age) && age >= 0 && age <= 24
  const wakeUpValid = /^\d{2}:\d{2}$/.test(wakeUpTime)
  const canCalculate = ageValid && wakeUpValid

  // ── Calculate ─────────────────────────────────────────────────────────────
  function handleCalculate() {
    if (!canCalculate) return

    const res = calculateSleepSchedule({
      ageMonths: age,
      wakeUpTime,
      lastNapEndTime: showLastNapInput ? lastNapEndTime : undefined,
    })
    setResult(res)
    setHasCalculated(true)
    sendEvent('calculate')
  }

  // ── Share ─────────────────────────────────────────────────────────────────
  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Baby Sleep Schedule',
        text: `Baby sleep schedule for ${age}-month-old, wake-up ${to12h(wakeUpTime)}`,
        url: window.location.href,
      }).catch(() => {/* user cancelled */})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {/* ignore */})
    }
    sendEvent('share')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Input Panel ───────────────────────────────────────────────────── */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Baby&apos;s Information
        </h2>

        {/* Age */}
        <div className="space-y-1.5">
          <label htmlFor="age-input" className="block text-sm text-neutral-400">
            Age (months, 0–24)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="age-input"
              type="number"
              min={0}
              max={24}
              step={1}
              value={ageInput}
              onChange={(e) => {
                fireInputEnterOnce()
                setAgeInput(e.target.value)
                setResult(null)
                setHasCalculated(false)
              }}
              placeholder="e.g. 6"
              className={`w-32 rounded-lg bg-neutral-900 border px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors tabular-nums ${
                ageInput && !ageValid ? 'border-red-800' : 'border-neutral-800'
              }`}
            />
            {/* Age range hint */}
            {ageValid && result && (
              <span className="text-xs text-neutral-500 leading-relaxed">
                {result.ageRangeLabel.en}
              </span>
            )}
          </div>
          {ageInput && !ageValid && (
            <p className="text-xs text-red-400">Enter a value between 0 and 24 months</p>
          )}
        </div>

        {/* Wake-up time */}
        <div className="space-y-1.5">
          <label htmlFor="wakeup-input" className="block text-sm text-neutral-400">
            Today&apos;s wake-up time
          </label>
          <input
            id="wakeup-input"
            type="time"
            value={wakeUpTime}
            onChange={(e) => {
              fireInputEnterOnce()
              setWakeUpTime(e.target.value)
              setResult(null)
              setHasCalculated(false)
            }}
            className="w-40 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors"
          />
        </div>

        {/* Optional: last nap end time */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setShowLastNapInput((v) => !v)
              setLastNapEndTime('')
              setResult(null)
              setHasCalculated(false)
            }}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2"
          >
            {showLastNapInput ? '− Hide last nap time' : '+ I know when the last nap ended (optional)'}
          </button>

          {showLastNapInput && (
            <div className="space-y-1.5">
              <label htmlFor="last-nap-input" className="block text-xs text-neutral-400">
                Last nap ended at
              </label>
              <input
                id="last-nap-input"
                type="time"
                value={lastNapEndTime}
                onChange={(e) => {
                  setLastNapEndTime(e.target.value)
                  setResult(null)
                  setHasCalculated(false)
                }}
                className="w-40 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors"
              />
              <p className="text-xs text-neutral-600 leading-relaxed">
                Remaining naps and bedtime will be recalculated from this point.
              </p>
            </div>
          )}
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
              Save age and wake-up time in this browser for next visit.{' '}
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
        Calculate Sleep Schedule
      </button>

      {/* ── Result Panel ──────────────────────────────────────────────────── */}
      {hasCalculated && result && (
        <section
          className="rounded-lg border border-neutral-700 bg-[#141414] p-5 space-y-6 animate-fade-in"
          aria-label="Sleep schedule results"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
              Today&apos;s Schedule
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-600">{result.ageRangeLabel.en}</span>
              <button
                type="button"
                onClick={handleShare}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2"
              >
                Share
              </button>
            </div>
          </div>

          {/* Visual timeline */}
          <TimelineBar naps={result.naps} bedtime={result.bedtime} wakeUpTime={wakeUpTime} />

          {/* Nap list */}
          {result.naps.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Naps ({result.naps.length})
              </h3>
              <div className="space-y-2">
                {result.naps.map((nap, i) => {
                  const dur = durationMinutes(nap.start, nap.end)
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
                    >
                      <span className="text-sm text-neutral-300">
                        Nap {i + 1}
                      </span>
                      <span className="text-sm font-medium text-white tabular-nums">
                        {to12h(nap.start)} – {to12h(nap.end)}
                      </span>
                      <span className="text-xs text-neutral-500 tabular-nums">
                        {Math.floor(dur / 60) > 0 ? `${Math.floor(dur / 60)}h ` : ''}
                        {dur % 60 > 0 ? `${dur % 60}m` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No remaining naps based on the provided last nap time.
            </p>
          )}

          {/* Bedtime */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-4 flex items-center justify-between">
            <span className="text-sm text-neutral-400">Recommended bedtime</span>
            <span className="text-3xl font-bold text-[#f59e0b] tabular-nums">
              {to12h(result.bedtime)}
            </span>
          </div>

          {/* Pattern summary */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Typical pattern for this age: </strong>
            {result.summary.en}
          </div>

          {/* Mandatory guideline note — always visible, cannot be hidden */}
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 px-4 py-3 text-xs text-amber-300 leading-relaxed">
            <strong>General guideline only.</strong> Every baby is different. This schedule
            is based on average recommendations for the age group and may not suit your
            baby&apos;s individual needs. If you have concerns about your child&apos;s sleep
            patterns, please consult a qualified paediatrician.
          </div>
        </section>
      )}
    </div>
  )
}
