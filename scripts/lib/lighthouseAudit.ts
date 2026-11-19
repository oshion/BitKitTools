import { LIGHTHOUSE_AUDIT_TOKEN } from '../../src/lib/utils/auditUserAgent'

/**
 * Lighthouse's default mobile user agent plus our audit token. Lighthouse 12 does not add
 * `Chrome-Lighthouse` itself, so without this the weekly audit loaded GA4/Clarity and
 * recorded one fake session per audited page (found in the 2026-11-16 report review).
 */
export const LIGHTHOUSE_AUDIT_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  `Chrome/136.0.0.0 Mobile Safari/537.36 ${LIGHTHOUSE_AUDIT_TOKEN}`

/** Arguments for `npx lhci collect`. The command runs through a shell, so values with spaces are quoted. */
export function buildLhciCollectArgs(urls: readonly string[]): string[] {
  return [
    'lhci',
    'collect',
    // Prevent lhci from auto-loading the repo-root .lighthouserc.json (used by
    // test-gate.yml for staticDistDir-based PR audits). Without this flag, its
    // staticDistDir setting causes lhci to spin up an unrelated local static
    // server and merge that server's port into our production URLs
    // (observed as requests to "https://bitkittools.com:PORT/" that never load).
    '--no-lighthouserc',
    ...urls.map((url) => `--url=${url}`),
    '--numberOfRuns=1',
    '--settings.onlyCategories=performance,accessibility,best-practices,seo',
    '--settings.chromeFlags=--no-sandbox --disable-gpu --disable-dev-shm-usage',
    `--settings.emulatedUserAgent="${LIGHTHOUSE_AUDIT_USER_AGENT}"`,
  ]
}
