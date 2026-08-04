/**
 * IndexNow Notification Script
 *
 * Reads out/sitemap.xml and notifies IndexNow of all URLs after each deployment.
 * Always notifies the full URL list (no diff tracking — intentional simplicity).
 *
 * - Never crashes the CI workflow: all errors are logged and the script exits 0.
 * - INDEXNOW_KEY must be set via environment variable, never hardcoded.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const HOST = 'bitkittools.com'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

function getKey(): string | null {
  const key = process.env.INDEXNOW_KEY
  if (!key) {
    console.warn(
      '[IndexNow] INDEXNOW_KEY environment variable is not set. Skipping notification.'
    )
    return null
  }
  return key
}

function extractUrls(xmlContent: string): string[] {
  const matches = xmlContent.match(/<loc>([^<]+)<\/loc>/g)
  if (!matches || matches.length === 0) {
    console.warn('[IndexNow] No <loc> entries found in sitemap.xml.')
    return []
  }
  return matches.map((m) => m.replace(/<\/?loc>/g, '').trim())
}

function readSitemap(): string | null {
  const sitemapPath = resolve(process.cwd(), 'out', 'sitemap.xml')
  try {
    return readFileSync(sitemapPath, 'utf-8')
  } catch (err) {
    console.error(`[IndexNow] Failed to read out/sitemap.xml: ${String(err)}`)
    return null
  }
}

async function notifyIndexNow(key: string, urls: string[]): Promise<void> {
  const body = {
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList: urls,
  }

  console.log(`[IndexNow] Notifying ${urls.length} URL(s)...`)

  let response: Response
  try {
    response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error(`[IndexNow] Network error during notification: ${String(err)}`)
    return
  }

  if (response.ok) {
    console.log(`[IndexNow] Success — HTTP ${response.status}`)
  } else {
    const text = await response.text().catch(() => '')
    console.error(
      `[IndexNow] API returned HTTP ${response.status}. Response: ${text}`
    )
  }
}

async function main(): Promise<void> {
  const key = getKey()
  if (!key) return

  const xml = readSitemap()
  if (!xml) return

  const urls = extractUrls(xml)
  if (urls.length === 0) return

  await notifyIndexNow(key, urls)
}

main().catch((err) => {
  // Last-resort catch: log but do not re-throw so the process exits 0
  console.error(`[IndexNow] Unexpected error: ${String(err)}`)
})
