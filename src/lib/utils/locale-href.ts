import type { Locale } from '@/i18n/routing'

/**
 * Builds a locale-aware href.
 *
 * Production static export relies on scripts/postbuild.mjs copying out/en/ → out/
 * so EN is reachable prefix-free (matches the canonical URL set in generateMetadata,
 * per ADR-007). `next dev` has no such copy step, so EN routes only exist under
 * /en — using a prefix-free href there 404s. NODE_ENV is inlined at build time by
 * Next.js, so this branch is static per environment (no hydration mismatch).
 */
export function localeHref(locale: Locale, path = ''): string {
  const suffix = path === '' ? '' : path.startsWith('/') ? path : `/${path}`

  if (locale === 'ko') {
    return `/ko${suffix}`
  }

  return process.env.NODE_ENV === 'development' ? `/en${suffix}` : suffix || '/'
}

/** Strips a leading /en or /ko segment, returning the locale-agnostic path. */
export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(en|ko)(?=\/|$)/)
  return match ? pathname.slice(match[0].length) : pathname
}
