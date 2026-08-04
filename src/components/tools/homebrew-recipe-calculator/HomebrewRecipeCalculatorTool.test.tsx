import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import HomebrewRecipeCalculatorTool from './HomebrewRecipeCalculatorTool'

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

describe('HomebrewRecipeCalculatorTool — input_enter event', () => {
  it('fires input_enter exactly once on first OG change', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<HomebrewRecipeCalculatorTool />)

    const ogInput = getByLabelText('Original Gravity (OG)')
    fireEvent.change(ogInput, { target: { value: '1.060' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent input changes', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<HomebrewRecipeCalculatorTool />)

    const ogInput = getByLabelText('Original Gravity (OG)')
    fireEvent.change(ogInput, { target: { value: '1.060' } })
    fireEvent.change(ogInput, { target: { value: '1.065' } })

    const fgInput = getByLabelText('Final Gravity (FG)')
    fireEvent.change(fgInput, { target: { value: '1.012' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
