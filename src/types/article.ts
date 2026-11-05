import type { LocalizedText, ToolCategory, ToolFaqItem } from './tool'

export type ArticleExternalLink = {
  label: LocalizedText
  url: string
  /** 'repository' links are also described as SoftwareSourceCode in JSON-LD */
  kind: 'repository' | 'reference'
}

// Non-tool explanatory content. Metadata lives in lib/config/articles-config.ts and the
// body in components/articles/{slug}/ArticleBody.tsx (docs/screens/developer-articles.md).
export type ArticleConfig = {
  id: string
  slug: string
  category: ToolCategory
  title: LocalizedText
  description: LocalizedText
  keywords: { en: string[]; ko: string[] }
  /** YYYY-MM-DD */
  publishedAt: string
  /** YYYY-MM-DD */
  updatedAt: string
  readingMinutes: number
  faq: ToolFaqItem[]
  relatedToolIds: string[]
  externalLinks: ArticleExternalLink[]
}
