/**
 * @jest-environment node
 */

import { buildWeeklySpecsSection, type WeeklySpecsResult } from '../weeklySpecsReport'
import { safeRunStep } from '../../generate-weekly-specs'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function emptyResult(): WeeklySpecsResult {
  return {
    improvementSpecs: [],
    growthSpecs: [],
    toolResearchSpecs: [],
    newCategorySpec: null,
    programmaticSeoSpecs: [],
    reminders: [],
  }
}

// ── buildWeeklySpecsSection ───────────────────────────────────────────────────

describe('buildWeeklySpecsSection', () => {
  it('returns null when all fields are empty / null', () => {
    const result = buildWeeklySpecsSection(emptyResult())
    expect(result).toBeNull()
  })

  it('returns null when arrays are empty even if called multiple times', () => {
    expect(buildWeeklySpecsSection(emptyResult())).toBeNull()
    expect(buildWeeklySpecsSection(emptyResult())).toBeNull()
  })

  it('returns a non-null string when improvementSpecs is non-empty', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      improvementSpecs: ['개선 spec 내용'],
    })
    expect(result).not.toBeNull()
    expect(result).toContain('개선 Spec')
    expect(result).toContain('개선 spec 내용')
  })

  it('returns a non-null string when growthSpecs is non-empty', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      growthSpecs: ['성장 spec 내용'],
    })
    expect(result).not.toBeNull()
    expect(result).toContain('성장 Spec')
    expect(result).toContain('성장 spec 내용')
  })

  it('returns a non-null string when toolResearchSpecs is non-empty', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      toolResearchSpecs: ['툴 리서치 내용'],
    })
    expect(result).not.toBeNull()
    expect(result).toContain('신규 툴 리서치 Spec')
  })

  it('returns a non-null string when programmaticSeoSpecs is non-empty', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      programmaticSeoSpecs: ['프로그래매틱 내용'],
    })
    expect(result).not.toBeNull()
    expect(result).toContain('프로그래매틱 SEO Spec')
  })

  it('returns a non-null string when reminders is non-empty', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      reminders: ['개선 spec 대기 중: /beer/bac-calculator/ (3주째 pending)'],
    })
    expect(result).not.toBeNull()
    expect(result).toContain('대기 중인 이전 Spec')
    expect(result).toContain('/beer/bac-calculator/')
  })

  it('renders reminders as a bullet list', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      reminders: ['reminder A', 'reminder B'],
    })
    expect(result).toContain('- reminder A')
    expect(result).toContain('- reminder B')
  })

  // ── New category heading requirement ────────────────────────────────────────

  it('gives new category spec a separate prominent heading with 🆕 emoji', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      newCategorySpec: '신규 카테고리 제안 내용',
    })
    expect(result).not.toBeNull()
    expect(result).toContain('## 🆕 신규 카테고리 제안')
    expect(result).toContain('신규 카테고리 제안 내용')
  })

  it('places new category heading BEFORE other spec sections', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      newCategorySpec: '신규 카테고리 내용',
      improvementSpecs: ['개선 내용'],
    })
    expect(result).not.toBeNull()
    const categoryIdx = result!.indexOf('## 🆕 신규 카테고리 제안')
    const improvementIdx = result!.indexOf('## 개선 Spec')
    expect(categoryIdx).toBeLessThan(improvementIdx)
  })

  it('does NOT show new category section when newCategorySpec is null', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      newCategorySpec: null,
      improvementSpecs: ['개선 내용'],
    })
    expect(result).not.toContain('🆕')
    expect(result).not.toContain('신규 카테고리')
  })

  // ── Count labels ─────────────────────────────────────────────────────────────

  it('shows count in improvement spec heading', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      improvementSpecs: ['spec 1', 'spec 2'],
    })
    expect(result).toContain('(2건)')
  })

  it('shows count in growth spec heading', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      growthSpecs: ['growth spec'],
    })
    expect(result).toContain('(1건)')
  })

  // ── Separator between multiple specs of the same type ───────────────────────

  it('separates multiple improvement specs with a horizontal rule', () => {
    const result = buildWeeklySpecsSection({
      ...emptyResult(),
      improvementSpecs: ['spec A', 'spec B'],
    })
    expect(result).toContain('---')
    expect(result).toContain('spec A')
    expect(result).toContain('spec B')
  })

  // ── All sections present ──────────────────────────────────────────────────────

  it('includes all sections when all fields are populated', () => {
    const result = buildWeeklySpecsSection({
      improvementSpecs: ['개선 내용'],
      growthSpecs: ['성장 내용'],
      toolResearchSpecs: ['리서치 내용'],
      newCategorySpec: '카테고리 내용',
      programmaticSeoSpecs: ['SEO 내용'],
      reminders: ['reminder'],
    })
    expect(result).toContain('## 🆕 신규 카테고리 제안')
    expect(result).toContain('## 개선 Spec')
    expect(result).toContain('## 성장 Spec')
    expect(result).toContain('## 신규 툴 리서치 Spec')
    expect(result).toContain('## 프로그래매틱 SEO Spec')
    expect(result).toContain('## 대기 중인 이전 Spec')
  })
})

// ── safeRunStep ───────────────────────────────────────────────────────────────

describe('safeRunStep', () => {
  it('returns the resolved value when the step succeeds', async () => {
    const result = await safeRunStep('success-step', async () => 42)
    expect(result).toBe(42)
  })

  it('returns undefined (not throwing) when the step throws synchronously', async () => {
    const result = await safeRunStep('sync-throw-step', async () => {
      throw new Error('simulated synchronous error')
    })
    expect(result).toBeUndefined()
  })

  it('returns undefined (not throwing) when the step rejects', async () => {
    const result = await safeRunStep('reject-step', () => Promise.reject(new Error('rejected')))
    expect(result).toBeUndefined()
  })

  it('does not propagate the error (resolves, never rejects)', async () => {
    await expect(
      safeRunStep('no-propagate-step', async () => {
        throw new Error('should not propagate')
      })
    ).resolves.toBeUndefined()
  })

  it('handles a step that returns a string', async () => {
    const result = await safeRunStep('string-step', async () => 'hello')
    expect(result).toBe('hello')
  })

  it('handles a step that returns an object', async () => {
    const obj = { specs: ['a', 'b'], reminders: [] }
    const result = await safeRunStep('object-step', async () => obj)
    expect(result).toStrictEqual(obj)
  })

  it('successive calls are independent — failure in one does not affect another', async () => {
    // This verifies the core isolation guarantee of the orchestration script:
    // each step being wrapped independently means a failure in one does not
    // prevent the next from running.
    const failingStep = safeRunStep('fail', async () => {
      throw new Error('step failure')
    })
    const succeedingStep = safeRunStep('succeed', async () => 'ok')

    const [failResult, succeedResult] = await Promise.all([failingStep, succeedingStep])
    expect(failResult).toBeUndefined()
    expect(succeedResult).toBe('ok')
  })

  it('logs the step name and error to console.error on failure', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await safeRunStep('logged-step', async () => {
      throw new Error('loggable error')
    })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('logged-step'),
      expect.any(Error)
    )
    spy.mockRestore()
  })
})
