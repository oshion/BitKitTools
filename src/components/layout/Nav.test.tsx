import { render, screen } from '@testing-library/react'
import Nav from './Nav'

// 'mock' prefix allows Jest to use this variable inside the hoisted jest.mock factory.
let mockLocale = 'en'
let mockPathname = '/'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}))

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => mockPathname),
}))

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
})

beforeEach(() => {
  mockLocale = 'en'
  mockPathname = '/'
})

describe('Nav', () => {
  it('renders links for all 4 categories', () => {
    render(<Nav />)
    // t(category) returns the category key name via mock
    expect(screen.getByText('developer')).toBeInTheDocument()
    expect(screen.getByText('travel')).toBeInTheDocument()
    expect(screen.getByText('beer')).toBeInTheDocument()
    expect(screen.getByText('baby')).toBeInTheDocument()
  })

  it('renders the language switch link', () => {
    render(<Nav />)
    expect(screen.getByText('languageSwitch')).toBeInTheDocument()
  })

  it('category links have correct hrefs for EN locale', () => {
    render(<Nav />)
    const developerLink = screen.getByText('developer').closest('a')
    expect(developerLink).toHaveAttribute('href', '/developer/')
  })

  it('category links have /ko prefix for KO locale', () => {
    mockLocale = 'ko'
    render(<Nav />)
    const developerLink = screen.getByText('developer').closest('a')
    expect(developerLink).toHaveAttribute('href', '/ko/developer/')
  })

  it('language switch link points to /ko/ when in EN locale', () => {
    // usePathname() mock returns '/', so altLocaleHref = '/ko/'
    render(<Nav />)
    const switchLink = screen.getByText('languageSwitch').closest('a')
    expect(switchLink).toHaveAttribute('href', '/ko/')
  })

  it('strips a dev-mode /en prefix when switching to KO (regression: was producing /ko/en)', () => {
    mockPathname = '/en'
    render(<Nav />)
    const switchLink = screen.getByText('languageSwitch').closest('a')
    expect(switchLink).toHaveAttribute('href', '/ko/')
  })

  it('strips a dev-mode /en prefix on a category page when switching to KO', () => {
    mockPathname = '/en/developer'
    render(<Nav />)
    const switchLink = screen.getByText('languageSwitch').closest('a')
    expect(switchLink).toHaveAttribute('href', '/ko/developer/')
  })
})
