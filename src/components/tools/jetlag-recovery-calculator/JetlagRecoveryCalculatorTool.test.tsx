import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import JetlagRecoveryCalculatorTool from './JetlagRecoveryCalculatorTool'

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

describe('JetlagRecoveryCalculatorTool — input_enter event', () => {
  it('fires input_enter exactly once on first timezone change', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<JetlagRecoveryCalculatorTool />)

    const originSelect = getByLabelText('Departure timezone')
    fireEvent.change(originSelect, { target: { value: '5' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent timezone changes', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<JetlagRecoveryCalculatorTool />)

    const originSelect = getByLabelText('Departure timezone')
    fireEvent.change(originSelect, { target: { value: '5' } })
    fireEvent.change(originSelect, { target: { value: '8' } })

    const destinationSelect = getByLabelText('Destination timezone')
    fireEvent.change(destinationSelect, { target: { value: '-5' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
