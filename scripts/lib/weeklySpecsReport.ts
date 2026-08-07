/**
 * weeklySpecsReport.ts
 *
 * Types and a deterministic section-builder for the weekly spec generation
 * results (Phase 17). The section is appended to the existing weekly report
 * after the title-experiment section.
 *
 * This module is intentionally dependency-free (no fs, no API calls) so it
 * can be unit-tested without any mocking.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeeklySpecsResult {
  /** Generated improvement spec texts (up to MAX_IMPROVEMENT_SPECS_PER_WEEK). */
  improvementSpecs: string[]
  /** Generated growth spec texts. */
  growthSpecs: string[]
  /** Generated tool research spec texts (up to MAX_TOOL_RESEARCH_SPECS_PER_WEEK). */
  toolResearchSpecs: string[]
  /** Generated new category spec text, or null when the AI said NONE or step failed. */
  newCategorySpec: string | null
  /** Generated programmatic SEO spec texts. */
  programmaticSeoSpecs: string[]
  /**
   * "N주째 대기 중" reminder strings for proposals that are already pending
   * from a previous week. Collected from all spec generators.
   */
  reminders: string[]
}

// ── Section builder ───────────────────────────────────────────────────────────

/**
 * Deterministically builds the `## Weekly Spec` report section from a
 * `WeeklySpecsResult`.
 *
 * Returns `null` when there is nothing to display (all arrays empty, no new
 * category spec, no reminders). The caller should skip appending in that case.
 *
 * New category proposals are rendered with a prominent separate heading
 * (`## 🆕 신규 카테고리 제안`) per the roadmap item 7 requirement that they
 * be shown "눈에 띄게" above other spec types.
 */
export function buildWeeklySpecsSection(result: WeeklySpecsResult): string | null {
  const hasContent =
    result.improvementSpecs.length > 0 ||
    result.growthSpecs.length > 0 ||
    result.toolResearchSpecs.length > 0 ||
    result.newCategorySpec !== null ||
    result.programmaticSeoSpecs.length > 0 ||
    result.reminders.length > 0

  if (!hasContent) return null

  const parts: string[] = []

  // ── New category: separate prominent heading (roadmap item 7) ───────────────
  if (result.newCategorySpec) {
    parts.push(`## 🆕 신규 카테고리 제안\n\n${result.newCategorySpec}`)
  }

  // ── Improvement specs ───────────────────────────────────────────────────────
  if (result.improvementSpecs.length > 0) {
    const body = result.improvementSpecs.join('\n\n---\n\n')
    parts.push(`## 개선 Spec (${result.improvementSpecs.length}건)\n\n${body}`)
  }

  // ── Growth specs ────────────────────────────────────────────────────────────
  if (result.growthSpecs.length > 0) {
    const body = result.growthSpecs.join('\n\n---\n\n')
    parts.push(`## 성장 Spec (${result.growthSpecs.length}건)\n\n${body}`)
  }

  // ── Tool research specs ─────────────────────────────────────────────────────
  if (result.toolResearchSpecs.length > 0) {
    const body = result.toolResearchSpecs.join('\n\n---\n\n')
    parts.push(`## 신규 툴 리서치 Spec (${result.toolResearchSpecs.length}건)\n\n${body}`)
  }

  // ── Programmatic SEO specs ──────────────────────────────────────────────────
  if (result.programmaticSeoSpecs.length > 0) {
    const body = result.programmaticSeoSpecs.join('\n\n---\n\n')
    parts.push(`## 프로그래매틱 SEO Spec (${result.programmaticSeoSpecs.length}건)\n\n${body}`)
  }

  // ── Reminders for already-pending proposals ─────────────────────────────────
  if (result.reminders.length > 0) {
    const reminderLines = result.reminders.map((r) => `- ${r}`).join('\n')
    parts.push(`## 대기 중인 이전 Spec\n\n${reminderLines}`)
  }

  return parts.join('\n\n')
}
