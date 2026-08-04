import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import JwtDecoderTool from './JwtDecoderTool'

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

describe('JwtDecoderTool — input_enter event', () => {
  it('fires input_enter exactly once on first token input', () => {
    const mockGtag = setupGtag()
    const { getByRole } = render(<JwtDecoderTool locale="en" />)

    const textarea = getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'abc' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent token changes', () => {
    const mockGtag = setupGtag()
    const { getByRole } = render(<JwtDecoderTool locale="en" />)

    const textarea = getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'abc' } })
    fireEvent.change(textarea, { target: { value: 'abcd' } })
    fireEvent.change(textarea, { target: { value: 'abcde' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
