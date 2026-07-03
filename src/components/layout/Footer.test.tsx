import { render, screen } from '@testing-library/react'
import Footer from './Footer'

// 'mock' prefix allows Jest to use this variable inside the hoisted jest.mock factory.
let mockFooterLocale = 'en'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockFooterLocale,
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
  mockFooterLocale = 'en'
})

describe('Footer', () => {
  it('renders privacy policy link', () => {
    render(<Footer />)
    // t('privacyPolicy') returns 'privacyPolicy' via mock
    expect(screen.getByText('privacyPolicy')).toBeInTheDocument()
  })

  it('renders terms link', () => {
    render(<Footer />)
    expect(screen.getByText('terms')).toBeInTheDocument()
  })

  it('renders about link', () => {
    render(<Footer />)
    expect(screen.getByText('about')).toBeInTheDocument()
  })

  it('renders contact link', () => {
    render(<Footer />)
    expect(screen.getByText('contact')).toBeInTheDocument()
  })

  it('legal links have correct EN paths', () => {
    render(<Footer />)
    const privacyLink = screen.getByText('privacyPolicy').closest('a')
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
    const termsLink = screen.getByText('terms').closest('a')
    expect(termsLink).toHaveAttribute('href', '/terms')
  })

  it('legal links have /ko prefix for KO locale', () => {
    mockFooterLocale = 'ko'
    render(<Footer />)
    const privacyLink = screen.getByText('privacyPolicy').closest('a')
    expect(privacyLink).toHaveAttribute('href', '/ko/privacy-policy')
  })
})
