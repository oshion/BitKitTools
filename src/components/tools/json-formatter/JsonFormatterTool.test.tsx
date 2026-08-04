import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import JsonFormatterTool from './JsonFormatterTool'

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

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

describe('JsonFormatterTool — input_enter event', () => {
  it('fires input_enter exactly once on first input change', () => {
    const mockGtag = setupGtag()
    const { getByPlaceholderText } = render(<JsonFormatterTool />)

    const textarea = getByPlaceholderText('Paste JSON here, e.g. {"name":"Alice","age":30}')
    fireEvent.change(textarea, { target: { value: '{"a":1}' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent input changes', () => {
    const mockGtag = setupGtag()
    const { getByPlaceholderText } = render(<JsonFormatterTool />)

    const textarea = getByPlaceholderText('Paste JSON here, e.g. {"name":"Alice","age":30}')
    fireEvent.change(textarea, { target: { value: '{"a":1}' } })
    fireEvent.change(textarea, { target: { value: '{"a":2}' } })
    fireEvent.change(textarea, { target: { value: '{"a":3}' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})
