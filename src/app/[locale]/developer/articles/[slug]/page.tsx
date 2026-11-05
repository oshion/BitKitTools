import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getArticleBySlug, getArticlesByCategory } from '@/lib/config/articles-config'
import { toolsConfig } from '@/lib/config/tools-config'
import { localeHref } from '@/lib/utils/locale-href'
import { articleBodies } from '@/components/articles'
import ToolCardGrid from '@/components/ui/ToolCardGrid'
import SchemaArticle from '@/components/seo/SchemaArticle'
import SchemaFaqPage from '@/components/seo/SchemaFaqPage'
import SchemaBreadcrumb from '@/components/seo/SchemaBreadcrumb'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const CATEGORY = 'developer'

export const dynamicParams = false

export function generateStaticParams() {
  return getArticlesByCategory(CATEGORY).map((article) => ({ slug: article.slug }))
}

function toLocale(locale: string): 'en' | 'ko' {
  return (routing.locales as readonly string[]).includes(locale) ? (locale as 'en' | 'ko') : 'en'
}

function articleUrls(slug: string) {
  const path = `/${CATEGORY}/articles/${slug}/`
  return { en: `${SITE_URL}${path}`, ko: `${SITE_URL}/ko${path}` }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const safeLocale = toLocale(locale)
  const article = getArticleBySlug(CATEGORY, slug)
  if (!article) return {}

  const urls = articleUrls(slug)
  const canonical = urls[safeLocale]
  const title = `${article.title[safeLocale]} — BitKitTools`

  return {
    title,
    description: article.description[safeLocale],
    keywords: article.keywords[safeLocale].join(', '),
    alternates: {
      canonical,
      languages: { en: urls.en, ko: urls.ko, 'x-default': urls.en },
    },
    openGraph: {
      title,
      description: article.description[safeLocale],
      url: canonical,
      siteName: 'BitKitTools',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [{ url: `${SITE_URL}/og/default-${safeLocale}.png`, width: 1200, height: 630 }],
    },
  }
}

export default async function DeveloperArticlePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const safeLocale = toLocale(locale)
  const isKo = safeLocale === 'ko'

  const article = getArticleBySlug(CATEGORY, slug)
  const Body = articleBodies[slug]
  if (!article || !Body) notFound()

  const pageUrl = articleUrls(slug)[safeLocale]
  const relatedTools = article.relatedToolIds.flatMap((id) => toolsConfig.filter((t) => t.id === id))
  const breadcrumbItems = [
    { name: 'Home', url: isKo ? `${SITE_URL}/ko/` : `${SITE_URL}/` },
    { name: isKo ? '개발자' : 'Developer', url: `${SITE_URL}${localeHref(safeLocale, `/${CATEGORY}`)}` },
    { name: article.title[safeLocale], url: pageUrl },
  ]

  return (
    <article className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-12">
      <SchemaBreadcrumb items={breadcrumbItems} />
      <SchemaArticle article={article} locale={safeLocale} url={pageUrl} />
      <SchemaFaqPage faq={article.faq} locale={safeLocale} />

      <header className="max-w-3xl space-y-4">
        <p className="text-sm text-neutral-500">
          {isKo ? '개발자 · 아티클' : 'Developer · Article'}
        </p>
        <h1 className="text-4xl font-semibold text-white leading-tight">{article.title[safeLocale]}</h1>
        <p className="text-sm text-neutral-500">
          <time dateTime={article.publishedAt}>{article.publishedAt}</time> ·{' '}
          {isKo ? `읽는 시간 ${article.readingMinutes}분` : `${article.readingMinutes} min read`} · BitKitTools
        </p>
      </header>

      <div className="max-w-3xl space-y-6">
        <Body locale={safeLocale} />
      </div>

      {/* FAQ */}
      <section className="max-w-3xl space-y-4">
        <h2 className="text-2xl font-semibold text-white">{isKo ? '자주 묻는 질문' : 'Frequently Asked Questions'}</h2>
        <dl className="space-y-6">
          {article.faq.map((item, i) => (
            <div key={i} className="space-y-2">
              <dt className="text-base font-medium text-neutral-200">{item.question[safeLocale]}</dt>
              <dd className="text-base text-neutral-400 leading-relaxed">{item.answer[safeLocale]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {relatedTools.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">{isKo ? '관련 도구' : 'Related Tools'}</h2>
          <ToolCardGrid tools={relatedTools} locale={safeLocale} />
        </section>
      )}
    </article>
  )
}
