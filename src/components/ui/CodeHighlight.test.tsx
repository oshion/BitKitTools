import { render, fireEvent } from '@testing-library/react'
import CodeHighlight, { MAX_HIGHLIGHT_CHARS } from './CodeHighlight'

const JSON_TEXT = '{\n  "a": {\n    "b": [1, true, null, "x"]\n  }\n}'

describe('CodeHighlight', () => {
  it('keeps the exact original text so selecting and copying is unchanged', () => {
    const { container } = render(<CodeHighlight text={JSON_TEXT} language="json" />)
    expect(container.querySelector('pre')?.textContent).toBe(JSON_TEXT)
  })

  it('wraps each token kind in its own colored span', () => {
    const { container } = render(<CodeHighlight text={JSON_TEXT} language="json" />)
    const text = (kind: string) =>
      Array.from(container.querySelectorAll(`[data-token="${kind}"]`)).map((el) => el.textContent)
    expect(text('key')).toEqual(['"a"', '"b"'])
    expect(text('number')).toEqual(['1'])
    expect(text('boolean')).toEqual(['true'])
    expect(text('null-literal')).toEqual(['null'])
    expect(text('string')).toEqual(['"x"'])
    const key = container.querySelector('[data-token="key"]')
    const str = container.querySelector('[data-token="string"]')
    expect(key?.className).not.toBe(str?.className)
  })

  it('colors brackets by nesting depth', () => {
    const { container } = render(<CodeHighlight text={'{"a": [1]}'} language="json" />)
    const brackets = Array.from(container.querySelectorAll('[data-token="bracket"]'))
    expect(brackets.map((b) => b.getAttribute('data-depth'))).toEqual(['0', '1', '1', '0'])
    expect(brackets[0]?.className).not.toBe(brackets[1]?.className)
  })

  it('falls back to plain text for very large outputs', () => {
    const big = `"${'a'.repeat(MAX_HIGHLIGHT_CHARS)}"`
    const { container } = render(<CodeHighlight text={big} language="json" />)
    expect(container.querySelectorAll('[data-token]')).toHaveLength(0)
    expect(container.querySelector('pre')?.textContent).toBe(big)
  })

  it('passes className, title and onClick through to the pre element', () => {
    const onClick = jest.fn()
    const { container } = render(
      <CodeHighlight text="x" language="sql" className="my-class" title="Click to copy" onClick={onClick} />
    )
    const pre = container.querySelector('pre')!
    expect(pre).toHaveClass('my-class')
    expect(pre).toHaveAttribute('title', 'Click to copy')
    fireEvent.click(pre)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
