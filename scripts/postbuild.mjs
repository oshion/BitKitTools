/**
 * postbuild.mjs
 *
 * With next-intl `localePrefix: 'as-needed'` and `output: 'export'`,
 * the default locale (EN) is generated at out/en/ instead of out/.
 * This script copies the EN content to out/ so that / and /en/ both
 * serve English pages, matching the as-needed URL design.
 */
import { cp } from 'node:fs/promises'
import { join } from 'node:path'

const OUT_DIR = join(process.cwd(), 'out')
const EN_DIR = join(OUT_DIR, 'en')

async function main() {
  try {
    await cp(EN_DIR, OUT_DIR, { recursive: true })
    console.log('[postbuild] Copied out/en/ → out/ (default locale EN at root)')
  } catch (err) {
    // If out/en doesn't exist, nothing to do (e.g., no-prefix build variant)
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
      throw err
    }
  }
}

main()
