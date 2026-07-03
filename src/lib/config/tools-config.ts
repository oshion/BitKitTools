import type { ToolCategory, ToolConfig } from '@/types/tool'

export const toolsConfig: ToolConfig[] = []

export const TOOL_CATEGORIES: ToolCategory[] = ['developer', 'travel', 'beer', 'baby']

export function getToolBySlug(category: ToolCategory, slug: string): ToolConfig | undefined {
  return toolsConfig.find((t) => t.category === category && t.slug === slug)
}

export function getToolsByCategory(category: ToolCategory): ToolConfig[] {
  return toolsConfig.filter((t) => t.category === category)
}

export function getPopularTools(): ToolConfig[] {
  return toolsConfig.filter((t) => t.popular)
}

export function getRecentTools(limit: number): ToolConfig[] {
  return [...toolsConfig]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, limit)
}

export function getRelatedTools(toolId: string): ToolConfig[] {
  const tool = toolsConfig.find((t) => t.id === toolId)
  if (!tool) return []

  return tool.relatedToolIds.flatMap((relId) => {
    const found = toolsConfig.find((t) => t.id === relId)
    return found ? [found] : []
  })
}
