/**
 * Code-computed facts for the weekly report. The model may cite these but cannot change
 * them (docs/report-quality-pipeline.md).
 */

import type { ProcessedDay } from '../process-analytics'
import type { WeeklyReportData } from './aggregateWeeklyReport'
import type { PageLighthouseScore } from './lighthouseThreshold'

export type SampleGrade = 'usable' | 'small'
export type FactTag = 'url-level' | 'concentrated'

export interface ReportFact {
  id: string
  /** Sentence printed in the report as is */
  text: string
  /** Numbers a claim citing this fact may use */
  values: number[]
  /** Paths and queries this fact is about */
  subjects: string[]
  sample: SampleGrade
  tags?: FactTag[]
}

export interface ReportFactsInput {
  weekly: WeeklyReportData
  days: ProcessedDay[]
  previousWeek?: { organicClicks: number; organicSessions: number }
  removedAuditSessions: number
  lighthouse: PageLighthouseScore[]
  cleanupCount: number
  intents: Record<string, string>
}

const MIN_USABLE_CLICKS = 10
const MIN_USABLE_IMPRESSIONS = 100
const MIN_USABLE_SESSIONS = 30
/** A day holding at least this share of sessions makes the weekly number a spike, not a trend */
const CONCENTRATION_SHARE = 0.5
const MAX_QUERY_FACTS = 30

/** Pages audited by scripts/collect-lighthouse.ts each Monday */
const AUDITED_PATHS = new Set([
  '/',
  '/developer/json-formatter/',
  '/travel/flight-delay-compensation/',
  '/beer/bac-calculator/',
  '/baby/growth-percentile/',
])
/** PR #54 stopped audits from loading analytics; earlier Monday audits recorded a session */
const AUDIT_EXCLUSION_DEPLOYED = '2026-11-19'

const round1 = (value: number): number => Math.round(value * 10) / 10

function isMonday(date: string): boolean {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay() === 1
}

/** Drops the one fake session each audited page received on pre-fix Monday audit runs. */
export function removeAuditSessions(days: ProcessedDay[]): { days: ProcessedDay[]; removedSessions: number } {
  let removedSessions = 0
  const corrected = days.map((day) => {
    if (!isMonday(day.date) || day.date >= AUDIT_EXCLUSION_DEPLOYED) return day
    return {
      ...day,
      pages: day.pages.map((page) => {
        if (!AUDITED_PATHS.has(page.path) || page.sessions <= 0) return page
        removedSessions += 1
        return { ...page, sessions: page.sessions - 1 }
      }),
    }
  })
  return { days: corrected, removedSessions }
}

/** Pages with at least half of the week's sessions on a single day. */
export function findConcentratedPages(days: ProcessedDay[]): Set<string> {
  const totals = new Map<string, { sessions: number; peak: number }>()
  for (const day of days) {
    for (const page of day.pages) {
      if (page.sessions <= 0) continue
      const entry = totals.get(page.path) ?? { sessions: 0, peak: 0 }
      entry.sessions += page.sessions
      entry.peak = Math.max(entry.peak, page.sessions)
      totals.set(page.path, entry)
    }
  }
  const result = new Set<string>()
  for (const [path, { sessions, peak }] of totals) {
    if (peak / sessions >= CONCENTRATION_SHARE) result.add(path)
  }
  return result
}

function changeText(current: number, previous: number | undefined): { text: string; values: number[] } {
  if (previous === undefined) return { text: '전주 데이터 없음', values: [] }
  if (previous === 0) return { text: '전주 0', values: [0] }
  const percent = round1(((current - previous) / previous) * 100)
  const sign = percent >= 0 ? '+' : ''
  return { text: `전주 ${previous}, ${sign}${percent}%`, values: [previous, Math.abs(percent)] }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

function totalFacts(input: ReportFactsInput): ReportFact[] {
  const { totals } = input.weekly
  const clicks = changeText(totals.clicks, input.previousWeek?.organicClicks)
  const sessions = changeText(totals.sessions, input.previousWeek?.organicSessions)
  return [
    {
      id: 'totals.clicks',
      text: `검색 클릭 ${totals.clicks}건 (${clicks.text})`,
      values: [totals.clicks, ...clicks.values],
      subjects: [],
      sample: totals.clicks < MIN_USABLE_CLICKS ? 'small' : 'usable',
    },
    {
      id: 'totals.impressions',
      text: `검색 노출 ${totals.impressions}회`,
      values: [totals.impressions],
      subjects: [],
      sample: totals.impressions < MIN_USABLE_IMPRESSIONS ? 'small' : 'usable',
    },
    {
      id: 'totals.sessions',
      text: `페이지별 세션 합계 ${totals.sessions}건 (${sessions.text}, 한 방문자가 여러 페이지에서 중복 집계될 수 있음)`,
      values: [totals.sessions, ...sessions.values],
      subjects: [],
      sample: totals.sessions < MIN_USABLE_SESSIONS ? 'small' : 'usable',
    },
  ]
}

function sessionShapeFacts(input: ReportFactsInput): ReportFact[] {
  const facts: ReportFact[] = []
  const total = input.days.reduce((sum, day) => sum + day.pages.reduce((s, p) => s + p.sessions, 0), 0)
  if (total > 0) {
    let peakDate = ''
    let peakSessions = -1
    for (const day of input.days) {
      const sessions = day.pages.reduce((sum, p) => sum + p.sessions, 0)
      if (sessions > peakSessions) {
        peakDate = day.date
        peakSessions = sessions
      }
    }
    const share = peakSessions / total
    const percent = Math.round(share * 100)
    facts.push({
      id: 'sessions.peakDay',
      text: `세션이 가장 많은 날은 ${peakDate}로, 전체의 ${percent}%(${peakSessions}/${total}건)`,
      values: [percent, peakSessions, total],
      subjects: [],
      sample: total < MIN_USABLE_SESSIONS ? 'small' : 'usable',
      tags: share >= CONCENTRATION_SHARE ? ['concentrated'] : undefined,
    })
  }
  if (input.removedAuditSessions > 0) {
    facts.push({
      id: 'audit.removedSessions',
      text: `Lighthouse 측정 방문으로 확인된 세션 ${input.removedAuditSessions}건을 집계에서 제외`,
      values: [input.removedAuditSessions],
      subjects: [],
      sample: 'usable',
    })
  }
  return facts
}

function pageFacts(days: ProcessedDay[]): ReportFact[] {
  const pages = new Map<string, { clicks: number; impressions: number; weighted: number; sessions: number }>()
  for (const day of days) {
    for (const page of day.pages) {
      const entry = pages.get(page.path) ?? { clicks: 0, impressions: 0, weighted: 0, sessions: 0 }
      entry.clicks += page.gscClicks
      entry.impressions += page.gscImpressions
      entry.weighted += (page.gscAvgPosition ?? 0) * page.gscImpressions
      entry.sessions += page.sessions
      pages.set(page.path, entry)
    }
  }
  return [...pages.entries()]
    .filter(([, p]) => p.impressions > 0 || p.sessions > 0)
    .sort((a, b) => b[1].impressions + b[1].sessions - (a[1].impressions + a[1].sessions))
    .map(([path, p]) => {
      const position = p.impressions > 0 ? round1(p.weighted / p.impressions) : null
      const ctr = p.impressions > 0 ? round1((p.clicks / p.impressions) * 100) : 0
      const rank = position === null ? '순위 없음' : `평균 ${position}위`
      return {
        id: `page:${path}`,
        text: `${path}: 클릭 ${p.clicks}, 노출 ${p.impressions}, CTR ${ctr}%, ${rank}, 세션 ${p.sessions}`,
        values: [p.clicks, p.impressions, ctr, ...(position === null ? [] : [position]), p.sessions],
        subjects: [path],
        sample: p.impressions < MIN_USABLE_IMPRESSIONS && p.sessions < MIN_USABLE_SESSIONS ? 'small' : 'usable',
      }
    })
}

function queryFacts(input: ReportFactsInput): ReportFact[] {
  const queries = new Map<string, { query: string; page: string; clicks: number; impressions: number; weighted: number }>()
  for (const day of input.days) {
    for (const q of day.queries) {
      const key = `${q.query}:${q.page}`
      const entry = queries.get(key) ?? { query: q.query, page: q.page, clicks: 0, impressions: 0, weighted: 0 }
      entry.clicks += q.clicks
      entry.impressions += q.impressions
      entry.weighted += q.position * q.impressions
      queries.set(key, entry)
    }
  }
  const impressionsOf = (query: string, page: string): number => queries.get(`${query}:${page}`)?.impressions ?? 0

  const top: ReportFact[] = [...queries.values()]
    .filter((q) => q.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, MAX_QUERY_FACTS)
    .map((q) => {
      const position = round1(q.weighted / q.impressions)
      return {
        id: `query:${q.query}:${q.page}`,
        text: `"${q.query}" → ${q.page}: 클릭 ${q.clicks}, 노출 ${q.impressions}, 평균 ${position}위`,
        values: [q.clicks, q.impressions, position],
        subjects: [q.query, q.page],
        sample: q.impressions < MIN_USABLE_IMPRESSIONS ? 'small' : 'usable',
      }
    })

  const ranks: ReportFact[] = [...input.weekly.risingQueries, ...input.weekly.fallingQueries].map((q) => {
    const previous = round1(q.previousWeekPosition)
    const current = round1(q.thisWeekPosition)
    const change = round1(Math.abs(q.positionChange))
    return {
      id: `rank:${q.query}:${q.page}`,
      text: `"${q.query}" → ${q.page}: 평균 ${previous}위 → ${current}위`,
      values: [previous, current, change],
      subjects: [q.query, q.page],
      sample: impressionsOf(q.query, q.page) < MIN_USABLE_IMPRESSIONS ? 'small' : 'usable',
    }
  })
  return [...top, ...ranks]
}

function qualityFacts(input: ReportFactsInput): ReportFact[] {
  const { weekly } = input
  const facts: ReportFact[] = []
  for (const page of weekly.highBouncePages) {
    const percent = round1(page.bounceRate * 100)
    facts.push({
      id: `bounce:${page.path}`,
      text: `${page.path}: 이탈률 ${percent}%, 세션 ${page.sessions}`,
      values: [percent, page.sessions],
      subjects: [page.path],
      sample: page.sessions < MIN_USABLE_SESSIONS ? 'small' : 'usable',
    })
  }
  for (const page of weekly.toolEngagement) {
    const percent = round1(page.engagementRate * 100)
    facts.push({
      id: `engagement:${page.path}`,
      text: `${page.path}: 입력 이벤트 ${page.inputEnterCount}건, 세션 ${page.sessions}, 세션 대비 ${percent}%`,
      values: [page.inputEnterCount, page.sessions, percent],
      subjects: [page.path],
      sample: page.sessions < MIN_USABLE_SESSIONS ? 'small' : 'usable',
    })
  }
  for (const signal of weekly.claritySignals) {
    const paths = signal.samplePages.map(pathOf)
    facts.push({
      id: `clarity:${signal.metricName}`,
      text: `Clarity ${signal.metricName}: ${signal.affectedSessionCount}세션 (${paths.join(', ') || '페이지 정보 없음'}) — 페이지 단위 수치이며 클릭한 요소는 알 수 없음`,
      values: [signal.affectedSessionCount],
      subjects: paths,
      sample: signal.affectedSessionCount < MIN_USABLE_SESSIONS ? 'small' : 'usable',
      tags: ['url-level'],
    })
  }
  for (const deviation of weekly.ctrDeviations) {
    const segment = round1(deviation.segmentCtr * 100)
    const overall = round1(deviation.overallCtr * 100)
    facts.push({
      id: `ctr-deviation:${deviation.path}:${deviation.segment}`,
      text: `${deviation.path} ${deviation.segment}: CTR ${segment}% (전체 ${overall}%)`,
      values: [segment, overall],
      subjects: [deviation.path, deviation.segment],
      sample: 'small',
    })
  }
  return facts
}

function siteFacts(input: ReportFactsInput): ReportFact[] {
  const facts: ReportFact[] = input.lighthouse.map((score) => {
    const path = pathOf(score.url)
    return {
      id: `lighthouse:${path}`,
      text: `Lighthouse ${path}: 성능 ${score.performance}, 접근성 ${score.accessibility}, 권장사항 ${score.bestPractices}, SEO ${score.seo}`,
      values: [score.performance, score.accessibility, score.bestPractices, score.seo],
      subjects: [path],
      sample: 'usable' as const,
    }
  })

  const counts = new Map<string, string[]>()
  for (const [query, intent] of Object.entries(input.intents)) {
    counts.set(intent, [...(counts.get(intent) ?? []), query])
  }
  if (counts.size > 0) {
    const entries = [...counts.entries()].sort((a, b) => b[1].length - a[1].length)
    facts.push({
      id: 'intent.summary',
      text: `상위 쿼리 의도: ${entries.map(([intent, queries]) => `${intent} ${queries.length}개`).join(', ')}`,
      values: entries.map(([, queries]) => queries.length),
      subjects: Object.keys(input.intents),
      sample: 'small',
    })
  }

  facts.push({
    id: 'cleanup.count',
    text: `정리 후보 ${input.cleanupCount}개`,
    values: [input.cleanupCount],
    subjects: [],
    sample: 'usable',
  })
  return facts
}

export function buildReportFacts(input: ReportFactsInput): ReportFact[] {
  return [
    ...totalFacts(input),
    ...sessionShapeFacts(input),
    ...pageFacts(input.days),
    ...queryFacts(input),
    ...qualityFacts(input),
    ...siteFacts(input),
  ]
}
