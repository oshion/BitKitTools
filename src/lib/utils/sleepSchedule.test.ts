import { calculateSleepSchedule } from './sleepSchedule'

describe('calculateSleepSchedule', () => {
  // ── Age range detection ───────────────────────────────────────────────────

  describe('newborn (0–2 months) — 5 naps', () => {
    it('produces 5 naps for a 1-month-old', () => {
      const result = calculateSleepSchedule({ ageMonths: 1, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(5)
    })

    it('first nap starts 60 min after wake-up', () => {
      const result = calculateSleepSchedule({ ageMonths: 1, wakeUpTime: '07:00' })
      expect(result.naps[0].start).toBe('08:00')
    })

    it('first nap ends 45 min after it starts', () => {
      const result = calculateSleepSchedule({ ageMonths: 1, wakeUpTime: '07:00' })
      expect(result.naps[0].end).toBe('08:45')
    })
  })

  describe('3–5 months — 4 naps', () => {
    it('produces 4 naps for a 4-month-old', () => {
      const result = calculateSleepSchedule({ ageMonths: 4, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(4)
    })

    it('first nap starts 90 min after wake-up', () => {
      const result = calculateSleepSchedule({ ageMonths: 4, wakeUpTime: '07:00' })
      expect(result.naps[0].start).toBe('08:30')
    })

    it('each nap is 60 minutes long', () => {
      const result = calculateSleepSchedule({ ageMonths: 4, wakeUpTime: '07:00' })
      for (const nap of result.naps) {
        const [sh, sm] = nap.start.split(':').map(Number)
        const [eh, em] = nap.end.split(':').map(Number)
        const duration = (eh * 60 + em) - (sh * 60 + sm)
        expect(duration).toBe(60)
      }
    })
  })

  describe('6–8 months — 3 naps', () => {
    it('produces 3 naps for a 7-month-old', () => {
      const result = calculateSleepSchedule({ ageMonths: 7, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(3)
    })

    it('first nap starts 2 hours after wake-up', () => {
      const result = calculateSleepSchedule({ ageMonths: 7, wakeUpTime: '07:00' })
      expect(result.naps[0].start).toBe('09:00')
    })
  })

  describe('9–12 months — 2 naps', () => {
    it('produces 2 naps for a 10-month-old', () => {
      const result = calculateSleepSchedule({ ageMonths: 10, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(2)
    })

    it('each nap is 90 minutes long', () => {
      const result = calculateSleepSchedule({ ageMonths: 10, wakeUpTime: '07:00' })
      for (const nap of result.naps) {
        const [sh, sm] = nap.start.split(':').map(Number)
        const [eh, em] = nap.end.split(':').map(Number)
        const duration = (eh * 60 + em) - (sh * 60 + sm)
        expect(duration).toBe(90)
      }
    })

    it('bedtime is 3 hr after last nap ends', () => {
      const result = calculateSleepSchedule({ ageMonths: 10, wakeUpTime: '07:00' })
      const lastNap = result.naps[result.naps.length - 1]
      const [lh, lm] = lastNap.end.split(':').map(Number)
      const [bh, bm] = result.bedtime.split(':').map(Number)
      const gap = (bh * 60 + bm) - (lh * 60 + lm)
      expect(gap).toBe(180)
    })
  })

  describe('13–17 months — 1 nap (transitioning)', () => {
    it('produces 1 nap for a 15-month-old', () => {
      const result = calculateSleepSchedule({ ageMonths: 15, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(1)
    })
  })

  describe('18–24 months — 1 nap', () => {
    it('produces 1 nap for a 20-month-old', () => {
      const result = calculateSleepSchedule({ ageMonths: 20, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(1)
    })

    it('nap lasts 90 minutes', () => {
      const result = calculateSleepSchedule({ ageMonths: 20, wakeUpTime: '07:00' })
      const nap = result.naps[0]
      const [sh, sm] = nap.start.split(':').map(Number)
      const [eh, em] = nap.end.split(':').map(Number)
      const duration = eh * 60 + em - (sh * 60 + sm)
      expect(duration).toBe(90)
    })

    it('bedtime is 4.5 hr after last nap ends', () => {
      const result = calculateSleepSchedule({ ageMonths: 20, wakeUpTime: '07:00' })
      const lastNap = result.naps[result.naps.length - 1]
      const [lh, lm] = lastNap.end.split(':').map(Number)
      const [bh, bm] = result.bedtime.split(':').map(Number)
      const gap = bh * 60 + bm - (lh * 60 + lm)
      expect(gap).toBe(270)
    })
  })

  // ── Different wake-up times ───────────────────────────────────────────────

  describe('different wake-up times', () => {
    it('shifts everything forward when wake-up is later', () => {
      const early = calculateSleepSchedule({ ageMonths: 6, wakeUpTime: '06:00' })
      const late = calculateSleepSchedule({ ageMonths: 6, wakeUpTime: '08:00' })

      const [eh, em] = early.naps[0].start.split(':').map(Number)
      const [lh, lm] = late.naps[0].start.split(':').map(Number)
      const diff = (lh * 60 + lm) - (eh * 60 + em)
      expect(diff).toBe(120) // 2 hours later
    })

    it('works with an early 05:00 wake-up', () => {
      const result = calculateSleepSchedule({ ageMonths: 9, wakeUpTime: '05:00' })
      expect(result.naps).toHaveLength(2)
      expect(result.naps[0].start).toBe('08:00') // 3 hr wake window for 9–12m
    })
  })

  // ── lastNapEndTime ────────────────────────────────────────────────────────

  describe('lastNapEndTime provided', () => {
    it('skips naps already completed and schedules only remaining ones', () => {
      // 10-month-old: 2 naps, 3hr wake window, 90min nap duration
      // If last nap ended at 14:00 and wake-up was 07:00:
      // napCycle = 180 + 90 = 270 min; minutesElapsed = 420; napsAlreadyDone ≈ 1
      // napsRemaining = 1 → only 1 nap scheduled from 14:00
      const result = calculateSleepSchedule({
        ageMonths: 10,
        wakeUpTime: '07:00',
        lastNapEndTime: '14:00',
      })
      expect(result.naps).toHaveLength(1)
      // Next nap starts 3 hr after 14:00 = 17:00
      expect(result.naps[0].start).toBe('17:00')
    })

    it('returns empty naps when all naps already done', () => {
      // 9-month-old: 2 naps; if lastNapEnd is very late, napsAlreadyDone >= napsPerDay
      const result = calculateSleepSchedule({
        ageMonths: 9,
        wakeUpTime: '07:00',
        lastNapEndTime: '18:00',
      })
      // napsAlreadyDone will be >= 2, so napsRemaining = 0
      expect(result.naps).toHaveLength(0)
    })

    it('falls back to normal schedule when lastNapEndTime is invalid', () => {
      const result = calculateSleepSchedule({
        ageMonths: 12,
        wakeUpTime: '07:00',
        lastNapEndTime: 'invalid',
      })
      // Falls back to full 2-nap schedule
      expect(result.naps).toHaveLength(2)
    })

    it('falls back to normal schedule when lastNapEndTime is empty string', () => {
      const result = calculateSleepSchedule({
        ageMonths: 12,
        wakeUpTime: '07:00',
        lastNapEndTime: '',
      })
      expect(result.naps).toHaveLength(2)
    })
  })

  // ── Return metadata ───────────────────────────────────────────────────────

  describe('return metadata', () => {
    it('includes ageRangeLabel', () => {
      const result = calculateSleepSchedule({ ageMonths: 6, wakeUpTime: '07:00' })
      expect(result.ageRangeLabel.en).toBeTruthy()
      expect(result.ageRangeLabel.ko).toBeTruthy()
    })

    it('includes summary', () => {
      const result = calculateSleepSchedule({ ageMonths: 6, wakeUpTime: '07:00' })
      expect(result.summary.en).toBeTruthy()
      expect(result.summary.ko).toBeTruthy()
    })

    it('includes bedtime as HH:MM', () => {
      const result = calculateSleepSchedule({ ageMonths: 6, wakeUpTime: '07:00' })
      expect(result.bedtime).toMatch(/^\d{2}:\d{2}$/)
    })

    it('includes nap start/end as HH:MM', () => {
      const result = calculateSleepSchedule({ ageMonths: 6, wakeUpTime: '07:00' })
      for (const nap of result.naps) {
        expect(nap.start).toMatch(/^\d{2}:\d{2}$/)
        expect(nap.end).toMatch(/^\d{2}:\d{2}$/)
      }
    })
  })

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles exactly 0 months (newborn)', () => {
      const result = calculateSleepSchedule({ ageMonths: 0, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(5)
    })

    it('handles exactly 24 months', () => {
      const result = calculateSleepSchedule({ ageMonths: 24, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(1)
    })

    it('handles ages beyond 24 months (falls back to last range)', () => {
      const result = calculateSleepSchedule({ ageMonths: 30, wakeUpTime: '07:00' })
      expect(result.naps).toHaveLength(1)
    })

    it('nap times are sequential (each nap starts after previous ends)', () => {
      const result = calculateSleepSchedule({ ageMonths: 4, wakeUpTime: '07:00' })
      for (let i = 1; i < result.naps.length; i++) {
        const prevEnd = result.naps[i - 1].end.split(':').map(Number)
        const curStart = result.naps[i].start.split(':').map(Number)
        const prevEndMin = prevEnd[0] * 60 + prevEnd[1]
        const curStartMin = curStart[0] * 60 + curStart[1]
        expect(curStartMin).toBeGreaterThan(prevEndMin)
      }
    })
  })
})
