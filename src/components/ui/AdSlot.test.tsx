import { render } from '@testing-library/react'
import AdSlot from './AdSlot'

describe('AdSlot', () => {
  it('renders with correct data-ad-position attribute', () => {
    const { container } = render(<AdSlot position="header" minHeightPx={90} />)
    const el = container.firstChild as HTMLElement
    expect(el.getAttribute('data-ad-position')).toBe('header')
  })

  it('applies minHeightPx as inline min-height style', () => {
    const { container } = render(<AdSlot position="result" minHeightPx={250} />)
    const el = container.firstChild as HTMLElement
    expect(el.style.minHeight).toBe('250px')
  })

  it('renders without crashing for all position values', () => {
    const positions = ['header', 'result', 'mid-content', 'above-faq', 'footer'] as const
    for (const position of positions) {
      expect(() => render(<AdSlot position={position} minHeightPx={100} />)).not.toThrow()
    }
  })
})
