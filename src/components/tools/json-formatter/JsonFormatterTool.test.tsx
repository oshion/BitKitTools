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
    // The textarea fills the CodeEditor wrapper, which carries the height
    expect(textarea.parentElement).toHaveClass('md:h-[700px]')

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

describe('JsonFormatterTool — syntax highlighting', () => {
  const PLACEHOLDER = 'Paste JSON here, e.g. {"name":"Alice","age":30}'

  it('colors the formatted output by token type while keeping the text intact', () => {
    const { getByPlaceholderText, getAllByText, container } = render(<JsonFormatterTool />)
    fireEvent.change(getByPlaceholderText(PLACEHOLDER), { target: { value: '{"a":{"b":1}}' } })
    // 'Format' is both the mode tab and the run button — the run button comes last
    const formatButtons = getAllByText('Format')
    fireEvent.click(formatButtons[formatButtons.length - 1]!)

    const output = container.querySelector('pre[title="Click to copy"]')!
    expect(output.textContent).toBe('{\n  "a": {\n    "b": 1\n  }\n}')
    expect(Array.from(output.querySelectorAll('[data-token="key"]')).map((e) => e.textContent)).toEqual(['"a"', '"b"'])
    expect(output.querySelector('[data-token="number"]')?.textContent).toBe('1')
  })

  it('colors the input as you type', () => {
    const { getByPlaceholderText, container } = render(<JsonFormatterTool />)
    fireEvent.change(getByPlaceholderText(PLACEHOLDER), { target: { value: '{"name": "Alice"}' } })
    const layer = container.querySelector('pre[aria-hidden="true"]')!
    expect(layer.querySelector('[data-token="key"]')?.textContent).toBe('"name"')
    expect(layer.querySelector('[data-token="string"]')?.textContent).toBe('"Alice"')
  })

  it('inserts indentation on Tab instead of moving focus', () => {
    const { getByPlaceholderText } = render(<JsonFormatterTool />)
    const input = getByPlaceholderText(PLACEHOLDER) as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: '{\n}' } })
    input.focus()
    input.setSelectionRange(2, 2)
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)
    expect(input.value).toBe('{\n  }')
  })
})
