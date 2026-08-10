import { render, screen } from '@testing-library/react'
import type { ToolConfig } from '@/types/tool'
import ToolCard from './ToolCard'

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
    prefetch,
  }: {
    children: React.ReactNode
    href: string
    className?: string
    prefetch?: boolean
  }) {
    return (
      <a href={href} className={className} data-prefetch={String(prefetch)}>
        {children}
      </a>
    )
  }
})

const mockTool: ToolConfig = {
  id: 'json-formatter',
  slug: 'json-formatter',
  category: 'developer',
  title: { en: 'JSON Formatter', ko: 'JSON 포맷터' },
  description: { en: 'Format and validate JSON', ko: 'JSON 포맷 및 유효성 검사' },
  keywords: { en: ['json'], ko: ['json'] },
  schemaType: 'WebApplication',
  faq: [],
  relatedToolIds: [],
  adSlots: [],
  ogImage: '/og/json-formatter.png',
  status: 'validated',
  disclaimerType: 'general',
  aiOverviewResistance: 'high',
  addedAt: '2024-01-10',
  popular: true,
}

describe('ToolCard', () => {
  it('renders tool title for EN locale', () => {
    render(<ToolCard tool={mockTool} locale="en" />)
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument()
  })

  it('renders tool title for KO locale', () => {
    render(<ToolCard tool={mockTool} locale="ko" />)
    expect(screen.getByText('JSON 포맷터')).toBeInTheDocument()
  })

  it('renders tool description for EN locale', () => {
    render(<ToolCard tool={mockTool} locale="en" />)
    expect(screen.getByText('Format and validate JSON')).toBeInTheDocument()
  })

  it('renders link with correct EN href', () => {
    render(<ToolCard tool={mockTool} locale="en" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/developer/json-formatter/')
  })

  it('renders link with /ko prefix for KO locale', () => {
    render(<ToolCard tool={mockTool} locale="ko" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/ko/developer/json-formatter/')
  })

  it('leaves prefetch unset (Next.js default) when the prop is not passed', () => {
    render(<ToolCard tool={mockTool} locale="en" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('data-prefetch', 'undefined')
  })

  it('forwards prefetch={false} to the underlying Link', () => {
    render(<ToolCard tool={mockTool} locale="en" prefetch={false} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('data-prefetch', 'false')
  })
})
