import { getGuidelineForAge } from '@/lib/config/sleepGuidelines'

export type SleepInput = {
  /** Age in completed months (0–24) */
  ageMonths: number
  /** Wake-up time in HH:MM 24-hour format (e.g. "07:00") */
  wakeUpTime: string
  /** Optional: time the last nap ended, in HH:MM 24-hour format */
  lastNapEndTime?: string
}

export type NapSlot = {
  start: string // HH:MM
  end: string // HH:MM
}

export type SleepScheduleResult = {
  naps: NapSlot[]
  bedtime: string // HH:MM
  /** Human-readable label for the matched age range */
  ageRangeLabel: { en: string; ko: string }
  /** Brief pattern summary for the age range */
  summary: { en: string; ko: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parses "HH:MM" to total minutes since midnight.
 * Returns NaN if the format is invalid.
 */
function parseTime(hhmm: string): number {
  const parts = hhmm.split(':')
  if (parts.length !== 2) return NaN
  const p0 = parts[0]
  const p1 = parts[1]
  if (p0 === undefined || p1 === undefined) return NaN
  const h = parseInt(p0, 10)
  const m = parseInt(p1, 10)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return NaN
  return h * 60 + m
}

/**
 * Formats total minutes since midnight back to "HH:MM".
 * Wraps around midnight (e.g. 1500 min → "01:00").
 */
function formatTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Calculates the baby's recommended sleep schedule for the day.
 *
 * Algorithm:
 * 1. Determine the age-range guideline.
 * 2. If `lastNapEndTime` is provided, start from that nap's wake window instead.
 * 3. Schedule naps by adding wake windows and nap durations sequentially.
 * 4. Bedtime = end of last nap + bedtimeAfterLastNapMinutes.
 */
export function calculateSleepSchedule(input: SleepInput): SleepScheduleResult {
  const { ageMonths, wakeUpTime, lastNapEndTime } = input

  if (parseTime(wakeUpTime) !== parseTime(wakeUpTime)) {
    // NaN guard — return a sensible empty result
    return {
      naps: [],
      bedtime: '20:00',
      ageRangeLabel: { en: 'Unknown', ko: '알 수 없음' },
      summary: { en: '', ko: '' },
    }
  }

  const guideline = getGuidelineForAge(ageMonths)
  const wakeUpMinutes = parseTime(wakeUpTime)

  const naps: NapSlot[] = []

  if (lastNapEndTime !== undefined && lastNapEndTime !== '') {
    // ── Resume from last known nap end ──────────────────────────────────────
    const lastNapEnd = parseTime(lastNapEndTime)
    if (!isNaN(lastNapEnd)) {
      // Determine how many naps remain in the day
      // Approximate: compute how many naps have already occurred based on time
      const minutesElapsed = lastNapEnd - wakeUpMinutes
      const napCycle = guideline.wakeWindowMinutes + guideline.napDurationMinutes
      const napsAlreadyDone = Math.max(0, Math.floor(minutesElapsed / napCycle))
      const napsRemaining = Math.max(0, guideline.napsPerDay - napsAlreadyDone)

      let cursor = lastNapEnd
      for (let i = 0; i < napsRemaining; i++) {
        const napStart = cursor + guideline.wakeWindowMinutes
        const napEnd = napStart + guideline.napDurationMinutes
        naps.push({ start: formatTime(napStart), end: formatTime(napEnd) })
        cursor = napEnd
      }

      const bedtime = cursor + guideline.bedtimeAfterLastNapMinutes
      return {
        naps,
        bedtime: formatTime(bedtime),
        ageRangeLabel: guideline.label,
        summary: guideline.summary,
      }
    }
  }

  // ── Schedule from morning wake-up ─────────────────────────────────────────
  let cursor = wakeUpMinutes
  for (let i = 0; i < guideline.napsPerDay; i++) {
    const napStart = cursor + guideline.wakeWindowMinutes
    const napEnd = napStart + guideline.napDurationMinutes
    naps.push({ start: formatTime(napStart), end: formatTime(napEnd) })
    cursor = napEnd
  }

  const bedtime = cursor + guideline.bedtimeAfterLastNapMinutes
  return {
    naps,
    bedtime: formatTime(bedtime),
    ageRangeLabel: guideline.label,
    summary: guideline.summary,
  }
}
