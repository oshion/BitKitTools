export type DisclaimerType = 'none' | 'general' | 'medical' | 'financial' | 'legal'
export type AiOverviewResistance = 'high' | 'medium' | 'low'
export type ToolStatus = 'testing' | 'validated' | 'underperforming'
export type SchemaType = 'WebApplication'
export type ToolCategory = 'developer' | 'travel' | 'beer' | 'baby'

export type AdSlotConfig = {
  position: 'header' | 'result' | 'mid-content' | 'above-faq' | 'footer'
  minHeightPx: number
}

export type LocalizedText = { en: string; ko: string }

export type ToolFaqItem = {
  question: LocalizedText
  answer: LocalizedText
}

export type ToolConfig = {
  id: string
  slug: string
  category: ToolCategory
  title: LocalizedText
  description: LocalizedText
  keywords: { en: string[]; ko: string[] }
  schemaType: SchemaType
  faq: ToolFaqItem[]
  relatedToolIds: string[]
  adSlots: AdSlotConfig[]
  ogImage: string
  status: ToolStatus
  disclaimerType: DisclaimerType
  aiOverviewResistance: AiOverviewResistance
  addedAt: string
  popular: boolean
}
