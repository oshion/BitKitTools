import { render, screen } from '@testing-library/react'
import Header from './Header'

jest.mock('./Nav', () => {
  return function MockNav() {
    return <nav data-testid="mock-nav" />
  }
})

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

describe('Header', () => {
  it('renders the site logo text', () => {
    render(<Header locale="en" />)
    expect(screen.getByText('BitKitTools')).toBeInTheDocument()
  })

  it('logo links to / for EN locale', () => {
    render(<Header locale="en" />)
    const logoLink = screen.getByText('BitKitTools').closest('a')
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('logo links to /ko for KO locale', () => {
    render(<Header locale="ko" />)
    const logoLink = screen.getByText('BitKitTools').closest('a')
    expect(logoLink).toHaveAttribute('href', '/ko')
  })

  it('renders navigation via Nav component', () => {
    render(<Header locale="en" />)
    expect(screen.getByTestId('mock-nav')).toBeInTheDocument()
  })
})
