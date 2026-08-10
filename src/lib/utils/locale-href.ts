import type { Locale } from '@/i18n/routing'

/**
 * Builds a locale-aware href.
 *
 * Production static export relies on scripts/postbuild.mjs copying out/en/ → out/
 * so EN is reachable prefix-free (matches the canonical URL set in generateMetadata,
 * per ADR-007). `next dev` has no such copy step, so EN routes only exist under
 * /en — using a prefix-less href there 404s. NODE_ENV is inlined at build time by
 * Next.js, so this branch is static per environment (no hydration mismatch).
 *
 * Always returns a trailing-slash path (idempotent — a path that already ends
 * in `/` is left alone) to match `trailingSlash: true` in next.config.mjs: the
 * actual exported files live at `.../index.html`, so an href/canonical/sitemap
 * entry missing the trailing slash forces an extra redirect hop before
 * reaching the real page — this was confirmed as the likely cause of a large
 * "Page with redirect" bucket in Search Console (2026-08).
 */
export function localeHref(locale: Locale, path = ''): string {
  const withLeadingSlash = path === '' ? '' : path.startsWith('/') ? path : `/${path}`
  const suffix =
    withLeadingSlash === '' || withLeadingSlash.endsWith('/')
      ? withLeadingSlash
      : `${withLeadingSlash}/`

  if (locale === 'ko') {
    return suffix === '' ? '/ko/' : `/ko${suffix}`
  }

  if (process.env.NODE_ENV === 'development') {
    return suffix === '' ? '/en/' : `/en${suffix}`
  }

  return suffix || '/'
}

/** Strips a leading /en or /ko segment, returning the locale-agnostic path. */
export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(en|ko)(?=\/|$)/)
  return match ? pathname.slice(match[0].length) : pathname
}
