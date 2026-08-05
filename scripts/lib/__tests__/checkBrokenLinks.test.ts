/**
 * @jest-environment node
 */

import { findBrokenLinks, extractHrefs, shouldSkipHref, normalizeHref } from '../checkBrokenLinks'

// ── extractHrefs ─────────────────────────────────────────────────────────────

describe('extractHrefs', () => {
  it('extracts double-quoted hrefs', () => {
    const html = '<a href="/beer/">Beer</a>'
    expect(extractHrefs(html)).toEqual(['/beer/'])
  })

  it('extracts single-quoted hrefs', () => {
    const html = "<a href='/developer/'>Dev</a>"
    expect(extractHrefs(html)).toEqual(['/developer/'])
  })

  it('extracts multiple hrefs', () => {
    const html = '<a href="/a/">A</a> <a href="/b/">B</a>'
    expect(extractHrefs(html)).toEqual(['/a/', '/b/'])
  })

  it('handles case-insensitive HREF attribute', () => {
    const html = '<A HREF="/test/">Test</A>'
    expect(extractHrefs(html)).toEqual(['/test/'])
  })

  it('returns empty array for no hrefs', () => {
    expect(extractHrefs('<p>No links</p>')).toEqual([])
  })

  it('ignores empty href values', () => {
    const html = '<a href="">empty</a><a href="/real/">real</a>'
    expect(extractHrefs(html)).toEqual(['/real/'])
  })
})

// ── shouldSkipHref ───────────────────────────────────────────────────────────

describe('shouldSkipHref', () => {
  it('skips pure anchor #section', () => {
    expect(shouldSkipHref('#section')).toBe(true)
  })

  it('skips mailto: links', () => {
    expect(shouldSkipHref('mailto:hello@example.com')).toBe(true)
  })

  it('skips tel: links', () => {
    expect(shouldSkipHref('tel:+1234567890')).toBe(true)
  })

  it('skips javascript: links', () => {
    expect(shouldSkipHref('javascript:void(0)')).toBe(true)
  })

  it('skips external https links', () => {
    expect(shouldSkipHref('https://example.com/page')).toBe(true)
  })

  it('skips external http links', () => {
    expect(shouldSkipHref('http://other.com/')).toBe(true)
  })

  it('does NOT skip bitkittools.com absolute URL', () => {
    expect(shouldSkipHref('https://bitkittools.com/beer/')).toBe(false)
  })

  it('does NOT skip www.bitkittools.com absolute URL', () => {
    expect(shouldSkipHref('https://www.bitkittools.com/beer/')).toBe(false)
  })

  it('does NOT skip internal path /beer/', () => {
    expect(shouldSkipHref('/beer/')).toBe(false)
  })

  it('does NOT skip relative path beer/', () => {
    expect(shouldSkipHref('beer/')).toBe(false)
  })
})

// ── normalizeHref ─────────────────────────────────────────────────────────────

describe('normalizeHref', () => {
  it('returns null for anchor hrefs', () => {
    expect(normalizeHref('#faq')).toBeNull()
  })

  it('returns null for external hrefs', () => {
    expect(normalizeHref('https://example.com/')).toBeNull()
  })

  it('normalizes root / to index.html', () => {
    expect(normalizeHref('/')).toBe('index.html')
  })

  it('normalizes route /beer/ to beer/index.html', () => {
    expect(normalizeHref('/beer/')).toBe('beer/index.html')
  })

  it('normalizes route without trailing slash /beer to beer/index.html', () => {
    expect(normalizeHref('/beer')).toBe('beer/index.html')
  })

  it('normalizes deep route /beer/bac-calculator/ to beer/bac-calculator/index.html', () => {
    expect(normalizeHref('/beer/bac-calculator/')).toBe('beer/bac-calculator/index.html')
  })

  it('strips query string from route', () => {
    expect(normalizeHref('/beer/bac-calculator/?ref=x')).toBe('beer/bac-calculator/index.html')
  })

  it('strips hash from route', () => {
    expect(normalizeHref('/beer/bac-calculator/#faq')).toBe('beer/bac-calculator/index.html')
  })

  it('normalizes static asset /favicon.ico to favicon.ico', () => {
    expect(normalizeHref('/favicon.ico')).toBe('favicon.ico')
  })

  it('normalizes /robots.txt to robots.txt', () => {
    expect(normalizeHref('/robots.txt')).toBe('robots.txt')
  })

  it('normalizes bitkittools.com absolute URL to path', () => {
    expect(normalizeHref('https://bitkittools.com/beer/')).toBe('beer/index.html')
  })

  it('normalizes www.bitkittools.com absolute URL to path', () => {
    expect(normalizeHref('https://www.bitkittools.com/developer/json-formatter/')).toBe(
      'developer/json-formatter/index.html'
    )
  })

  it('handles /ko/ locale routes', () => {
    expect(normalizeHref('/ko/beer/bac-calculator/')).toBe('ko/beer/bac-calculator/index.html')
  })
})

// ── findBrokenLinks ──────────────────────────────────────────────────────────

describe('findBrokenLinks', () => {
  it('returns empty array when all internal links exist', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="/beer/">Beer</a>'],
    ])
    const existingPaths = new Set(['index.html', 'beer/index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('detects a missing internal link', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="/missing/">Gone</a>'],
    ])
    const existingPaths = new Set(['index.html'])
    const result = findBrokenLinks(htmlFiles, existingPaths)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ sourceFile: 'index.html', href: '/missing/' })
  })

  it('skips external domain links without checking', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="https://example.com/page">External</a>'],
    ])
    const existingPaths = new Set(['index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('skips #anchor links', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="#faq">FAQ</a>'],
    ])
    const existingPaths = new Set(['index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('skips mailto: links', () => {
    const htmlFiles = new Map([
      ['contact/index.html', '<a href="mailto:hi@example.com">Email</a>'],
    ])
    const existingPaths = new Set(['contact/index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('skips tel: links', () => {
    const htmlFiles = new Map([
      ['contact/index.html', '<a href="tel:+1234567">Call</a>'],
    ])
    const existingPaths = new Set(['contact/index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('correctly checks static assets like /favicon.ico', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="/favicon.ico">Icon</a>'],
    ])
    const existingPaths = new Set(['index.html', 'favicon.ico'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('detects missing static asset', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="/ads.txt">Ads</a>'],
    ])
    const existingPaths = new Set(['index.html'])
    const result = findBrokenLinks(htmlFiles, existingPaths)
    expect(result).toHaveLength(1)
    expect(result[0].href).toBe('/ads.txt')
  })

  it('handles trailing slash correctly for routes', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="/beer/bac-calculator/">BAC</a>'],
    ])
    const existingPaths = new Set(['index.html', 'beer/bac-calculator/index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('strips query string before checking', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="/beer/bac-calculator/?ref=nav">BAC</a>'],
    ])
    const existingPaths = new Set(['index.html', 'beer/bac-calculator/index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('strips hash before checking', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="/beer/#section">Beer</a>'],
    ])
    const existingPaths = new Set(['index.html', 'beer/index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('reports the correct sourceFile for each broken link', () => {
    const htmlFiles = new Map([
      ['beer/index.html', '<a href="/beer/nonexistent/">X</a>'],
      ['developer/index.html', '<a href="/developer/also-missing/">Y</a>'],
    ])
    const existingPaths = new Set(['beer/index.html', 'developer/index.html'])
    const result = findBrokenLinks(htmlFiles, existingPaths)
    expect(result).toHaveLength(2)
    expect(result.find((r) => r.sourceFile === 'beer/index.html')?.href).toBe(
      '/beer/nonexistent/'
    )
    expect(result.find((r) => r.sourceFile === 'developer/index.html')?.href).toBe(
      '/developer/also-missing/'
    )
  })

  it('handles bitkittools.com absolute URLs as internal links', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="https://bitkittools.com/beer/bac-calculator/">BAC</a>'],
    ])
    const existingPaths = new Set(['index.html', 'beer/bac-calculator/index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })

  it('detects missing bitkittools.com absolute URL', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="https://bitkittools.com/nonexistent/">X</a>'],
    ])
    const existingPaths = new Set(['index.html'])
    const result = findBrokenLinks(htmlFiles, existingPaths)
    expect(result).toHaveLength(1)
    expect(result[0].href).toBe('https://bitkittools.com/nonexistent/')
  })

  it('checks /ko/ locale routes correctly', () => {
    const htmlFiles = new Map([
      ['index.html', '<a href="/ko/beer/bac-calculator/">KO BAC</a>'],
    ])
    const existingPaths = new Set(['index.html', 'ko/beer/bac-calculator/index.html'])
    expect(findBrokenLinks(htmlFiles, existingPaths)).toEqual([])
  })
})
