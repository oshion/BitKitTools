/**
 * Broken Internal Link Checker — CLI Entry Point
 *
 * Scans out/ for all .html files, extracts internal <a href> links,
 * and verifies each resolves to an actual file in out/.
 *
 * Exit 0 = no broken links (CI gate passes)
 * Exit 1 = broken links found OR out/ directory missing
 *
 * Usage: npx tsx scripts/check-broken-links.ts
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { findBrokenLinks } from './lib/checkBrokenLinks'

const OUT_DIR = join(process.cwd(), 'out')

function collectFiles(dir: string): string[] {
  const results: string[] = []
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...collectFiles(fullPath))
    } else {
      results.push(fullPath)
    }
  }
  return results
}

function toRelativePosix(fullPath: string): string {
  return relative(OUT_DIR, fullPath).replace(/\\/g, '/')
}

function main(): void {
  if (!existsSync(OUT_DIR)) {
    console.error(
      '[check-broken-links] Error: out/ directory not found.\n' +
        'Run "npm run build" first to generate the static output.'
    )
    process.exit(1)
  }

  console.log('[check-broken-links] Scanning out/ for broken internal links…')

  const allFiles = collectFiles(OUT_DIR)
  const existingPaths = new Set(allFiles.map(toRelativePosix))

  const htmlFiles = new Map<string, string>()
  for (const fullPath of allFiles) {
    if (fullPath.endsWith('.html')) {
      const relPath = toRelativePosix(fullPath)
      const content = readFileSync(fullPath, 'utf-8')
      htmlFiles.set(relPath, content)
    }
  }

  console.log(
    `[check-broken-links] Found ${htmlFiles.size} HTML file(s), ${existingPaths.size} total file(s) in out/`
  )

  const broken = findBrokenLinks(htmlFiles, existingPaths)

  if (broken.length === 0) {
    console.log('[check-broken-links] ✓ No broken internal links found.')
    process.exit(0)
  }

  console.error(`[check-broken-links] ✗ Found ${broken.length} broken internal link(s):\n`)
  for (const { sourceFile, href } of broken) {
    console.error(`  ${sourceFile}\n    → ${href}`)
  }
  console.error('')
  process.exit(1)
}

main()
