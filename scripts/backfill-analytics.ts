/**
 * Analytics Backfill Script
 *
 * Re-collects GA4 and GSC raw data for an explicit historical date range,
 * writing the same data/raw/{ga4,gsc,gsc-page-totals,ga4-bounce}-{date}.json
 * files that collect-analytics.ts's daily run produces. Reuses that script's
 * collectors so both entry points stay in sync.
 *
 * Clarity is intentionally NOT backfilled here: the Clarity Data Export API
 * only supports the last 1–3 rolling days (no calendar-date parameter
 * exists), so historical Clarity data cannot be re-fetched once its window
 * has passed — see collectClarity's doc comment in collect-analytics.ts.
 *
 * Usage:
 *   npx tsx scripts/backfill-analytics.ts --start 2026-08-01 --end 2026-08-09
 *
 * Required environment variables (same as collect-analytics.ts):
 *   - GOOGLE_SERVICE_ACCOUNT_JSON
 *   - GA4_PROPERTY_ID
 */

import { parseDateRange } from './lib/backfillDateRange'
import {
  collectGa4,
  collectGa4Bounce,
  collectGsc,
  collectGscPageTotals,
} from './collect-analytics'

interface ParsedArgs {
  start: string
  end: string
}

export function parseArgs(argv: string[]): ParsedArgs {
  const startIdx = argv.indexOf('--start')
  const endIdx = argv.indexOf('--end')
  const start = startIdx !== -1 ? argv[startIdx + 1] : undefined
  const end = endIdx !== -1 ? argv[endIdx + 1] : undefined

  if (!start || !end) {
    throw new Error(
      '[backfill-analytics] Usage: --start YYYY-MM-DD --end YYYY-MM-DD'
    )
  }

  return { start, end }
}

async function main(): Promise<void> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const ga4PropertyId = process.env.GA4_PROPERTY_ID

  if (!serviceAccountJson || !ga4PropertyId) {
    const missing = [
      !serviceAccountJson && 'GOOGLE_SERVICE_ACCOUNT_JSON',
      !ga4PropertyId && 'GA4_PROPERTY_ID',
    ]
      .filter(Boolean)
      .join(', ')
    console.error(
      `[backfill-analytics] Missing required environment variable(s): ${missing}`
    )
    process.exit(1)
  }

  const { start, end } = parseArgs(process.argv.slice(2))
  const dates = parseDateRange(start, end)

  const todayStr = new Date().toISOString().slice(0, 10)
  if (dates.some((d) => d >= todayStr)) {
    console.error(
      `[backfill-analytics] Refusing to backfill today or a future date (today is ${todayStr}). Pick an end date before today.`
    )
    process.exit(1)
  }

  console.log(`[backfill-analytics] Backfilling ${dates.length} date(s): ${dates[0]} → ${dates[dates.length - 1]}`)

  let successCount = 0

  for (const date of dates) {
    try {
      await collectGa4(date)
      successCount++
    } catch (err: unknown) {
      console.error(`[GA4] Backfill failed for ${date}: ${String(err)}`)
    }

    try {
      await collectGa4Bounce(date)
    } catch (err: unknown) {
      console.error(`[GA4-Bounce] Backfill failed for ${date}: ${String(err)}`)
    }

    try {
      await collectGsc(date)
      successCount++
    } catch (err: unknown) {
      console.error(`[GSC] Backfill failed for ${date}: ${String(err)}`)
    }

    try {
      await collectGscPageTotals(date)
      successCount++
    } catch (err: unknown) {
      console.error(`[GSC] Page-totals backfill failed for ${date}: ${String(err)}`)
    }
  }

  if (successCount === 0) {
    console.error('[backfill-analytics] All collections failed. Exiting with error.')
    process.exit(1)
  }

  console.log('[backfill-analytics] Done.')
}

if (process.env['NODE_ENV'] !== 'test' && require.main === module) {
  main().catch((err: unknown) => {
    console.error(`[backfill-analytics] Fatal error: ${String(err)}`)
    process.exit(1)
  })
}
