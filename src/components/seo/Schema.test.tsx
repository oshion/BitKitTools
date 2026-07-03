import { render } from '@testing-library/react'
import type { ToolConfig } from '@/types/tool'
import SchemaWebApplication from './SchemaWebApplication'
import SchemaFaqPage from './SchemaFaqPage'
import SchemaBreadcrumb from './SchemaBreadcrumb'

const mockTool: ToolConfig = {
  id: 'json-formatter',
  slug: 'json-formatter',
  category: 'developer',
  title: { en: 'JSON Formatter', ko: 'JSON 포맷터' },
  description: { en: 'Format JSON', ko: 'JSON 포맷' },
  keywords: { en: [], ko: [] },
  schemaType: 'WebApplication',
  faq: [
    {
      question: { en: 'What is JSON?', ko: 'JSON이란?' },
      answer: { en: 'A lightweight data format', ko: '경량 데이터 형식' },
    },
  ],
  relatedToolIds: [],
  adSlots: [],
  ogImage: '/og/json-formatter.png',
  status: 'validated',
  disclaimerType: 'general',
  aiOverviewResistance: 'high',
  addedAt: '2024-01-10',
  popular: true,
}

describe('SchemaWebApplication', () => {
  it('renders a script tag with application/ld+json type', () => {
    const { container } = render(
      <SchemaWebApplication
        tool={mockTool}
        locale="en"
        url="https://bitkittools.com/developer/json-formatter"
      />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
  })

  it('includes WebApplication @type and correct name', () => {
    const { container } = render(
      <SchemaWebApplication
        tool={mockTool}
        locale="en"
        url="https://bitkittools.com/developer/json-formatter"
      />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    const json = JSON.parse(script?.textContent ?? '{}') as {
      '@type': string
      name: string
      description: string
      url: string
    }
    expect(json['@type']).toBe('WebApplication')
    expect(json.name).toBe('JSON Formatter')
    expect(json.description).toBe('Format JSON')
    expect(json.url).toBe('https://bitkittools.com/developer/json-formatter')
  })

  it('uses correct locale for name and description', () => {
    const { container } = render(
      <SchemaWebApplication
        tool={mockTool}
        locale="ko"
        url="https://bitkittools.com/ko/developer/json-formatter"
      />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    const json = JSON.parse(script?.textContent ?? '{}') as { name: string; description: string }
    expect(json.name).toBe('JSON 포맷터')
    expect(json.description).toBe('JSON 포맷')
  })
})

describe('SchemaFaqPage', () => {
  it('renders nothing when faq array is empty', () => {
    const { container } = render(<SchemaFaqPage faq={[]} locale="en" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders FAQPage schema with correct @type', () => {
    const { container } = render(<SchemaFaqPage faq={mockTool.faq} locale="en" />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const json = JSON.parse(script?.textContent ?? '{}') as { '@type': string }
    expect(json['@type']).toBe('FAQPage')
  })

  it('includes question and answer in mainEntity', () => {
    const { container } = render(<SchemaFaqPage faq={mockTool.faq} locale="en" />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const json = JSON.parse(script?.textContent ?? '{}') as {
      mainEntity: Array<{ '@type': string; name: string; acceptedAnswer: { text: string } }>
    }
    expect(json.mainEntity).toHaveLength(1)
    expect(json.mainEntity[0]?.['@type']).toBe('Question')
    expect(json.mainEntity[0]?.name).toBe('What is JSON?')
    expect(json.mainEntity[0]?.acceptedAnswer.text).toBe('A lightweight data format')
  })

  it('uses correct locale for questions', () => {
    const { container } = render(<SchemaFaqPage faq={mockTool.faq} locale="ko" />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const json = JSON.parse(script?.textContent ?? '{}') as {
      mainEntity: Array<{ name: string }>
    }
    expect(json.mainEntity[0]?.name).toBe('JSON이란?')
  })
})

describe('SchemaBreadcrumb', () => {
  const breadcrumbItems = [
    { name: 'Home', url: 'https://bitkittools.com' },
    { name: 'Developer', url: 'https://bitkittools.com/developer' },
  ]

  it('renders nothing when items array is empty', () => {
    const { container } = render(<SchemaBreadcrumb items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders BreadcrumbList schema with correct @type', () => {
    const { container } = render(<SchemaBreadcrumb items={breadcrumbItems} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const json = JSON.parse(script?.textContent ?? '{}') as { '@type': string }
    expect(json['@type']).toBe('BreadcrumbList')
  })

  it('populates itemListElement with correct positions and names', () => {
    const { container } = render(<SchemaBreadcrumb items={breadcrumbItems} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const json = JSON.parse(script?.textContent ?? '{}') as {
      itemListElement: Array<{ position: number; name: string; item: string }>
    }
    expect(json.itemListElement).toHaveLength(2)
    expect(json.itemListElement[0]?.position).toBe(1)
    expect(json.itemListElement[0]?.name).toBe('Home')
    expect(json.itemListElement[1]?.position).toBe(2)
    expect(json.itemListElement[1]?.name).toBe('Developer')
  })
})
