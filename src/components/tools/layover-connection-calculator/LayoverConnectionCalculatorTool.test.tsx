import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import LayoverConnectionCalculatorTool from './LayoverConnectionCalculatorTool'

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

describe('LayoverConnectionCalculatorTool — input_enter event', () => {
  it('fires input_enter exactly once on first airport search input', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<LayoverConnectionCalculatorTool />)

    const airportInput = getByLabelText('Connecting airport')
    fireEvent.change(airportInput, { target: { value: 'ICN' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent input changes', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<LayoverConnectionCalculatorTool />)

    const airportInput = getByLabelText('Connecting airport')
    fireEvent.change(airportInput, { target: { value: 'ICN' } })
    fireEvent.change(airportInput, { target: { value: 'NRT' } })

    const hoursInput = getByLabelText('Hours')
    fireEvent.change(hoursInput, { target: { value: '2' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
