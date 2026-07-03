import Link from 'next/link'
import type { ToolConfig } from '@/types/tool'

type ToolCardProps = {
  tool: ToolConfig
  locale: 'en' | 'ko'
}

export default function ToolCard({ tool, locale }: ToolCardProps) {
  const href =
    locale === 'ko'
      ? `/ko/${tool.category}/${tool.slug}`
      : `/${tool.category}/${tool.slug}`

  return (
    <Link
      href={href}
      className="block rounded-lg bg-[#141414] border border-neutral-800 p-6 hover:bg-[#1a1a1a] transition-colors"
    >
      <h3 className="text-sm font-medium text-neutral-400 mb-2">{tool.title[locale]}</h3>
      <p className="text-sm text-neutral-300 leading-relaxed">{tool.description[locale]}</p>
    </Link>
  )
}
