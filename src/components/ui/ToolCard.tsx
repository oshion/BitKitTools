import Link from 'next/link'
import { localeHref } from '@/lib/utils/locale-href'
import type { ToolConfig } from '@/types/tool'

type ToolCardProps = {
  tool: ToolConfig
  locale: 'en' | 'ko'
  /**
   * Next.js defaults to auto-prefetching every in-viewport <Link>. Fine for a
   * handful of "related tools" links, but the homepage renders up to ~20
   * tool cards at once — pass false there to avoid the prefetch fan-out
   * dragging down its Lighthouse performance score (see data/reports).
   */
  prefetch?: boolean
}

export default function ToolCard({ tool, locale, prefetch }: ToolCardProps) {
  const href = localeHref(locale, `/${tool.category}/${tool.slug}`)

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className="block rounded-lg bg-[#141414] border border-neutral-800 p-6 hover:bg-[#1a1a1a] transition-colors"
    >
      <h3 className="text-sm font-medium text-neutral-400 mb-2">{tool.title[locale]}</h3>
      <p className="text-sm text-neutral-300 leading-relaxed">{tool.description[locale]}</p>
    </Link>
  )
}
