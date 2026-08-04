import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import VisaRequirementCheckerTool from './VisaRequirementCheckerTool'

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

describe('VisaRequirementCheckerTool — input_enter event', () => {
  it('fires input_enter exactly once on first country selection', () => {
    const mockGtag = setupGtag()
    const { getAllByRole } = render(<VisaRequirementCheckerTool />)

    // Focus the "from" combobox input to open the dropdown
    const inputs = getAllByRole('textbox')
    fireEvent.focus(inputs[0])

    // Select the first country from the dropdown
    const countryButtons = getAllByRole('button')
    fireEvent.mouseDown(countryButtons[0])

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent country selections', () => {
    const mockGtag = setupGtag()
    const { getAllByRole } = render(<VisaRequirementCheckerTool />)

    // First selection — fires input_enter
    const inputs = getAllByRole('textbox')
    fireEvent.focus(inputs[0])
    const countryButtons = getAllByRole('button')
    fireEvent.mouseDown(countryButtons[0])

    // Re-open the same combobox and select again
    fireEvent.focus(inputs[0])
    const countryButtons2 = getAllByRole('button')
    fireEvent.mouseDown(countryButtons2[0])

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })

  it('does not affect the disclaimer/unknown-state handling', () => {
    setupGtag()
    const { getByText } = render(<VisaRequirementCheckerTool />)

    // Empty-state prompt must always be present when no countries are selected
    expect(
      getByText(/Select your passport country and destination above to see visa requirements/i)
    ).toBeTruthy()
  })
})
