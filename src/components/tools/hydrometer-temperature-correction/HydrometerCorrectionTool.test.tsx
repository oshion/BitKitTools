import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import HydrometerCorrectionTool from './HydrometerCorrectionTool'

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

describe('HydrometerCorrectionTool — input_enter event', () => {
  it('fires input_enter exactly once on first measured gravity change', () => {
    const mockGtag = setupGtag()
    const { getByPlaceholderText } = render(<HydrometerCorrectionTool />)

    const measuredInput = getByPlaceholderText('e.g. 1.052')
    fireEvent.change(measuredInput, { target: { value: '1.048' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent input changes', () => {
    const mockGtag = setupGtag()
    const { getByPlaceholderText } = render(<HydrometerCorrectionTool />)

    const measuredInput = getByPlaceholderText('e.g. 1.052')
    fireEvent.change(measuredInput, { target: { value: '1.048' } })
    fireEvent.change(measuredInput, { target: { value: '1.055' } })
    fireEvent.change(measuredInput, { target: { value: '1.060' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
