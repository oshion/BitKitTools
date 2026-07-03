import type { ToolConfig } from '@/types/tool'

type SchemaWebApplicationProps = {
  tool: ToolConfig
  locale: 'en' | 'ko'
  url: string
}

export default function SchemaWebApplication({ tool, locale, url }: SchemaWebApplicationProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title[locale],
    description: tool.description[locale],
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
