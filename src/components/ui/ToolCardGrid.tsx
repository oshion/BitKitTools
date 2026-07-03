import type { ToolConfig } from '@/types/tool'
import ToolCard from './ToolCard'

type ToolCardGridProps = {
  tools: ToolConfig[]
  locale: 'en' | 'ko'
  emptyMessage?: string
}

export default function ToolCardGrid({ tools, locale, emptyMessage }: ToolCardGridProps) {
  if (tools.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-neutral-500">{emptyMessage}</p>
    ) : null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} locale={locale} />
      ))}
    </div>
  )
}
