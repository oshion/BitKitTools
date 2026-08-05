/**
 * post-slack-report.ts
 *
 * Reads today's weekly report from data/reports/{year}/{YYYY-MM-DD}.md
 * and posts it to a Slack channel via Incoming Webhook (Block Kit format).
 *
 * Usage: npx tsx scripts/post-slack-report.ts
 *
 * Safety guarantees:
 * - Never calls process.exit(1) — all failure paths log a warning and exit 0.
 * - SLACK_WEBHOOK_URL must be set via environment variable, never hardcoded.
 */

import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { formatReportAsSlackBlocks } from './lib/formatSlackBlocks'

// ── Constants ─────────────────────────────────────────────────────────────────

const REPORTS_DIR = resolve(process.cwd(), 'data', 'reports')

// ── Date Helper ───────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Report Reader ─────────────────────────────────────────────────────────────

function readTodayReport(date: string): string | null {
  const yearStr = date.slice(0, 4)
  const reportPath = join(REPORTS_DIR, yearStr, `${date}.md`)

  if (!existsSync(reportPath)) {
    console.warn(
      `[post-slack-report] No report file found for ${date}: ${reportPath}\n` +
        'Skipping Slack notification — run generate-report.ts first.'
    )
    return null
  }

  try {
    return readFileSync(reportPath, 'utf-8')
  } catch (err) {
    console.warn(`[post-slack-report] Failed to read report file: ${String(err)}`)
    return null
  }
}

// ── Slack Webhook ─────────────────────────────────────────────────────────────

function getWebhookUrl(): string | null {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) {
    console.warn(
      '[post-slack-report] SLACK_WEBHOOK_URL environment variable is not set. Skipping.'
    )
    return null
  }
  return url
}

async function postToSlack(
  webhookUrl: string,
  blocks: ReturnType<typeof formatReportAsSlackBlocks>
): Promise<void> {
  let response: Response
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    })
  } catch (err) {
    console.error(`[post-slack-report] Network error sending to Slack: ${String(err)}`)
    return
  }

  if (response.ok) {
    console.log(`[post-slack-report] Posted to Slack — HTTP ${response.status}`)
  } else {
    const text = await response.text().catch(() => '')
    console.error(
      `[post-slack-report] Slack Webhook returned HTTP ${response.status}. Response: ${text}`
    )
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const date = todayIso()

  // ── 1. Read today's report ──────────────────────────────────────────────────

  const reportMarkdown = readTodayReport(date)
  if (!reportMarkdown) return

  // ── 2. Check Webhook URL ────────────────────────────────────────────────────

  const webhookUrl = getWebhookUrl()
  if (!webhookUrl) return

  // ── 3. Format and post ──────────────────────────────────────────────────────

  console.log(`[post-slack-report] Formatting report for ${date}...`)
  const blocks = formatReportAsSlackBlocks(reportMarkdown, date)
  console.log(`[post-slack-report] Sending ${blocks.length} blocks to Slack...`)

  await postToSlack(webhookUrl, blocks)
}

main().catch((err: unknown) => {
  // Last-resort catch: log but do not re-throw so the process exits 0
  console.error(`[post-slack-report] Unexpected error: ${String(err)}`)
})
