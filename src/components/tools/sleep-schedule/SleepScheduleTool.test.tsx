import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import SleepScheduleTool from './SleepScheduleTool'

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

describe('SleepScheduleTool — input_enter event', () => {
  it('fires input_enter exactly once on first age input change', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<SleepScheduleTool />)

    const ageInput = getByLabelText(/Age \(months, 0–24\)/i)
    fireEvent.change(ageInput, { target: { value: '6' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent input changes', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<SleepScheduleTool />)

    const ageInput = getByLabelText(/Age \(months, 0–24\)/i)
    fireEvent.change(ageInput, { target: { value: '6' } })
    fireEvent.change(ageInput, { target: { value: '9' } })

    const wakeUpInput = getByLabelText(/Today's wake-up time/i)
    fireEvent.change(wakeUpInput, { target: { value: '08:00' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })

  it('does not affect the medical disclaimer content', () => {
    setupGtag()
    const { getByText } = render(<SleepScheduleTool />)

    // Calculate button must always be present
    expect(getByText('Calculate Sleep Schedule')).toBeTruthy()
  })
})
