/**
 * generate-rss.ts
 *
 * Build-time script: generates public/rss.xml from tools-config.ts.
 * Tools are sorted by addedAt (newest first).
 * Run via: tsx scripts/generate-rss.ts
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { toolsConfig } from '../src/lib/config/tools-config'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SITE_TITLE = 'BitKitTools'
const SITE_DESCRIPTION =
  'Free calculators for developers, travelers, beer lovers & parents'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildRss(): string {
  const sorted = [...toolsConfig].sort((a, b) =>
    b.addedAt.localeCompare(a.addedAt)
  )

  const items = sorted
    .map((tool) => {
      const link = `${SITE_URL}/${tool.category}/${tool.slug}/`
      return `    <item>
      <title>${escapeXml(tool.title.en)}</title>
      <link>${link}</link>
      <description>${escapeXml(tool.description.en)}</description>
      <pubDate>${new Date(tool.addedAt).toUTCString()}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`
    })
    .join('\n')

  const now = new Date().toUTCString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
}

const outPath = join(process.cwd(), 'public', 'rss.xml')
writeFileSync(outPath, buildRss(), 'utf-8')
console.log(`[generate-rss] Written to ${outPath} (${toolsConfig.length} tools)`)
