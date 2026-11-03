export interface CleanupCandidate {
  slug: string
  addedAt: string
  sessions: number
}

/**
 * Renders the cleanup-candidate block of the weekly report prompt.
 *
 * When every tool qualifies (e.g. while GA4 sessions are still near zero) a per-tool
 * list adds nothing but length — and the model echoes it back as a 16-row table, which
 * helped push the 2026-10-26 and 2026-11-02 reports past max_tokens. In that case the
 * block collapses to one line naming only tools that had any sessions.
 */
export function buildCleanupSection(candidates: CleanupCandidate[], totalTools: number): string {
  if (candidates.length === 0) {
    return '해당 없음 (현재 게시 90일 이상 + 최근 7일 세션 5 미만인 tool 없음)'
  }

  if (candidates.length >= totalTools) {
    const withSessions = candidates
      .filter((c) => c.sessions > 0)
      .map((c) => `${c.slug}(${c.sessions})`)
    return `전체 ${totalTools}개 tool이 모두 해당 — 표로 나열하지 말고 한 줄로 요약할 것. 세션이 1 이상인 tool: ${withSessions.join(', ') || '없음'}`
  }

  return candidates
    .map((c) => `- slug: ${c.slug}, addedAt: ${c.addedAt}, 최근7일 세션: ${c.sessions}`)
    .join('\n')
}
