/**
 * History block for spec prompts. data/history.md holds older AI summaries, so specs may use
 * it to avoid repeating work but not as evidence about the current state of a page. An
 * unverified "button defect" spread into three specs this way (2026-11-16 report).
 */
export function buildSpecHistorySection(historyMd: string): string {
  if (!historyMd.trim()) return '## 과거 이력\n\n(아직 이력 없음)'
  return `## 과거 이력 (이미 시도한 일과 결정을 확인하는 용도)

아래 기록은 현황의 근거가 아닙니다. 현황은 이 프롬프트의 근거 수치만 사용하세요.
페이지 코드와 화면 요소는 제공되지 않았으므로 버튼·링크 결함을 추정하지 마세요.

${historyMd}`
}
