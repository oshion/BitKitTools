'use client'

import { useState } from 'react'
import { calculateJetlag, type JetlagDirection } from '@/lib/utils/jetlagCalculator'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

// ─────────────────────────────────────────────────────────────────────────────
// UTC offset options (-12 to +14, covering all real-world time zones)
// ─────────────────────────────────────────────────────────────────────────────

type UtcOption = { value: number; label: string }

function buildUtcOptions(): UtcOption[] {
  const options: UtcOption[] = []
  for (let h = -12; h <= 14; h++) {
    const sign = h >= 0 ? '+' : ''
    options.push({ value: h, label: `UTC${sign}${h}` })
  }
  return options
}

const UTC_OPTIONS = buildUtcOptions()

// ─────────────────────────────────────────────────────────────────────────────
// Day-by-day guide content
// ─────────────────────────────────────────────────────────────────────────────

type DayGuide = { day: string; tip: string }

const WESTWARD_GUIDE: DayGuide[] = [
  {
    day: 'Day 1',
    tip: 'Try to stay awake until your destination\'s local bedtime. Short naps (under 20 minutes) are OK during the day, but avoid sleeping for long stretches.',
  },
  {
    day: 'Day 2',
    tip: 'Get morning sunlight at your destination. Bright morning light helps delay your body clock, which aligns with westward travel (phase delay).',
  },
  {
    day: 'Day 3',
    tip: 'Energy may still dip in the afternoon. Short walks in natural light and consistent meal times at local hours help reinforce your new schedule.',
  },
  {
    day: 'Day 4',
    tip: 'Sleep quality usually improves around now. Stick to consistent local sleep and wake times — regularity accelerates circadian adaptation.',
  },
  {
    day: 'Day 5',
    tip: 'Most people feel largely recovered by day 5. If you still feel off, evening bright-light exposure (before sunset) can help shift your clock a bit further.',
  },
]

const EASTWARD_GUIDE: DayGuide[] = [
  {
    day: 'Day 1',
    tip: 'Resist the urge to sleep very early. Try to stay up until at least 9–10 PM local time to begin advancing your body clock.',
  },
  {
    day: 'Day 2',
    tip: 'Morning light exposure is the most evidence-based strategy for eastward travel — it helps your clock advance to wake up earlier. Avoid bright light in the evening.',
  },
  {
    day: 'Day 3',
    tip: 'You may still wake early or feel fatigued in the afternoon. A short nap (max 20 min) before 3 PM local time can reduce fatigue without disrupting night sleep.',
  },
  {
    day: 'Day 4',
    tip: 'Maintain a consistent wake time even if you feel tired — waking at the same local hour is one of the strongest circadian cues for advancing your clock.',
  },
  {
    day: 'Day 5',
    tip: 'Many people feel substantially recovered by now. If early-morning waking (earlier than intended) persists, continuing morning light exposure and avoiding evening screens helps.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Direction badge
// ─────────────────────────────────────────────────────────────────────────────

function DirectionBadge({ direction }: { direction: JetlagDirection }) {
  if (direction === 'none') return null

  const label = direction === 'eastward' ? '→ Eastward' : '← Westward'
  const cls =
    direction === 'eastward'
      ? 'bg-amber-950/30 text-amber-300 border border-amber-900/40'
      : 'bg-neutral-800 text-neutral-300 border border-neutral-700'

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type FormState = {
  originOffset: number
  destinationOffset: number
}

const DEFAULT_FORM: FormState = {
  originOffset: 0,
  destinationOffset: 9,
}

export default function JetlagRecoveryCalculatorTool() {
  const { sendEvent } = useAnalyticsEvent()

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [hasCalculated, setHasCalculated] = useState(false)

  const result = calculateJetlag({
    originUtcOffsetHours: form.originOffset,
    destinationUtcOffsetHours: form.destinationOffset,
  })

  function handleChange(field: keyof FormState, value: number) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setHasCalculated(false)
  }

  function handleCalculate() {
    setHasCalculated(true)
    sendEvent('calculate')
  }

  const guide =
    result.direction === 'eastward'
      ? EASTWARD_GUIDE
      : result.direction === 'westward'
        ? WESTWARD_GUIDE
        : []

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="rounded-lg border border-neutral-800 bg-[#141414] p-6 space-y-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Your Journey
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Origin */}
          <div className="space-y-2">
            <label htmlFor="origin-offset" className="block text-sm font-medium text-neutral-300">
              Departure timezone
            </label>
            <select
              id="origin-offset"
              value={form.originOffset}
              onChange={(e) => handleChange('originOffset', Number(e.target.value))}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 focus:outline-none"
            >
              {UTC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <label
              htmlFor="destination-offset"
              className="block text-sm font-medium text-neutral-300"
            >
              Destination timezone
            </label>
            <select
              id="destination-offset"
              value={form.destinationOffset}
              onChange={(e) => handleChange('destinationOffset', Number(e.target.value))}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 focus:outline-none"
            >
              {UTC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="w-full rounded-lg bg-white text-black text-sm font-medium py-3 hover:bg-neutral-200 transition-colors"
        >
          Estimate Recovery Time
        </button>
      </div>

      {/* Result card */}
      {hasCalculated && (
        <div className="rounded-lg border border-neutral-800 bg-[#141414] p-6 space-y-4 animate-fade-in">
          {result.direction === 'none' ? (
            <p className="text-sm text-neutral-400">
              No time zone change detected — no jet lag expected.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Estimated recovery
                  </p>
                  <p className="text-5xl font-bold text-[#f59e0b] tabular-nums leading-none">
                    {result.estimatedRecoveryDays}
                    <span className="text-2xl font-semibold text-neutral-400 ml-2">
                      {result.estimatedRecoveryDays === 1 ? 'day' : 'days'}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 pt-1">
                  <DirectionBadge direction={result.direction} />
                  <p className="text-xs text-neutral-500">
                    {result.timezonesCrossed}{' '}
                    {result.timezonesCrossed === 1 ? 'time zone' : 'time zones'} crossed
                  </p>
                </div>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
                Based on approximate recovery rates from sleep medicine research: ~1 day per time
                zone for eastward travel, ~1 day per 1.5 time zones for westward travel.
                Individual results vary significantly.
              </p>

              {/* Day-by-day guide */}
              {guide.length > 0 && (
                <div className="border-t border-neutral-800 pt-4 space-y-3">
                  <p className="text-sm font-medium text-neutral-300">
                    General adaptation guide —{' '}
                    {result.direction === 'eastward' ? 'Eastward travel' : 'Westward travel'}
                  </p>
                  <ol className="space-y-3">
                    {guide.map((item) => (
                      <li key={item.day} className="flex gap-3">
                        <span className="shrink-0 w-14 text-xs font-semibold text-[#f59e0b] pt-0.5">
                          {item.day}
                        </span>
                        <span className="text-sm text-neutral-400 leading-relaxed">{item.tip}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    These are general tips based on circadian science principles. They are not a
                    personalised prescription. If you have a sleep disorder or mood disorder,
                    consult a doctor before making significant changes to your light exposure habits.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
