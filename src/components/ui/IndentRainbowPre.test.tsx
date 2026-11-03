import { render, fireEvent } from '@testing-library/react'
import IndentRainbowPre, { MAX_RAINBOW_LINES } from './IndentRainbowPre'

const JSON_2 = '{\n  "a": {\n    "b": 1\n  }\n}'

describe('IndentRainbowPre', () => {
  it('keeps the exact original text so selecting and copying is unchanged', () => {
    const { container } = render(<IndentRainbowPre text={JSON_2} />)
    expect(container.querySelector('pre')?.textContent).toBe(JSON_2)
  })

  it('colors each indent level with its own band', () => {
    const { container } = render(<IndentRainbowPre text={JSON_2} />)
    const bands = Array.from(container.querySelectorAll('[data-indent-level]'))
    // line 2: level 0 / line 3: levels 0,1 / line 4: level 0
    expect(bands.map((b) => b.getAttribute('data-indent-level'))).toEqual(['0', '0', '1', '0'])
    expect(bands[1]?.className).not.toBe(bands[2]?.className)
  })

  it('uses the detected indent width (4 spaces → one band per 4 spaces)', () => {
    const { container } = render(<IndentRainbowPre text={'{\n    "a": 1\n}'} />)
    const bands = container.querySelectorAll('[data-indent-level]')
    expect(bands).toHaveLength(1)
    expect(bands[0]?.textContent).toBe('    ')
  })

  it('falls back to plain text for very large outputs', () => {
    const big = Array.from({ length: MAX_RAINBOW_LINES + 1 }, () => '  x').join('\n')
    const { container } = render(<IndentRainbowPre text={big} />)
    expect(container.querySelectorAll('[data-indent-level]')).toHaveLength(0)
    expect(container.querySelector('pre')?.textContent).toBe(big)
  })

  it('passes className, title and onClick through to the pre element', () => {
    const onClick = jest.fn()
    const { container } = render(
      <IndentRainbowPre text="x" className="my-class" title="Click to copy" onClick={onClick} />
    )
    const pre = container.querySelector('pre')!
    expect(pre).toHaveClass('my-class')
    expect(pre).toHaveAttribute('title', 'Click to copy')
    fireEvent.click(pre)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
