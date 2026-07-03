import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'
import { toolsConfig, TOOL_CATEGORIES } from '@/lib/config/tools-config'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const LOCALES = ['en', 'ko'] as const

const LEGAL_PAGES = ['privacy-policy', 'terms', 'about', 'contact'] as const

function enUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}

function koUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/ko` : `${SITE_URL}/ko${path}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  // Home
  entries.push({
    url: enUrl('/'),
    alternates: { languages: { en: enUrl('/'), ko: koUrl('/') } },
    changeFrequency: 'weekly',
    priority: 1.0,
  })

  // Category pages
  for (const category of TOOL_CATEGORIES) {
    const path = `/${category}`
    entries.push({
      url: enUrl(path),
      alternates: { languages: { en: enUrl(path), ko: koUrl(path) } },
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // Tool pages — iterates over toolsConfig so new tools appear automatically
  for (const tool of toolsConfig) {
    const path = `/${tool.category}/${tool.slug}`
    entries.push({
      url: enUrl(path),
      alternates: { languages: { en: enUrl(path), ko: koUrl(path) } },
      changeFrequency: 'monthly',
      priority: 0.9,
      lastModified: tool.addedAt,
    })
  }

  // Legal pages
  for (const page of LEGAL_PAGES) {
    const path = `/${page}`
    entries.push({
      url: enUrl(path),
      alternates: { languages: { en: enUrl(path), ko: koUrl(path) } },
      changeFrequency: 'yearly',
      priority: 0.3,
    })
  }

  // KO-prefixed versions (needed so crawlers discover /ko/* URLs)
  // Home /ko
  entries.push({
    url: koUrl('/'),
    changeFrequency: 'weekly',
    priority: 1.0,
  })

  for (const category of TOOL_CATEGORIES) {
    entries.push({
      url: koUrl(`/${category}`),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const tool of toolsConfig) {
    entries.push({
      url: koUrl(`/${tool.category}/${tool.slug}`),
      changeFrequency: 'monthly',
      priority: 0.9,
      lastModified: tool.addedAt,
    })
  }

  for (const page of LEGAL_PAGES) {
    entries.push({
      url: koUrl(`/${page}`),
      changeFrequency: 'yearly',
      priority: 0.3,
    })
  }

  // Suppress unused variable warning — LOCALES kept for documentation
  void (LOCALES satisfies readonly string[])

  return entries
}
