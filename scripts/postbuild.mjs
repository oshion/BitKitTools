/**
 * postbuild.mjs
 *
 * With next-intl `localePrefix: 'as-needed'` and `output: 'export'`,
 * the default locale (EN) is generated at out/en/ instead of out/.
 * This script copies the EN content to out/ so that / and /en/ both
 * serve English pages, matching the as-needed URL design.
 */
import { cp, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const OUT_DIR = join(process.cwd(), 'out')
const EN_DIR = join(OUT_DIR, 'en')
const KO_DIR = join(OUT_DIR, 'ko')

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

  // next/og's opengraph-image route (src/app/[locale]/opengraph-image.tsx) is emitted
  // as an extensionless file with a cache-busting query hash baked into <meta og:image>.
  // Nginx can't infer a mime type without an extension, and the hash isn't stable across
  // builds, so we copy the rendered PNG bytes to a fixed .png path per locale. Page-level
  // `generateMetadata` functions reference these fixed paths directly (see rule 15).
  try {
    await mkdir(join(OUT_DIR, 'og'), { recursive: true })
    await cp(join(EN_DIR, 'opengraph-image'), join(OUT_DIR, 'og', 'default-en.png'))
    await cp(join(KO_DIR, 'opengraph-image'), join(OUT_DIR, 'og', 'default-ko.png'))
    console.log('[postbuild] Copied opengraph-image output → out/og/default-{en,ko}.png')
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
      throw err
    }
  }

  // Quiz result share pages each have a result-specific opengraph-image.
  // Slugs are discovered from the built output directory so this script doesn't
  // need updating when personas/characters change in their config files.
  await copyResultOgImages(['baby', 'temperament-quiz', 'result'], 'temperament')
  await copyResultOgImages(['fun', 'chiikawa-personality-test', 'result'], 'chiikawa')
}

/**
 * Copies out/{en,ko}/<resultSubPath>/<slug>/opengraph-image → out/og/<ogDirName>/<slug>-{en,ko}.png
 * @param {string[]} resultSubPath
 * @param {string} ogDirName
 */
async function copyResultOgImages(resultSubPath, ogDirName) {
  const resultEnDir = join(EN_DIR, ...resultSubPath)
  try {
    const slugs = await readdir(resultEnDir)
    await mkdir(join(OUT_DIR, 'og', ogDirName), { recursive: true })

    let copied = 0
    for (const slug of slugs) {
      for (const [locale, localeDir] of [['en', EN_DIR], ['ko', KO_DIR]]) {
        const src = join(localeDir, ...resultSubPath, slug, 'opengraph-image')
        const dest = join(OUT_DIR, 'og', ogDirName, `${slug}-${locale}.png`)
        try {
          await cp(src, dest)
          copied++
        } catch (err) {
          if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') throw err
        }
      }
    }
    console.log(`[postbuild] Copied ${copied} ${ogDirName} result OG images → out/og/${ogDirName}/`)
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
      throw err
    }
    // result directory doesn't exist — build may not include these routes yet
  }
}

main()
