import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import JsonToSqlTool from './JsonToSqlTool'

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

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

describe('JsonToSqlTool — input_enter event', () => {
  it('fires input_enter exactly once on first JSON input change', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<JsonToSqlTool />)

    const textarea = getByLabelText('JSON Input')
    fireEvent.change(textarea, { target: { value: '{"id":1}' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent JSON input changes', () => {
    const mockGtag = setupGtag()
    const { getByLabelText } = render(<JsonToSqlTool />)

    const textarea = getByLabelText('JSON Input')
    fireEvent.change(textarea, { target: { value: '{"id":1}' } })
    fireEvent.change(textarea, { target: { value: '{"id":2}' } })
    fireEvent.change(textarea, { target: { value: '{"id":3}' } })

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })
})

describe('JsonToSqlTool — syntax highlighting', () => {
  it('colors the SQL output (keywords, identifiers, numbers)', () => {
    const { getByLabelText, getByText, container } = render(<JsonToSqlTool />)
    fireEvent.change(getByLabelText('JSON Input'), { target: { value: '[{"id":1,"name":"a"}]' } })
    fireEvent.change(getByLabelText(/Table Name/), { target: { value: 'users' } })
    fireEvent.click(getByText('Convert to SQL'))

    const output = Array.from(container.querySelectorAll('pre:not([aria-hidden])')).pop()!
    expect(output.querySelector('[data-token="keyword"]')?.textContent).toBe('INSERT')
    expect(output.querySelectorAll('[data-token="identifier"]').length).toBeGreaterThan(0)
    expect(output.querySelector('[data-token="number"]')?.textContent).toBe('1')
  })

  it('colors the JSON input and indents on Tab', () => {
    const { getByLabelText, container } = render(<JsonToSqlTool />)
    const input = getByLabelText('JSON Input') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: '[\n]' } })
    expect(container.querySelector('pre[aria-hidden="true"] [data-token="bracket"]')?.textContent).toBe('[')

    input.focus()
    input.setSelectionRange(2, 2)
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)
    expect(input.value).toBe('[\n  ]')
  })
})
