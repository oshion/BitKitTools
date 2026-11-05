import Link from 'next/link'
import { localeHref } from '@/lib/utils/locale-href'
import type { ArticleConfig } from '@/types/article'

type ArticleCardListProps = {
  articles: ArticleConfig[]
  locale: 'en' | 'ko'
}

// Article cards for category pages. Wider than tool cards (one per row) and marked with
// reading time so they read as articles, not tools.
export default function ArticleCardList({ articles, locale }: ArticleCardListProps) {
  if (articles.length === 0) return null

  return (
    <ul className="space-y-3">
      {articles.map((article) => (
        <li key={article.id}>
          <Link
            href={localeHref(locale, `/${article.category}/articles/${article.slug}`)}
            className="block rounded-lg bg-[#141414] border border-neutral-800 border-l-2 border-l-[#f59e0b] p-6 hover:bg-[#1a1a1a] transition-colors"
          >
            <h3 className="text-lg font-medium text-white mb-2">{article.title[locale]}</h3>
            <p className="text-base text-neutral-300 leading-relaxed">{article.description[locale]}</p>
            <p className="mt-3 text-sm text-neutral-500">
              {article.publishedAt} ·{' '}
              {locale === 'ko' ? `읽는 시간 ${article.readingMinutes}분` : `${article.readingMinutes} min read`}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
