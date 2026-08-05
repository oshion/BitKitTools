/**
 * formatSlackBlocks.ts
 *
 * Pure utility: converts a Markdown weekly report string into
 * a Slack Block Kit `blocks` array ready for Webhook POST.
 *
 * Constraints respected:
 * - Single block `text.text` ≤ 3000 chars (Slack limit)
 * - Total blocks ≤ 50 (Slack limit) — we truncate at 45 and add a notice
 * - `**bold**` → `*bold*` (Markdown vs Slack mrkdwn syntax)
 */

export interface SlackBlock {
  type: string
  [key: string]: unknown
}

// Slack limits
const MAX_TEXT_LEN = 3000
const BLOCK_LIMIT_WARN = 45

/**
 * Convert Markdown bold (`**text**`) to Slack mrkdwn bold (`*text*`).
 */
function markdownToMrkdwn(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '*$1*')
}

/**
 * Split a long string into chunks of at most `maxLen` characters,
 * breaking on newline boundaries where possible.
 */
function splitLongText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text]

  const chunks: string[] = []
  let remaining = text

  while (remaining.length > maxLen) {
    // Try to find a newline to break on, searching backwards from maxLen
    let breakAt = remaining.lastIndexOf('\n', maxLen)
    if (breakAt <= 0) {
      // No newline found — hard break at maxLen
      breakAt = maxLen
    }
    chunks.push(remaining.slice(0, breakAt).trimEnd())
    remaining = remaining.slice(breakAt).trimStart()
  }

  if (remaining.length > 0) {
    chunks.push(remaining)
  }

  return chunks
}

/**
 * Build a `section` block with mrkdwn text.
 */
function sectionBlock(text: string): SlackBlock {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: markdownToMrkdwn(text),
    },
  }
}

/**
 * Convert a Markdown weekly report and date string into Slack Block Kit blocks.
 *
 * Structure:
 *   1. Header block — "📊 주간 리포트 — {date}"
 *   2. For each `## ` section:
 *      - divider
 *      - one or more section blocks (split at 3000-char limit)
 *   3. If block count reaches 45, stop and append a notice section.
 */
export function formatReportAsSlackBlocks(markdown: string, date: string): SlackBlock[] {
  const blocks: SlackBlock[] = []

  // ── 1. Header ──────────────────────────────────────────────────────────────

  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `📊 주간 리포트 — ${date}`,
      emoji: true,
    },
  })

  // ── 2. Split markdown by ## headings ─────────────────────────────────────────

  // Each element is one `## ...` section (including the heading line)
  const rawSections = markdown.split(/(?=^## )/m).filter((s) => s.trim().length > 0)

  for (const section of rawSections) {
    // Check if we're approaching the block limit before adding more
    if (blocks.length >= BLOCK_LIMIT_WARN) {
      break
    }

    // Add divider between sections
    blocks.push({ type: 'divider' })

    // Convert section text to Slack mrkdwn and split if too long
    const sectionText = section.trim()
    const chunks = splitLongText(sectionText, MAX_TEXT_LEN)

    for (const chunk of chunks) {
      if (blocks.length >= BLOCK_LIMIT_WARN) {
        break
      }
      blocks.push(sectionBlock(chunk))
    }
  }

  // ── 3. Truncation notice ──────────────────────────────────────────────────

  if (blocks.length >= BLOCK_LIMIT_WARN) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_전체 내용은 \`data/reports/${date.slice(0, 4)}/${date}.md\`에서 확인하세요._`,
      },
    })
  }

  return blocks
}
