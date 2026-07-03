import { render, screen } from '@testing-library/react'
import DisclaimerBanner from './DisclaimerBanner'

// Mock next-intl entirely to avoid ESM-only dependency issues in Jest.
// The factory returns key names so tests verify component structure, not i18n strings.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('DisclaimerBanner', () => {
  it('renders nothing when disclaimerType is "none"', () => {
    const { container } = render(<DisclaimerBanner disclaimerType="none" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a note element for "general" type', () => {
    render(<DisclaimerBanner disclaimerType="general" />)
    expect(screen.getByRole('note')).toBeInTheDocument()
    // t('general') returns 'general' from mock
    expect(screen.getByText('general')).toBeInTheDocument()
  })

  it('renders for "medical" type', () => {
    render(<DisclaimerBanner disclaimerType="medical" />)
    expect(screen.getByText('medical')).toBeInTheDocument()
  })

  it('renders for "legal" type', () => {
    render(<DisclaimerBanner disclaimerType="legal" />)
    expect(screen.getByText('legal')).toBeInTheDocument()
  })

  it('renders for "financial" type', () => {
    render(<DisclaimerBanner disclaimerType="financial" />)
    expect(screen.getByText('financial')).toBeInTheDocument()
  })
})
