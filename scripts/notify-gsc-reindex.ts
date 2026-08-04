/**
 * GSC Sitemap Submit Script
 *
 * Notifies Google Search Console that the sitemap has been updated after each
 * deployment, using the Search Console Sitemaps API.
 *
 * ── IMPORTANT: Why not the ping endpoint? ──────────────────────────────────────
 * Google officially deprecated the sitemap ping endpoint
 * (https://www.google.com/ping?sitemap=...) in June 2023:
 *   https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
 * That endpoint no longer does anything useful. Using it would be dead code.
 *
 * Instead, we use the Search Console Sitemaps API, which is Google's current
 * recommended programmatic alternative:
 *   PUT https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}
 *   Docs: https://developers.google.com/webmaster-tools/v1/sitemaps/submit
 *
 * Authentication: same service account as the URL Inspection API (step 0),
 * using the `webmasters` (non-readonly) scope — already supported by googleAuth.ts.
 *
 * Failure policy (matches notify-indexnow.ts):
 *   Errors are logged but the script always exits 0.
 *   A notification failure must never block or fail a deployment.
 *
 * Required environment variables:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON  Service account key JSON (full string)
 */

import { getGoogleAccessToken } from './lib/googleAuth'

// Sitemaps API requires full webmasters scope (not readonly)
const WEBMASTERS_SCOPE = ['https://www.googleapis.com/auth/webmasters']

const SITE_URL = 'sc-domain:bitkittools.com'
const SITEMAP_URL = 'https://bitkittools.com/sitemap.xml'

// The Sitemaps API path segments must each be URL-encoded separately.
const SITEMAPS_API_ENDPOINT = [
  'https://www.googleapis.com/webmasters/v3/sites',
  encodeURIComponent(SITE_URL),
  'sitemaps',
  encodeURIComponent(SITEMAP_URL),
].join('/')

async function submitSitemap(accessToken: string): Promise<void> {
  console.log(`[notify-gsc] Submitting sitemap: ${SITEMAP_URL}`)
  console.log(`[notify-gsc] Endpoint: PUT ${SITEMAPS_API_ENDPOINT}`)

  let response: Response
  try {
    response = await fetch(SITEMAPS_API_ENDPOINT, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (err: unknown) {
    console.error(`[notify-gsc] Network error during sitemap submission: ${String(err)}`)
    return
  }

  // A successful submit returns HTTP 200 with an empty body.
  if (response.ok) {
    console.log(`[notify-gsc] Sitemap submitted successfully — HTTP ${response.status}`)
  } else {
    const text = await response.text().catch(() => '')
    console.error(
      `[notify-gsc] Sitemaps API returned HTTP ${response.status}. Response: ${text}`
    )
  }
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.warn(
      '[notify-gsc] GOOGLE_SERVICE_ACCOUNT_JSON is not set. Skipping GSC sitemap notification.'
    )
    return
  }

  let accessToken: string
  try {
    accessToken = await getGoogleAccessToken(WEBMASTERS_SCOPE)
  } catch (err: unknown) {
    console.error(`[notify-gsc] Failed to obtain Google access token: ${String(err)}`)
    return
  }

  await submitSitemap(accessToken)
}

main().catch((err: unknown) => {
  // Last-resort catch: log but do not re-throw so the process exits 0
  console.error(`[notify-gsc] Unexpected error: ${String(err)}`)
})
