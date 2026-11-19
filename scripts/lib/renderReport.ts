import type { CleanupCandidate } from './cleanupSection'
import { REPORT_SECTIONS, type RejectedClaim, type ReportClaim, type ReportSectionKey } from './reportClaims'
import type { ReportFact } from './reportFacts'

export interface RenderReportInput {
  periodStart: string
  periodEnd: string
  status: 'analyzed' | 'facts-only'
  facts: ReportFact[]
  accepted: ReportClaim[]
  rejected: RejectedClaim[]
  cleanupCandidates: CleanupCandidate[]
  /** Sections already written by code, such as performance warnings and title experiments */
  appendSections: string[]
}

const MAX_PAGE_FACTS = 10

function factLine(fact: ReportFact): string {
  return `- ${fact.text}${fact.sample === 'small' ? ' _(소표본)_' : ''}`
}

function factsSection(facts: ReportFact[]): string {
  const withPrefix = (prefix: string) => facts.filter((fact) => fact.id.startsWith(prefix))
  const groups: Array<[string, ReportFact[]]> = [
    ['핵심 지표', [...withPrefix('totals.'), ...withPrefix('sessions.'), ...withPrefix('audit.')]],
    ['주요 페이지', withPrefix('page:').slice(0, MAX_PAGE_FACTS)],
    ['순위 변동', withPrefix('rank:')],
    ['이탈률', withPrefix('bounce:')],
    ['입력 참여', withPrefix('engagement:')],
    ['Clarity 신호', withPrefix('clarity:')],
    ['Lighthouse', withPrefix('lighthouse:')],
  ]
  const body = groups
    .filter(([, items]) => items.length > 0)
    .map(([title, items]) => `### ${title}\n\n${items.map(factLine).join('\n')}`)
    .join('\n\n')
  return `## 검증된 사실\n\n코드가 원본 데이터에서 계산한 값입니다.\n\n${body}`
}

function claimLine(claim: ReportClaim): string {
  const prefix = claim.kind === 'hypothesis' ? '가설: ' : claim.kind === 'recommendation' ? '제안: ' : ''
  return `- ${prefix}${claim.text}`
}

function analysisSection(claims: ReportClaim[]): string | null {
  const body = (Object.keys(REPORT_SECTIONS) as ReportSectionKey[])
    .map((key) => {
      const items = claims.filter((claim) => claim.section === key)
      return items.length > 0 ? `### ${REPORT_SECTIONS[key]}\n\n${items.map(claimLine).join('\n')}` : null
    })
    .filter((section): section is string => section !== null)
    .join('\n\n')
  return body ? `## 분석\n\n검증을 통과한 AI 해석입니다. 가설은 확인되지 않은 추정입니다.\n\n${body}` : null
}

function cleanupSection(candidates: CleanupCandidate[]): string {
  if (candidates.length === 0) return '## 정리 후보\n\n현재 해당 없음'
  const rows = candidates.map((c) => `| ${c.slug} | ${c.addedAt} | ${c.sessions} |`).join('\n')
  return `## 정리 후보\n\n| slug | 게시일 | 최근 7일 세션 |\n|---|---|---|\n${rows}`
}

function rejectedSection(rejected: RejectedClaim[]): string | null {
  if (rejected.length === 0) return null
  const lines = rejected.map(({ claim, rule, reason }) => `- ${rule} ${reason}: ${claim.text}`).join('\n')
  return `## 제거된 주장 (${rejected.length}건)\n\n검증을 통과하지 못해 분석에서 뺀 AI 문장입니다. 사실로 쓰지 마세요.\n\n${lines}`
}

export function renderReport(input: RenderReportInput): string {
  const notice =
    input.status === 'facts-only'
      ? '> ⚠️ 이번 주는 AI 분석을 생성하지 못해 코드가 계산한 사실만 담았습니다.'
      : null
  return [
    `# BitKitTools 주간 SEO/콘텐츠 리포트 (${input.periodStart} ~ ${input.periodEnd})`,
    notice,
    factsSection(input.facts),
    analysisSection(input.accepted),
    cleanupSection(input.cleanupCandidates),
    ...input.appendSections,
    rejectedSection(input.rejected),
  ]
    .filter((part): part is string => part !== null)
    .join('\n\n')
}
