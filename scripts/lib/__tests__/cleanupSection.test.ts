import { buildCleanupSection } from '../cleanupSection'

const candidates = [
  { slug: 'json-formatter', addedAt: '2026-07-03', sessions: 0 },
  { slug: 'temperament-quiz', addedAt: '2026-07-09', sessions: 3 },
]

describe('buildCleanupSection', () => {
  it('says there is nothing to clean up when there are no candidates', () => {
    expect(buildCleanupSection([], 16)).toMatch(/해당 없음/)
  })

  it('lists each candidate when only some tools qualify', () => {
    const section = buildCleanupSection(candidates, 16)
    expect(section).toContain('slug: json-formatter, addedAt: 2026-07-03, 최근7일 세션: 0')
    expect(section).toContain('slug: temperament-quiz, addedAt: 2026-07-09, 최근7일 세션: 3')
  })

  it('collapses to a one-line summary when every tool qualifies — the 16-row table helped push the report past max_tokens', () => {
    const section = buildCleanupSection(candidates, 2)
    expect(section.split('\n')).toHaveLength(1)
    expect(section).toMatch(/전체 2개 tool/)
    expect(section).toMatch(/temperament-quiz\(3\)/)
    expect(section).not.toMatch(/json-formatter/)
  })
})
