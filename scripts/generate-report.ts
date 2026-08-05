/**
 * generate-report.ts
 *
 * Weekly report generator. Reads recent 7 days of processed data,
 * aggregates it, classifies query intents, detects stagnation trend,
 * and generates an AI-authored Markdown report via Anthropic API.
 *
 * Usage: npx tsx scripts/generate-report.ts
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import type { ProcessedDay } from './process-analytics'
import { aggregateWeeklyReport } from './lib/aggregateWeeklyReport'
import {
  classifyAmbiguousQueries,
  classifyIntentRuleBased,
  type IntentClassification,
} from './lib/classifyIntent'
import { appendTrendPoint, readTrend, writeTrend } from './lib/detectStagnation'
import { toolsConfig } from '../src/lib/config/tools-config'

// ── Constants ─────────────────────────────────────────────────────────────────

const PROCESSED_DIR = resolve(process.cwd(), 'data', 'processed')
const REPORTS_DIR = resolve(process.cwd(), 'data', 'reports')
const HISTORY_PATH = resolve(process.cwd(), 'data', 'history.md')

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-4-6'

/** Top N queries (by impressions) to classify for intent */
const TOP_QUERIES_LIMIT = 30
/** Minimum sessions in 7 days to NOT be flagged as cleanup candidate */
const CLEANUP_SESSION_THRESHOLD = 5
/** Days since addedAt after which a tool can be flagged as cleanup candidate */
const CLEANUP_AGE_DAYS = 90

// ── Data I/O ──────────────────────────────────────────────────────────────────

/** Read up to the most recent `limit` days of processed files (YYYY-MM-DD.json only). */
function readRecentProcessedDays(limit: number): ProcessedDay[] {
  if (!existsSync(PROCESSED_DIR)) return []

  const files = readdirSync(PROCESSED_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .slice(-limit)

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

  // ── 1. Read recent 7 days of processed data ─────────────────────────────────

  const days = readRecentProcessedDays(7)

  if (days.length === 0) {
    console.log(
      '[generate-report] No processed data files found in data/processed/. ' +
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

  const intentLines = Object.entries(intentClassifications)
    .map(([q, intent]) => `- "${q}": ${intent}`)
    .join('\n')

  const cleanupSection =
    cleanupCandidates.length === 0
      ? '해당 없음 (현재 게시 90일 이상 + 최근 7일 세션 5 미만인 tool 없음)'
      : cleanupCandidates
          .map((c) => `- slug: ${c.slug}, addedAt: ${c.addedAt}, 최근7일 세션: ${c.sessions}`)
          .join('\n')

  const prompt = `당신은 BitKitTools.com의 SEO/콘텐츠 분석가입니다. 아래 주간 데이터를 바탕으로 한국어 마크다운 리포트를 작성하세요.

## 이번 주 집계 데이터 (${weeklyData.periodStart} ~ ${weeklyData.periodEnd})

\`\`\`json
${JSON.stringify(weeklyData, null, 2)}
\`\`\`

## 검색 의도 분류 결과 (상위 쿼리 최대 ${TOP_QUERIES_LIMIT}개)

${intentLines || '분류할 쿼리 없음'}

## 정리 후보 (게시 ${CLEANUP_AGE_DAYS}일 이상 + 최근 7일 세션 ${CLEANUP_SESSION_THRESHOLD}회 미만)

${cleanupSection}

## 과거 이력 (이미 시도한 접근을 반복 제안하지 않기 위한 참고)

${history || '(아직 이력 없음)'}

---

위 데이터를 분석하고 다음 항목을 포함한 주간 리포트를 작성하세요:

1. **CTR 0 페이지 분석**: zeroCtrPages의 페이지들이 클릭을 받지 못하는 원인 해설 (제목·스니펫·검색 의도 불일치 등)
2. **이탈률 높은 페이지 분석**: highBouncePages 주요 항목 분석 및 개선 방향
3. **국가/기기별 CTR 편차**: ctrDeviations 주요 항목 해설
4. **검색 의도 분류 요약**: 분류 결과에서 발견되는 패턴과 콘텐츠 전략 시사점
5. **순위 변동 쿼리**: risingQueries/fallingQueries 주요 항목 해설
6. **정리 후보**: 위에 제공된 데이터를 그대로 요약 (해당 없으면 "현재 해당 없음" 명시)
7. **추가 아이디어 제안** (필수 — 최소 1개): 신규 콘텐츠 방향, 놓치고 있는 키워드, 경쟁사 벤치마킹 아이디어 등. 위에서 발견된 문제와 별개로 반드시 포함한다. **과거 이력(history.md)에 이미 시도했던 접근은 반복 제안하지 말 것.**

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
        max_tokens: 4096,
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
    }
    apiResponseText = json.content?.[0]?.text ?? ''
  } catch (err) {
    console.error('[generate-report] Network error calling Anthropic API:', err)
    process.exit(1)
  }

  // ── 8. Parse response ────────────────────────────────────────────────────────

  const { report, historyEntry } = parseApiResponse(apiResponseText)

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
