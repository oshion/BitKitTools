import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import StandardDrinksCalculatorTool from './StandardDrinksCalculatorTool'

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

function setupGtag() {
  const mockGtag = jest.fn()
  Object.defineProperty(window, 'gtag', {
    value: mockGtag,
    writable: true,
    configurable: true,
  })
  return mockGtag
}

afterEach(() => {
  Object.defineProperty(window, 'gtag', {
    value: undefined,
    writable: true,
    configurable: true,
  })
})

describe('StandardDrinksCalculatorTool — input_enter event', () => {
  it('fires input_enter exactly once on first ABV change', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<StandardDrinksCalculatorTool />)

    const abvInput = getByLabelText('ABV (%)')
    fireEvent.change(abvInput, { target: { value: '6' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent changes', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<StandardDrinksCalculatorTool />)

    const abvInput = getByLabelText('ABV (%)')
    fireEvent.change(abvInput, { target: { value: '6' } })
    fireEvent.change(abvInput, { target: { value: '7' } })
    fireEvent.change(abvInput, { target: { value: '8' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
