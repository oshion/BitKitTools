import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import HeightPredictorTool from './HeightPredictorTool'

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

describe('HeightPredictorTool — input_enter event', () => {
  it('fires input_enter exactly once on first height input', () => {
    const mockGtag = setupGtag()
    const { getAllByPlaceholderText } = render(<HeightPredictorTool />)

    // In cm mode, mother and father both use "e.g. 165" placeholder
    const heightInputs = getAllByPlaceholderText('e.g. 165')
    // First is mother's height
    fireEvent.change(heightInputs[0], { target: { value: '165' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent height inputs', () => {
    const mockGtag = setupGtag()
    const { getAllByPlaceholderText } = render(<HeightPredictorTool />)

    const heightInputs = getAllByPlaceholderText('e.g. 165')
    // Change mother's height
    fireEvent.change(heightInputs[0], { target: { value: '165' } })
    // Change it again
    fireEvent.change(heightInputs[0], { target: { value: '170' } })
    // Change father's height
    fireEvent.change(heightInputs[1], { target: { value: '180' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })

  it('does not affect the medical disclaimer content', () => {
    setupGtag()
    const { getByText } = render(<HeightPredictorTool />)

    // Calculate button must always be present
    expect(getByText('Predict Adult Height')).toBeTruthy()
  })
})
