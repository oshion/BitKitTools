import type { ComponentType } from 'react'
import HarnessFrameworkArticle from './ai-vibe-coding-harness-framework/ArticleBody'

// slug → article body. Adding an article = body component + one line here +
// one entry in lib/config/articles-config.ts (docs/screens/developer-articles.md).
export const articleBodies: Record<string, ComponentType<{ locale: 'en' | 'ko' }>> = {
  'ai-vibe-coding-harness-framework': HarnessFrameworkArticle,
}
