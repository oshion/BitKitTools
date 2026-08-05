/**
 * generate-strategy-review.ts
 *
 * Strategy review generator. Runs AFTER generate-report.ts.
 * - If site is NOT stagnant: logs a no-op message and exits immediately.
 * - If site IS stagnant: calls Anthropic API to analyze root causes and suggest
 *   alternative strategies, then appends a section to today's report file.
 *
 * Usage: npx tsx scripts/generate-strategy-review.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import {
  filterCooldownComplete,
  isStagnant,
  readActionLog,
  readTrend,
  type ActionLogEntry,
} from './lib/detectStagnation'

// ── Constants ─────────────────────────────────────────────────────────────────

const REPORTS_DIR = resolve(process.cwd(), 'data', 'reports')

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-4-6'

// ── Date Helper ───────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Prompt Builder ────────────────────────────────────────────────────────────

function buildPrompt(
  trendJson: string,
  completedActions: ActionLogEntry[],
  hasNoActions: boolean
): string {
  const actionSection = hasNoActions
    ? '(아직 실행된 개선 액션이 없습니다. 이 상태에서의 정체를 분석하세요.)'
    : completedActions
        .map(
          (a) =>
            `- [${a.id}] ${a.type} | 페이지: ${a.page} | 배포: ${a.deployedAt}\n  설명: ${a.description}`
        )
        .join('\n')

  return `당신은 BitKitTools.com의 SEO/성장 전략 분석가입니다.
사이트의 주간 트래픽이 정체 상태로 감지되었습니다. 아래 데이터를 바탕으로 한국어 전략 재검토 리포트를 작성하세요.

## 주간 트래픽 트렌드 (최근 최대 12주)

\`\`\`json
${trendJson}
\`\`\`

## 21일 쿨다운이 완료된 과거 액션 (효과를 평가할 수 있는 항목들)

${actionSection}

---

아래 5개 구조적 영역으로 정체 원인을 분류하고, 대안 전략을 제안하세요:

1. **콘텐츠 문제**: 검색 의도와 맞지 않는 콘텐츠, FAQ 부족, E-E-A-T 신호 약화 등
2. **키워드 선정 문제**: 타겟 키워드의 경쟁 심화, 자기잠식, 볼륨 과대평가 등
3. **기술적 문제**: 색인 누락, Core Web Vitals 저하, 크롤링 오류, hreflang 오류 등
4. **경쟁 심화**: AI Overview 대체, 강력한 경쟁사 신규 진입, SERP 구조 변화 등
5. **시즌성**: 해당 카테고리의 계절적/주기적 수요 변화

위 분류 후 실행 가능한 대안 전략을 최소 2개 이상 구체적으로 제안하세요.
${hasNoActions ? '\n참고: 아직 실행된 개선 액션이 없으므로 "과거 시도 반복 방지" 필터는 적용하지 않습니다.' : '과거에 이미 시도한 접근(위 액션 목록)은 반복 제안하지 마세요.'}

응답은 마크다운 형식으로 작성하세요. 섹션 제목(##)으로 각 분류 영역을 구분하고, 전략 제안은 번호 목록으로 제공하세요.`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // ── 1. Read trend and check stagnation (before requiring API key) ─────────────

  const trend = readTrend()

  if (!isStagnant(trend)) {
    console.log('[generate-strategy-review] Not stagnant — skipping.')
    process.exit(0)
  }

  // Require API key only when stagnation is confirmed (avoids exit(1) in no-op case)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error(
      '[generate-strategy-review] Error: ANTHROPIC_API_KEY environment variable is not set.\n' +
        'Set it before running: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-strategy-review.ts'
    )
    process.exit(1)
  }

  console.log('[generate-strategy-review] Stagnation detected — generating strategy review...')

  // ── 2. Read action log and filter cooldown-complete entries ───────────────────

  const actionLog = readActionLog()
  const now = new Date()
  const completedActions = filterCooldownComplete(actionLog.actions, now)
  const hasNoActions = actionLog.actions.length === 0

  console.log(
    `[generate-strategy-review] Action log: ${actionLog.actions.length} total, ` +
      `${completedActions.length} past cooldown.`
  )

  // ── 3. Build prompt and call Anthropic API ────────────────────────────────────

  const trendJson = JSON.stringify(trend, null, 2)
  const prompt = buildPrompt(trendJson, completedActions, hasNoActions)

  console.log('[generate-strategy-review] Calling Anthropic API...')

  let strategyReview: string
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
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '(unreadable)')
      console.error(
        `[generate-strategy-review] Anthropic API error ${response.status}: ${errorText}`
      )
      process.exit(1)
    }

    const json = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    strategyReview = json.content?.[0]?.text ?? ''

    if (!strategyReview) {
      console.error('[generate-strategy-review] Anthropic API returned empty response.')
      process.exit(1)
    }
  } catch (err) {
    console.error('[generate-strategy-review] Network error calling Anthropic API:', err)
    process.exit(1)
  }

  // ── 4. Append section to today's report file ──────────────────────────────────

  const today = todayIso()
  const yearStr = today.slice(0, 4)
  const reportPath = join(REPORTS_DIR, yearStr, `${today}.md`)

  if (!existsSync(reportPath)) {
    console.error(
      `[generate-strategy-review] Report file not found: ${reportPath}\n` +
        'Run generate-report.ts first to create today\'s report.'
    )
    process.exit(1)
  }

  const existingReport = readFileSync(reportPath, 'utf-8')
  const section =
    '\n\n## 전략 재검토 (트래픽 정체 감지)\n\n' + strategyReview.trim()
  writeFileSync(reportPath, existingReport + section, 'utf-8')

  console.log(
    `[generate-strategy-review] Appended strategy review section to data/reports/${yearStr}/${today}.md`
  )
}

main().catch((err: unknown) => {
  console.error('[generate-strategy-review] Unexpected error:', err)
  process.exit(1)
})
