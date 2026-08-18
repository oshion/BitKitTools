/**
 * generate-report.ts
 *
 * Weekly report generator. Reads the calendar Saturday-to-Friday week of
 * processed data (see lib/weeklyReportWindow.ts), aggregates it, classifies
 * query intents, detects stagnation trend, and generates an AI-authored
 * Markdown report via Anthropic API.
 *
 * Usage: npx tsx scripts/generate-report.ts
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import type { ProcessedDay } from './process-analytics'
import { aggregateWeeklyReport, buildTitleExperimentSection } from './lib/aggregateWeeklyReport'
import {
  classifyAmbiguousQueries,
  classifyIntentRuleBased,
  type IntentClassification,
} from './lib/classifyIntent'
import { appendTrendPoint, readActionLog, readTrend, writeTrend } from './lib/detectStagnation'
import { getWeeklyReportWindow } from './lib/weeklyReportWindow'
import { extractAnthropicText, isTruncated } from './lib/anthropicResponse'
import { toolsConfig } from '../src/lib/config/tools-config'
import { findScoresBelowThreshold } from './lib/lighthouseThreshold'
import type { PageLighthouseScore } from './lib/lighthouseThreshold'

// ── Constants ─────────────────────────────────────────────────────────────────

const PROCESSED_DIR = resolve(process.cwd(), 'data', 'processed')
const REPORTS_DIR = resolve(process.cwd(), 'data', 'reports')
const HISTORY_PATH = resolve(process.cwd(), 'data', 'history.md')

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'

/** Top N queries (by impressions) to classify for intent */
const TOP_QUERIES_LIMIT = 30
/** Minimum sessions in 7 days to NOT be flagged as cleanup candidate */
const CLEANUP_SESSION_THRESHOLD = 5
/** Days since addedAt after which a tool can be flagged as cleanup candidate */
const CLEANUP_AGE_DAYS = 90

// ── Data I/O ──────────────────────────────────────────────────────────────────

/** Read processed day files (YYYY-MM-DD.json) whose date falls within [start, end] inclusive. */
function readProcessedDaysInWindow(start: string, end: string): ProcessedDay[] {
  if (!existsSync(PROCESSED_DIR)) return []

  const files = readdirSync(PROCESSED_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .filter((f) => {
      const date = f.slice(0, 10)
      return date >= start && date <= end
    })
    .sort()

  const result: ProcessedDay[] = []
  for (const file of files) {
    try {
      const raw = readFileSync(join(PROCESSED_DIR, file), 'utf-8')
      result.push(JSON.parse(raw) as ProcessedDay)
    } catch {
      // Skip malformed files silently
    }
  }
  return result
}

/** Read data/history.md — returns empty string if file does not exist. */
function readHistory(): string {
  if (!existsSync(HISTORY_PATH)) return ''
  try {
    return readFileSync(HISTORY_PATH, 'utf-8')
  } catch {
    return ''
  }
}

// ── Cleanup Candidates ────────────────────────────────────────────────────────

interface CleanupCandidate {
  slug: string
  addedAt: string
  sessions: number
}

/**
 * Returns tools that are ≥90 days old and had fewer than 5 sessions
 * across the provided days. Currently all tools are <90 days old so
 * this will return an empty array in the short term.
 */
function getCleanupCandidates(days: ProcessedDay[]): CleanupCandidate[] {
  const today = new Date()
  const cutoffDate = new Date(today.getTime() - CLEANUP_AGE_DAYS * 24 * 60 * 60 * 1000)

  // Build session totals per path from all days
  const sessionsByPath = new Map<string, number>()
  for (const day of days) {
    for (const page of day.pages) {
      sessionsByPath.set(page.path, (sessionsByPath.get(page.path) ?? 0) + page.sessions)
    }
  }

  const candidates: CleanupCandidate[] = []

  for (const tool of toolsConfig) {
    const addedAt = new Date(tool.addedAt)
    if (addedAt > cutoffDate) continue // Newer than 90 days — skip

    // Count sessions across both EN and KO paths
    const paths = [
      `/${tool.category}/${tool.slug}/`,
      `/ko/${tool.category}/${tool.slug}/`,
    ]
    let totalSessions = 0
    for (const path of paths) {
      totalSessions += sessionsByPath.get(path) ?? 0
    }

    if (totalSessions < CLEANUP_SESSION_THRESHOLD) {
      candidates.push({ slug: tool.slug, addedAt: tool.addedAt, sessions: totalSessions })
    }
  }

  return candidates
}

// ── Week-over-Week Comparison ────────────────────────────────────────────────

/**
 * Builds a plain-text WoW summary for sessions/clicks. Returns a message
 * saying no comparison is possible when there's no previous week, and
 * avoids dividing by zero when the previous week's value was 0.
 */
function buildWowComparison(
  totals: { sessions: number; clicks: number },
  previousWeek: { organicSessions: number; organicClicks: number } | undefined
): string {
  if (!previousWeek) {
    return '지난 주 데이터 없음 — 비교 불가(이번이 첫 리포트이거나 트렌드 기록이 아직 없음)'
  }

  const formatChange = (current: number, previous: number, label: string): string => {
    if (previous === 0) {
      return `${label}: ${previous} → ${current} (지난 주 0이라 증감률 계산 불가)`
    }
    const pct = ((current - previous) / previous) * 100
    const sign = pct >= 0 ? '+' : ''
    return `${label}: ${previous} → ${current} (${sign}${pct.toFixed(1)}%)`
  }

  return [
    formatChange(totals.sessions, previousWeek.organicSessions, '세션'),
    formatChange(totals.clicks, previousWeek.organicClicks, '클릭'),
  ].join(' / ')
}

// ── Response Parsing ──────────────────────────────────────────────────────────

interface ParsedResponse {
  report: string
  historyEntry: string | null
}

/**
 * Extracts the report body and history entry from the delimited API response.
 *
 * Expected format:
 *   ===REPORT===
 *   ...
 *   ===HISTORY===
 *   ...
 *   ===END===
 *
 * Fail-soft: if delimiters are not found, returns the full response text as
 * the report and null for historyEntry. This preserves the report even when
 * the model doesn't follow the exact format.
 */
function parseApiResponse(text: string): ParsedResponse {
  const reportMatch = text.match(/===REPORT===([\s\S]*?)===HISTORY===/)
  const historyMatch = text.match(/===HISTORY===([\s\S]*?)===END===/)

  if (!reportMatch) {
    // Fall back to full response text — better than losing the report entirely
    console.warn('[generate-report] Could not find ===REPORT=== delimiter — using full response as report.')
    return { report: text.trim(), historyEntry: null }
  }

  return {
    report: (reportMatch[1] ?? '').trim(),
    historyEntry: historyMatch ? (historyMatch[1] ?? '').trim() : null,
  }
}

// ── Date Helper ───────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Lighthouse Snapshot ───────────────────────────────────────────────────────

interface LighthouseSnapshot {
  date: string
  scores: PageLighthouseScore[]
}

/**
 * Reads data/processed/lighthouse-{today}.json.
 * Returns null (without throwing) if the file doesn't exist or is malformed —
 * report generation continues without the performance section in that case.
 */
function readTodayLighthouseSnapshot(): LighthouseSnapshot | null {
  const date = todayIso()
  const filePath = join(PROCESSED_DIR, `lighthouse-${date}.json`)
  if (!existsSync(filePath)) return null
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as LighthouseSnapshot
  } catch {
    return null
  }
}

/**
 * Deterministically builds the `## ⚠️ 성능 경고` section from a snapshot.
 * Returns null when there are no flagged scores (no section needed).
 * This is NOT delegated to AI — the section is built in code to guarantee it
 * appears whenever there are scores below threshold.
 */
function buildPerformanceWarningSection(snapshot: LighthouseSnapshot | null): string | null {
  if (!snapshot) return null
  const flagged = findScoresBelowThreshold(snapshot.scores, 90)
  if (flagged.length === 0) return null

  const lines = flagged.map(({ url, category, score }) => `- ${url}: ${category} ${score}점`)
  return `## ⚠️ 성능 경고\n\n다음 페이지가 Lighthouse 90점 미만입니다:\n${lines.join('\n')}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Require API key upfront
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error(
      '[generate-report] Error: ANTHROPIC_API_KEY environment variable is not set.\n' +
        'Set it before running: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-report.ts'
    )
    process.exit(1)
  }

  // ── 0. Read today's Lighthouse snapshot (optional — missing is not an error) ─

  const lighthouseSnapshot = readTodayLighthouseSnapshot()
  if (lighthouseSnapshot) {
    console.log(
      `[generate-report] Loaded Lighthouse snapshot for ${lighthouseSnapshot.date} (${lighthouseSnapshot.scores.length} page(s)).`
    )
  } else {
    console.log(
      '[generate-report] No Lighthouse snapshot found for today — performance section will be omitted.'
    )
  }

  // ── 1. Read the Sat-Fri weekly window of processed data ──────────────────────

  const { start: windowStart, end: windowEnd } = getWeeklyReportWindow(new Date())
  console.log(`[generate-report] Report window: ${windowStart} ~ ${windowEnd}`)

  const days = readProcessedDaysInWindow(windowStart, windowEnd)

  if (days.length === 0) {
    console.log(
      '[generate-report] No processed data files found for the report window. ' +
        'Skipping report generation (this is expected in the initial state).'
    )
    process.exit(0)
  }

  console.log(
    `[generate-report] Loaded ${days.length} day(s) of data: ${days.map((d) => d.date).join(', ')}`
  )

  // ── 2. Aggregate weekly data ─────────────────────────────────────────────────

  const weeklyData = aggregateWeeklyReport(days)

  // ── 3. Classify search intent for top queries ────────────────────────────────

  // Deduplicate queries and rank by total impressions
  const impressionsByQuery = new Map<string, number>()
  for (const day of days) {
    for (const q of day.queries) {
      impressionsByQuery.set(q.query, (impressionsByQuery.get(q.query) ?? 0) + q.impressions)
    }
  }

  const topQueries = [...impressionsByQuery.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_QUERIES_LIMIT)
    .map(([query]) => query)

  // Stage 1: rule-based
  const ruleResults = new Map<string, IntentClassification>()
  const ambiguousQueries: string[] = []
  for (const query of topQueries) {
    const intent = classifyIntentRuleBased(query)
    if (intent === 'ambiguous') {
      ambiguousQueries.push(query)
    } else {
      ruleResults.set(query, intent)
    }
  }

  // Stage 2: AI fallback for ambiguous queries (fail-soft)
  const aiResults = ambiguousQueries.length > 0
    ? await classifyAmbiguousQueries(ambiguousQueries, apiKey)
    : new Map<string, IntentClassification>()

  const intentClassifications: Record<string, IntentClassification> = {}
  for (const query of topQueries) {
    intentClassifications[query] = ruleResults.get(query) ?? aiResults.get(query) ?? 'ambiguous'
  }

  // ── 4. Cleanup candidates ────────────────────────────────────────────────────

  const cleanupCandidates = getCleanupCandidates(days)

  // ── 5. Update stagnation trend ───────────────────────────────────────────────

  const trend = readTrend()

  // Find last week's point before we add/replace this week's entry, so we can
  // report week-over-week movement. If the last entry already has this week's
  // weekStart (a same-day re-run), fall back one further.
  const lastEntry = trend.weeks[trend.weeks.length - 1]
  const previousWeek =
    lastEntry?.weekStart === weeklyData.periodStart
      ? trend.weeks[trend.weeks.length - 2]
      : lastEntry

  const updatedTrend = appendTrendPoint(trend, {
    weekStart: weeklyData.periodStart,
    organicSessions: weeklyData.totals.sessions,
    organicClicks: weeklyData.totals.clicks,
  })
  writeTrend(updatedTrend)
  console.log('[generate-report] Trend data updated.')

  // ── 6. Read history ──────────────────────────────────────────────────────────

  const history = readHistory()

  // ── 7. Build prompt & call Anthropic API ────────────────────────────────────

  const wowComparison = buildWowComparison(weeklyData.totals, previousWeek)

  const intentLines = Object.entries(intentClassifications)
    .map(([q, intent]) => `- "${q}": ${intent}`)
    .join('\n')

  const cleanupSection =
    cleanupCandidates.length === 0
      ? '해당 없음 (현재 게시 90일 이상 + 최근 7일 세션 5 미만인 tool 없음)'
      : cleanupCandidates
          .map((c) => `- slug: ${c.slug}, addedAt: ${c.addedAt}, 최근7일 세션: ${c.sessions}`)
          .join('\n')

  const lighthouseSection = lighthouseSnapshot
    ? `## Lighthouse 점수 (${lighthouseSnapshot.date} 기준)\n\n\`\`\`json\n${JSON.stringify(lighthouseSnapshot.scores, null, 2)}\n\`\`\``
    : '## Lighthouse 점수\n\n(오늘 스냅샷 없음 — collect-lighthouse.ts가 실행되지 않았거나 실패했을 수 있음)'

  const prompt = `당신은 BitKitTools.com의 SEO/콘텐츠 분석가입니다. 아래 주간 데이터를 바탕으로 한국어 마크다운 리포트를 작성하세요.

## 이번 주 집계 데이터 (${weeklyData.periodStart} ~ ${weeklyData.periodEnd})

\`\`\`json
${JSON.stringify(weeklyData, null, 2)}
\`\`\`

## 지난 주 대비 변화 (Week-over-Week)

${wowComparison}

## 검색 의도 분류 결과 (상위 쿼리 최대 ${TOP_QUERIES_LIMIT}개)

${intentLines || '분류할 쿼리 없음'}

## 정리 후보 (게시 ${CLEANUP_AGE_DAYS}일 이상 + 최근 7일 세션 ${CLEANUP_SESSION_THRESHOLD}회 미만)

${cleanupSection}

## 과거 이력 (이미 시도한 접근을 반복 제안하지 않기 위한 참고)

${history || '(아직 이력 없음)'}

${lighthouseSection}

---

위 데이터를 분석하고 다음 항목을 포함한 주간 리포트를 작성하세요:

1. **잘 되고 있는 것**: topPerformingPages(클릭이 실제로 발생한 페이지)와 지난 주 대비 변화(Week-over-Week)를 근거로 이번 주 긍정적인 신호를 요약. 데이터가 부족해 뚜렷한 성과가 없으면 억지로 만들어내지 말고 "아직 판단할 만한 데이터가 부족함"이라고 명시.
2. **CTR 0 페이지 분석**: zeroCtrPages의 페이지들이 클릭을 받지 못하는 원인 해설 (제목·스니펫·검색 의도 불일치 등)
3. **이탈률 높은 페이지 분석**: highBouncePages 주요 항목 분석 및 개선 방향
4. **국가/기기별 CTR 편차**: ctrDeviations 주요 항목 해설
5. **검색 의도 분류 요약**: 분류 결과에서 발견되는 패턴과 콘텐츠 전략 시사점
6. **순위 변동 쿼리**: risingQueries/fallingQueries 주요 항목 해설(순위가 오른 쿼리도 "잘 되고 있는 것"의 연장선으로 긍정적으로 조명)
7. **정리 후보**: 위에 제공된 데이터를 그대로 요약 (해당 없으면 "현재 해당 없음" 명시)
8. **툴 품질 신호** (toolEngagement/claritySignals 데이터가 있을 때만): toolEngagement는 페이지별 "세션 대비 실제로 입력값을 건드려본 비율"(engagementRate)이다 — 세션은 있는데 engagementRate가 낮은 페이지는 검색 의도 불일치나 UX 문제로 방문자가 도구를 쓰지도 않고 이탈했다는 신호이니 원인 후보를 짧게 짚는다. claritySignals는 DeadClickCount(반응 없는 요소 클릭)/RageClickCount(반복 클릭)/ScriptErrorCount(실제 JS 에러)/QuickbackClick(들어왔다 바로 이탈) 같은 UX 이상 신호이며, 특히 ScriptErrorCount는 볼륨과 무관하게 실제 버그일 가능성이 있으니 발견 시 반드시 명시한다. 둘 다 데이터가 없으면(빈 배열) 이 항목은 생략한다.
9. **추가 아이디어 제안** (필수 — 최소 1개): 신규 콘텐츠 방향, 놓치고 있는 키워드, 경쟁사 벤치마킹 아이디어 등. 위에서 발견된 문제와 별개로 반드시 포함한다. **과거 이력(history.md)에 이미 시도했던 접근은 반복 제안하지 말 것.**
10. **Lighthouse 성능 분석** (Lighthouse 점수 데이터가 있을 때만): 점수가 낮은 페이지의 원인 후보(무거운 JS, 이미지 최적화 부족, 서드파티 스크립트 영향 등)를 짧게 언급하고 개선 방향을 제안. 데이터가 없으면 이 항목은 생략한다.

응답은 반드시 아래 형식을 그대로 사용하세요 (구분자 줄을 정확히 일치시켜야 합니다):
===REPORT===
(전체 마크다운 리포트 본문)
===HISTORY===
(3~5줄 압축 요약 — 형식: "YYYY년 MM월 N주차: 핵심 지표 / 특이사항 / 시도한 개선 / 결과")
===END===`

  console.log('[generate-report] Calling Anthropic API...')

  let apiResponseText: string
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '(unreadable)')
      console.error(`[generate-report] Anthropic API error ${response.status}: ${errorText}`)
      process.exit(1)
    }

    const json = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>
      stop_reason?: string
    }
    apiResponseText = extractAnthropicText(json)

    if (isTruncated(json)) {
      console.warn(
        '[generate-report] Anthropic response was cut off by max_tokens — the report may be incomplete.'
      )
    }

    if (!apiResponseText.trim()) {
      console.error(
        '[generate-report] Anthropic API returned an empty response. Raw response:',
        JSON.stringify(json)
      )
      process.exit(1)
    }
  } catch (err) {
    console.error('[generate-report] Network error calling Anthropic API:', err)
    process.exit(1)
  }

  // ── 8. Parse response ────────────────────────────────────────────────────────

  const { report: aiReport, historyEntry } = parseApiResponse(apiResponseText)

  // ── 8b. Deterministically append performance warning section ─────────────────
  // This is NOT delegated to AI — we guarantee the section appears whenever
  // there are scores below threshold, regardless of AI prompt compliance.

  const performanceWarning = buildPerformanceWarningSection(lighthouseSnapshot)

  // ── 8c. Deterministically append title experiment section ─────────────────────
  // Also NOT delegated to AI — built in code so it always appears when there
  // are active title experiments, regardless of AI prompt compliance.

  const actionLog = readActionLog()
  const titleExperimentSection = buildTitleExperimentSection(actionLog)

  const reportParts = [aiReport]
  if (performanceWarning) reportParts.push(performanceWarning)
  if (titleExperimentSection) reportParts.push(titleExperimentSection)
  const report = reportParts.join('\n\n')

  // ── 9. Save report ───────────────────────────────────────────────────────────

  const today = todayIso()
  const yearStr = today.slice(0, 4)
  const reportDir = join(REPORTS_DIR, yearStr)
  mkdirSync(reportDir, { recursive: true })
  const reportPath = join(reportDir, `${today}.md`)
  writeFileSync(reportPath, report, 'utf-8')
  console.log(`[generate-report] Saved report to data/reports/${yearStr}/${today}.md`)

  // ── 10. Append history entry ─────────────────────────────────────────────────

  if (historyEntry) {
    const existingContent = readHistory()
    const separator = existingContent.length > 0 ? '\n\n' : ''
    appendFileSync(HISTORY_PATH, `${separator}${historyEntry}`, 'utf-8')
    console.log('[generate-report] Appended history entry to data/history.md')
  } else {
    console.log(
      '[generate-report] No ===HISTORY=== section found in response — history.md not updated.'
    )
  }
}

main().catch((err: unknown) => {
  console.error('[generate-report] Unexpected error:', err)
  process.exit(1)
})
