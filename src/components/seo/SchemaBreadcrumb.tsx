type BreadcrumbItem = {
  name: string
  url: string
}

type SchemaBreadcrumbProps = {
  items: BreadcrumbItem[]
}

export default function SchemaBreadcrumb({ items }: SchemaBreadcrumbProps) {
  if (items.length === 0) {
    return null
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
