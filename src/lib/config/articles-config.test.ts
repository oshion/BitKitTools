import { articlesConfig, getArticleBySlug, getArticlesByCategory, getArticlePaths } from './articles-config'
import { toolsConfig } from './tools-config'
import { articleBodies } from '@/components/articles'

describe('articlesConfig', () => {
  it('has unique ids and URL-safe slugs', () => {
    const ids = articlesConfig.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const a of articlesConfig) expect(a.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('has complete EN and KO metadata for every article', () => {
    for (const a of articlesConfig) {
      for (const locale of ['en', 'ko'] as const) {
        expect(a.title[locale].trim()).not.toBe('')
        expect(a.description[locale].length).toBeGreaterThanOrEqual(80)
        expect(a.description[locale].length).toBeLessThanOrEqual(170)
        expect(a.keywords[locale].length).toBeGreaterThan(0)
        for (const item of a.faq) {
          expect(item.question[locale].trim()).not.toBe('')
          expect(item.answer[locale].trim()).not.toBe('')
        }
      }
      expect(a.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(a.updatedAt >= a.publishedAt).toBe(true)
      expect(a.readingMinutes).toBeGreaterThan(0)
    }
  })

  it('only relates to tools that exist', () => {
    const toolIds = new Set(toolsConfig.map((t) => t.id))
    for (const a of articlesConfig) for (const id of a.relatedToolIds) expect(toolIds.has(id)).toBe(true)
  })

  it('has a body component registered for every article', () => {
    for (const a of articlesConfig) expect(articleBodies[a.slug]).toBeDefined()
  })
})

describe('harness framework article', () => {
  const article = getArticleBySlug('developer', 'ai-vibe-coding-harness-framework')

  it('exists under the developer category', () => {
    expect(article).toBeDefined()
    expect(getArticlesByCategory('developer')).toContain(article)
  })

  it('links to the harness_framework_poor repository and credits the original', () => {
    const urls = article?.externalLinks.map((l) => l.url)
    expect(urls).toContain('https://github.com/oshion/harness_framework_poor')
    expect(urls).toContain('https://github.com/jha0313/harness_framework')
  })

  it('targets the main search intents in its title', () => {
    expect(article?.title.ko).toMatch(/바이브코딩/)
    expect(article?.title.ko).toMatch(/하네스/)
    expect(article?.title.en).toMatch(/Vibe Coding/)
    expect(article?.title.en).toMatch(/Harness/)
  })
})

describe('getArticlePaths', () => {
  it('returns category/articles/slug paths for the sitemap', () => {
    expect(getArticlePaths()).toContainEqual({
      path: '/developer/articles/ai-vibe-coding-harness-framework',
      lastModified: getArticleBySlug('developer', 'ai-vibe-coding-harness-framework')?.updatedAt,
    })
  })
})
