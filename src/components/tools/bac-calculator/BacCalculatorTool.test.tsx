import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import BacCalculatorTool from './BacCalculatorTool'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
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

describe('BacCalculatorTool — input_enter event', () => {
  it('fires input_enter exactly once on first gender button click', () => {
    const mockGtag = setupGtag()
    const { getByText } = render(<BacCalculatorTool />)

    fireEvent.click(getByText('Female'))

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent interactions', () => {
    const mockGtag = setupGtag()
    const { getByText, getByLabelText } = render(<BacCalculatorTool />)

    fireEvent.click(getByText('Female'))
    fireEvent.click(getByText('Male'))

    const weightInput = getByLabelText('Body Weight')
    fireEvent.change(weightInput, { target: { value: '65' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })

  it('does not affect the existing safety warning (ADR-014)', () => {
    setupGtag()
    const { getByText } = render(<BacCalculatorTool />)

    // Safety warning must always be present regardless of input_enter instrumentation
    expect(
      getByText(/do not drive or operate machinery after consuming alcohol/i)
    ).toBeTruthy()
  })
})
