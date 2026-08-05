/**
 * Broken Internal Link Checker — pure functions (no filesystem access)
 *
 * Parses <a href> attributes from HTML strings and checks whether each
 * internal link resolves to an actual file in the out/ directory.
 *
 * Design decisions:
 * - No HTML parser library — uses regex, matching project convention (notify-indexnow.ts).
 * - External URLs are skipped without network requests (CI stability).
 * - trailingSlash: true means routes live at out/{path}/index.html.
 */

const SITE_HOST_PATTERNS = ['bitkittools.com', 'www.bitkittools.com']

const SKIP_SCHEMES = ['mailto:', 'tel:', 'javascript:']

export interface BrokenLink {
  /** out/ 기준 상대 경로의 HTML 파일 (링크가 발견된 페이지) */
  sourceFile: string
  /** 깨진 것으로 판단된 href 원본 값 */
  href: string
}

/**
 * Extract all href values from an HTML string.
 * Handles both double-quoted and single-quoted href attributes.
 */
export function extractHrefs(html: string): string[] {
  const hrefs: string[] = []
  // Match href="..." or href='...'
  const re = /href=(?:"([^"]*?)"|'([^']*?)')/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const value = match[1] ?? match[2]
    if (value !== undefined && value !== '') {
      hrefs.push(value)
    }
  }
  return hrefs
}

/**
 * Return true if the href should be skipped (not checked).
 */
export function shouldSkipHref(href: string): boolean {
  // Pure anchor
  if (href.startsWith('#')) return true
  // Special schemes
  if (SKIP_SCHEMES.some((s) => href.toLowerCase().startsWith(s))) return true
  // External URLs whose host is NOT bitkittools.com
  if (href.startsWith('http://') || href.startsWith('https://')) {
    try {
      const url = new URL(href)
      return !SITE_HOST_PATTERNS.includes(url.hostname.toLowerCase())
    } catch {
      // Malformed URL — skip it
      return true
    }
  }
  return false
}

/**
 * Normalize an internal href (may be absolute path like /beer/ or
 * a bitkittools.com absolute URL) to the key we should look for
 * in existingPaths.
 *
 * Returns the normalized key, or null if the href should be skipped.
 */
export function normalizeHref(href: string): string | null {
  if (shouldSkipHref(href)) return null

  let path = href

  // bitkittools.com absolute URL → extract path portion
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      path = url.pathname + url.search + url.hash
    } catch {
      return null
    }
  }

  // Strip query string and hash
  path = path.replace(/[?#].*$/, '')

  // Strip leading slash
  if (path.startsWith('/')) {
    path = path.slice(1)
  }

  // Determine if this is a static asset (has extension) or a route
  const lastSegment = path.split('/').pop() ?? ''
  const hasExtension = lastSegment.includes('.') && !lastSegment.startsWith('.')

  if (hasExtension) {
    // Static asset — look up path directly
    return path === '' ? null : path
  } else {
    // Route — trailingSlash: true means out/{path}/index.html
    if (path === '') {
      return 'index.html'
    }
    const normalized = path.endsWith('/') ? path : path + '/'
    return normalized + 'index.html'
  }
}

/**
 * Find all broken internal links across the provided HTML files.
 *
 * @param htmlFiles  Map of (out/-relative path → HTML string)
 * @param existingPaths  Set of all out/-relative file paths (slashes as '/')
 */
export function findBrokenLinks(
  htmlFiles: Map<string, string>,
  existingPaths: Set<string>
): BrokenLink[] {
  const broken: BrokenLink[] = []

  for (const [sourceFile, html] of htmlFiles) {
    const hrefs = extractHrefs(html)
    for (const href of hrefs) {
      const key = normalizeHref(href)
      if (key === null) continue // skip external / anchors / special schemes
      if (!existingPaths.has(key)) {
        broken.push({ sourceFile, href })
      }
    }
  }

  return broken
}
