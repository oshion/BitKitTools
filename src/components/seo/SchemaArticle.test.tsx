import { render } from '@testing-library/react'
import SchemaArticle from './SchemaArticle'
import type { ArticleConfig } from '@/types/article'

const article: ArticleConfig = {
  id: 'a',
  slug: 'a',
  category: 'developer',
  title: { en: 'Title EN', ko: '제목' },
  description: { en: 'Desc EN', ko: '설명' },
  keywords: { en: ['k1', 'k2'], ko: ['키1'] },
  publishedAt: '2026-11-05',
  updatedAt: '2026-11-06',
  readingMinutes: 7,
  faq: [],
  relatedToolIds: [],
  externalLinks: [{ label: { en: 'Repo', ko: '저장소' }, url: 'https://github.com/x/y', kind: 'repository' }],
}

function jsonLd(container: HTMLElement) {
  return JSON.parse(container.querySelector('script[type="application/ld+json"]')!.innerHTML)
}

describe('SchemaArticle', () => {
  it('emits a TechArticle with dates, language and publisher', () => {
    const { container } = render(<SchemaArticle article={article} locale="ko" url="https://bitkittools.com/ko/x/" />)
    const schema = jsonLd(container)
    expect(schema['@type']).toBe('TechArticle')
    expect(schema.headline).toBe('제목')
    expect(schema.description).toBe('설명')
    expect(schema.inLanguage).toBe('ko')
    expect(schema.datePublished).toBe('2026-11-05')
    expect(schema.dateModified).toBe('2026-11-06')
    expect(schema.mainEntityOfPage).toBe('https://bitkittools.com/ko/x/')
    expect(schema.keywords).toBe('키1')
    expect(schema.publisher.name).toBe('BitKitTools')
  })

  it('describes linked repositories as SoftwareSourceCode', () => {
    const { container } = render(<SchemaArticle article={article} locale="en" url="https://bitkittools.com/x/" />)
    expect(jsonLd(container).about).toEqual([
      { '@type': 'SoftwareSourceCode', name: 'Repo', codeRepository: 'https://github.com/x/y' },
    ])
  })
})
