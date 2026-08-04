import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import FlightDelayCompensationTool from './FlightDelayCompensationTool'

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

describe('FlightDelayCompensationTool — input_enter event', () => {
  it('fires input_enter exactly once on first form interaction', () => {
    const mockGtag = setupGtag()
    const { getByText } = render(<FlightDelayCompensationTool />)

    // Click the US DOT regulation button (different from default EU261)
    fireEvent.click(getByText('US DOT (Domestic / Trans-Atlantic)'))

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent form changes', () => {
    const mockGtag = setupGtag()
    const { getByText } = render(<FlightDelayCompensationTool />)

    fireEvent.click(getByText('US DOT (Domestic / Trans-Atlantic)'))
    fireEvent.click(getByText('Cancellation'))
    fireEvent.click(getByText('EU Regulation 261/2004'))

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
