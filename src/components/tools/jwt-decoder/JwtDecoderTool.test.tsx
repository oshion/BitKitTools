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

describe('JwtDecoderTool — syntax highlighting', () => {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: '1', ctx: { role: 'admin' } })}.sig`

  it('colors the decoded header and payload JSON by token type', () => {
    const { getByRole, getByText, container } = render(<JwtDecoderTool locale="en" />)
    fireEvent.change(getByRole('textbox'), { target: { value: token } })
    fireEvent.click(getByText('Decode'))

    const keys = Array.from(container.querySelectorAll('pre:not([aria-hidden]) [data-token="key"]')).map(
      (e) => e.textContent
    )
    expect(keys).toEqual(['"alg"', '"typ"', '"sub"', '"ctx"', '"role"'])
  })

  it('colors the token input by segment (header / payload / signature)', () => {
    const { getByRole, container } = render(<JwtDecoderTool locale="en" />)
    fireEvent.change(getByRole('textbox'), { target: { value: 'aaa.bbb.ccc' } })
    const layer = container.querySelector('pre[aria-hidden="true"]')!
    expect(layer.querySelector('[data-token="jwt-header"]')?.textContent).toBe('aaa')
    expect(layer.querySelector('[data-token="jwt-payload"]')?.textContent).toBe('bbb')
    expect(layer.querySelector('[data-token="jwt-signature"]')?.textContent).toBe('ccc')
  })
})
