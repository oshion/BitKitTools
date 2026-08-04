import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import PasswordGeneratorTool from './PasswordGeneratorTool'

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

describe('PasswordGeneratorTool — input_enter event', () => {
  it('fires input_enter exactly once on first option change', () => {
    const mockGtag = setupGtag()
    const { getByRole } = render(<PasswordGeneratorTool />)

    const slider = getByRole('slider')
    fireEvent.change(slider, { target: { value: '20' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent option changes', () => {
    const mockGtag = setupGtag()
    const { getByRole } = render(<PasswordGeneratorTool />)

    const slider = getByRole('slider')
    fireEvent.change(slider, { target: { value: '20' } })
    fireEvent.change(slider, { target: { value: '24' } })
    fireEvent.change(slider, { target: { value: '32' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
