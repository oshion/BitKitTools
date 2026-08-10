import { render, screen } from '@testing-library/react'
import type { ToolConfig } from '@/types/tool'
import ToolCardGrid from './ToolCardGrid'

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

describe('ToolCardGrid', () => {
  it('renders nothing when tools is empty and no emptyMessage', () => {
    const { container } = render(<ToolCardGrid tools={[]} locale="en" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders emptyMessage when tools is empty and message is provided', () => {
    render(<ToolCardGrid tools={[]} locale="en" emptyMessage="No tools available" />)
    expect(screen.getByText('No tools available')).toBeInTheDocument()
  })

  it('renders tool cards when tools are provided', () => {
    render(<ToolCardGrid tools={[mockTool]} locale="en" />)
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument()
  })

  it('renders tool titles in the correct locale', () => {
    render(<ToolCardGrid tools={[mockTool]} locale="ko" />)
    expect(screen.getByText('JSON 포맷터')).toBeInTheDocument()
  })

  it('renders multiple tool cards', () => {
    const secondTool: ToolConfig = {
      ...mockTool,
      id: 'password-generator',
      slug: 'password-generator',
      title: { en: 'Password Generator', ko: '비밀번호 생성기' },
      description: { en: 'Generate passwords', ko: '비밀번호 생성' },
    }
    render(<ToolCardGrid tools={[mockTool, secondTool]} locale="en" />)
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument()
    expect(screen.getByText('Password Generator')).toBeInTheDocument()
  })

  it('forwards prefetch={false} to every ToolCard link', () => {
    render(<ToolCardGrid tools={[mockTool]} locale="en" prefetch={false} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('data-prefetch', 'false')
  })
})
