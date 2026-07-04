/**
 * Baby Sleep Guidelines by Age Range
 *
 * Based on general consensus from:
 * - American Academy of Sleep Medicine (AASM) 2016 recommendations
 * - National Sleep Foundation (NSF) sleep duration recommendations
 * - Weissbluth, M. (2015). Healthy Sleep Habits, Happy Child.
 * - Ferber, R. (2006). Solve Your Child's Sleep Problems.
 *
 * Wake window = time between sleep periods that baby can comfortably stay awake.
 * These are general population averages; individual variation is significant.
 */

export type AgeRange = {
  /** Label for display (e.g. "0–3 months") */
  label: { en: string; ko: string }
  /** Minimum age in months (inclusive) */
  minMonths: number
  /** Maximum age in months (inclusive) */
  maxMonths: number
  /** Number of naps per day */
  napsPerDay: number
  /** Duration of each nap in minutes */
  napDurationMinutes: number
  /** Wake window length in minutes (time awake between naps/bedtime) */
  wakeWindowMinutes: number
  /** Recommended total daytime sleep in minutes */
  totalDaytimeSleepMinutes: number
  /** Recommended bedtime offset in minutes after last nap ends */
  bedtimeAfterLastNapMinutes: number
  /** Brief pattern summary for display */
  summary: { en: string; ko: string }
}

export const sleepGuidelines: AgeRange[] = [
  {
    label: { en: '0–3 months (Newborn)', ko: '0–3개월 (신생아)' },
    minMonths: 0,
    maxMonths: 2,
    napsPerDay: 5,
    napDurationMinutes: 45,
    wakeWindowMinutes: 60,
    totalDaytimeSleepMinutes: 5 * 45,
    bedtimeAfterLastNapMinutes: 90,
    summary: {
      en: '5 naps · ~45 min each · wake window ~1 hr · bedtime ~90 min after last nap',
      ko: '낮잠 5회 · 각 약 45분 · 깨어있는 시간 약 1시간 · 막 낮잠 후 약 90분 뒤 취침',
    },
  },
  {
    label: { en: '3–5 months', ko: '3–5개월' },
    minMonths: 3,
    maxMonths: 5,
    napsPerDay: 4,
    napDurationMinutes: 60,
    wakeWindowMinutes: 90,
    totalDaytimeSleepMinutes: 4 * 60,
    bedtimeAfterLastNapMinutes: 120,
    summary: {
      en: '4 naps · ~1 hr each · wake window ~1.5 hr · bedtime ~2 hr after last nap',
      ko: '낮잠 4회 · 각 약 1시간 · 깨어있는 시간 약 1.5시간 · 마지막 낮잠 후 약 2시간 뒤 취침',
    },
  },
  {
    label: { en: '6–8 months', ko: '6–8개월' },
    minMonths: 6,
    maxMonths: 8,
    napsPerDay: 3,
    napDurationMinutes: 75,
    wakeWindowMinutes: 120,
    totalDaytimeSleepMinutes: 3 * 75,
    bedtimeAfterLastNapMinutes: 150,
    summary: {
      en: '3 naps · ~1.25 hr each · wake window ~2 hr · bedtime ~2.5 hr after last nap',
      ko: '낮잠 3회 · 각 약 1.25시간 · 깨어있는 시간 약 2시간 · 마지막 낮잠 후 약 2.5시간 뒤 취침',
    },
  },
  {
    label: { en: '9–12 months', ko: '9–12개월' },
    minMonths: 9,
    maxMonths: 12,
    napsPerDay: 2,
    napDurationMinutes: 90,
    wakeWindowMinutes: 180,
    totalDaytimeSleepMinutes: 2 * 90,
    bedtimeAfterLastNapMinutes: 180,
    summary: {
      en: '2 naps · ~1.5 hr each · wake window ~3 hr · bedtime ~3 hr after last nap',
      ko: '낮잠 2회 · 각 약 1.5시간 · 깨어있는 시간 약 3시간 · 마지막 낮잠 후 약 3시간 뒤 취침',
    },
  },
  {
    label: { en: '13–17 months', ko: '13–17개월' },
    minMonths: 13,
    maxMonths: 17,
    napsPerDay: 1,
    napDurationMinutes: 90,
    wakeWindowMinutes: 210,
    totalDaytimeSleepMinutes: 90,
    bedtimeAfterLastNapMinutes: 240,
    summary: {
      en: '1–2 naps (transitioning to 1) · ~1.5 hr · wake window ~3.5 hr · bedtime ~4 hr after last nap',
      ko: '낮잠 1–2회 (1회로 전환 중) · 약 1.5시간 · 깨어있는 시간 약 3.5시간 · 마지막 낮잠 후 약 4시간 뒤 취침',
    },
  },
  {
    label: { en: '18–24 months', ko: '18–24개월' },
    minMonths: 18,
    maxMonths: 24,
    napsPerDay: 1,
    napDurationMinutes: 90,
    wakeWindowMinutes: 240,
    totalDaytimeSleepMinutes: 90,
    bedtimeAfterLastNapMinutes: 270,
    summary: {
      en: '1 nap · ~1.5 hr · wake window ~4 hr · bedtime ~4.5 hr after last nap',
      ko: '낮잠 1회 · 약 1.5시간 · 깨어있는 시간 약 4시간 · 마지막 낮잠 후 약 4.5시간 뒤 취침',
    },
  },
]

/**
 * Returns the appropriate age range guideline for the given age in months.
 * Returns the last range for ages beyond 24 months.
 */
export function getGuidelineForAge(ageMonths: number): AgeRange {
  for (const range of sleepGuidelines) {
    if (ageMonths >= range.minMonths && ageMonths <= range.maxMonths) {
      return range
    }
  }
  // Default to last range for ages beyond our data
  // sleepGuidelines is a non-empty constant array defined in this file
  return sleepGuidelines[sleepGuidelines.length - 1] as AgeRange
}
