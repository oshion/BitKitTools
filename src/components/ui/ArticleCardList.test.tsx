import { render, screen } from '@testing-library/react'
import ArticleCardList from './ArticleCardList'
import type { ArticleConfig } from '@/types/article'

// next/link normalizes the trailing slash away outside a Next.js runtime; render a plain
// anchor so the test sees the href ArticleCardList actually builds (same as ToolCard.test).
jest.mock('next/link', () => {
  return function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
})

const article: ArticleConfig = {
  id: 'a',
  slug: 'my-article',
  category: 'developer',
  title: { en: 'My Article', ko: '내 아티클' },
  description: { en: 'About things', ko: '설명입니다' },
  keywords: { en: [], ko: [] },
  publishedAt: '2026-11-05',
  updatedAt: '2026-11-05',
  readingMinutes: 6,
  faq: [],
  relatedToolIds: [],
  externalLinks: [],
}

describe('ArticleCardList', () => {
  it('links each article to its locale-aware URL with title, description and reading time', () => {
    render(<ArticleCardList articles={[article]} locale="ko" />)
    const link = screen.getByRole('link', { name: /내 아티클/ })
    expect(link).toHaveAttribute('href', '/ko/developer/articles/my-article/')
    expect(screen.getByText('설명입니다')).toBeInTheDocument()
    expect(screen.getByText(/6분/)).toBeInTheDocument()
  })

  it('renders nothing when there are no articles', () => {
    const { container } = render(<ArticleCardList articles={[]} locale="en" />)
    expect(container).toBeEmptyDOMElement()
  })
})
