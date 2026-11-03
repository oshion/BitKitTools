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

describe('JsonFormatterTool — editor size', () => {
  it('renders input and output areas at 700px tall on desktop', () => {
    const { getByPlaceholderText, getByText } = render(<JsonFormatterTool />)

    const textarea = getByPlaceholderText('Paste JSON here, e.g. {"name":"Alice","age":30}')
    expect(textarea).toHaveClass('md:h-[700px]')

    const outputBox = getByText('Result will appear here after you click Format or Minify.')
      .parentElement?.parentElement
    expect(outputBox).toHaveClass('md:h-[700px]')
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

describe('JsonFormatterTool — indent rainbow output', () => {
  it('colors indent levels of the formatted output while keeping the text intact', () => {
    const { getByPlaceholderText, getAllByText, container } = render(<JsonFormatterTool />)
    fireEvent.change(getByPlaceholderText('Paste JSON here, e.g. {"name":"Alice","age":30}'), {
      target: { value: '{"a":{"b":1}}' },
    })
    // 'Format' is both the mode tab and the run button — the run button comes last
    const formatButtons = getAllByText('Format')
    fireEvent.click(formatButtons[formatButtons.length - 1]!)

    const levels = Array.from(container.querySelectorAll('[data-indent-level]')).map((el) =>
      el.getAttribute('data-indent-level')
    )
    expect(levels).toEqual(['0', '0', '1', '0'])
    expect(container.querySelector('pre[title="Click to copy"]')?.textContent).toBe(
      '{\n  "a": {\n    "b": 1\n  }\n}'
    )
  })
})
