import type { ArticleConfig } from '@/types/article'

type SchemaArticleProps = {
  article: ArticleConfig
  locale: 'en' | 'ko'
  url: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'

export default function SchemaArticle({ article, locale, url }: SchemaArticleProps) {
  const organization = { '@type': 'Organization', name: 'BitKitTools', url: `${SITE_URL}/` }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.title[locale],
    description: article.description[locale],
    inLanguage: locale,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: url,
    keywords: article.keywords[locale].join(', '),
    author: organization,
    publisher: organization,
    about: article.externalLinks
      .filter((link) => link.kind === 'repository')
      .map((link) => ({ '@type': 'SoftwareSourceCode', name: link.label[locale], codeRepository: link.url })),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
