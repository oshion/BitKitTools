import type { ToolFaqItem } from '@/types/tool'

type SchemaFaqPageProps = {
  faq: ToolFaqItem[]
  locale: 'en' | 'ko'
}

export default function SchemaFaqPage({ faq, locale }: SchemaFaqPageProps) {
  if (faq.length === 0) {
    return null
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question[locale],
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer[locale],
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
