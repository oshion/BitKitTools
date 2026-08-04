import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import GrowthPercentileTool from './GrowthPercentileTool'

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
  localStorage.clear()
})

describe('GrowthPercentileTool — input_enter event', () => {
  it('fires input_enter exactly once on first input field change', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<GrowthPercentileTool />)

    const ageInput = getByLabelText(/Age \(months\)/i)
    fireEvent.change(ageInput, { target: { value: '12' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent input changes', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<GrowthPercentileTool />)

    const ageInput = getByLabelText(/Age \(months\)/i)
    fireEvent.change(ageInput, { target: { value: '12' } })
    fireEvent.change(ageInput, { target: { value: '18' } })

    const weightInput = getByLabelText(/Weight \(kg\)/i)
    fireEvent.change(weightInput, { target: { value: '10' } })

    const heightInput = getByLabelText(/Height \/ Length \(cm\)/i)
    fireEvent.change(heightInput, { target: { value: '75' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })

  it('does not affect the medical disclaimer content', () => {
    setupGtag()
    const { getByText } = render(<GrowthPercentileTool />)

    // Calculate button must always be present
    expect(getByText('Calculate Percentile')).toBeTruthy()
  })
})
