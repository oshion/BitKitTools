import { useState } from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import CodeEditor from './CodeEditor'

function Harness({ initial = '', tabIndent }: { initial?: string; tabIndent?: boolean }) {
  const [value, setValue] = useState(initial)
  return (
    <CodeEditor
      id="editor"
      value={value}
      onChange={setValue}
      language="json"
      placeholder="Paste JSON"
      tabIndent={tabIndent}
      className="h-40"
    />
  )
}

function textarea() {
  return screen.getByPlaceholderText('Paste JSON') as HTMLTextAreaElement
}

describe('CodeEditor', () => {
  it('mirrors the value into a highlighted layer behind the textarea', () => {
    const { container } = render(<Harness initial={'{"a": 1}'} />)
    const layer = container.querySelector('pre[aria-hidden="true"]')!
    expect(layer.querySelector('[data-token="key"]')?.textContent).toBe('"a"')
    expect(layer.querySelector('[data-token="number"]')?.textContent).toBe('1')
  })

  it('reports edits through onChange', () => {
    render(<Harness />)
    fireEvent.change(textarea(), { target: { value: '[1]' } })
    expect(textarea().value).toBe('[1]')
  })

  it('inserts two spaces on Tab instead of moving focus', () => {
    render(<Harness initial={'{\n}'} />)
    const ta = textarea()
    ta.focus()
    ta.setSelectionRange(2, 2)
    const notPrevented = fireEvent.keyDown(ta, { key: 'Tab' })
    expect(notPrevented).toBe(false)
    expect(ta.value).toBe('{\n  }')
  })

  it('indents every selected line on Tab and outdents them on Shift+Tab', () => {
    render(<Harness initial={'a\nb\nc'} />)
    const ta = textarea()
    ta.focus()
    ta.setSelectionRange(0, 3) // "a\nb"
    fireEvent.keyDown(ta, { key: 'Tab' })
    expect(ta.value).toBe('  a\n  b\nc')

    ta.setSelectionRange(0, 7)
    fireEvent.keyDown(ta, { key: 'Tab', shiftKey: true })
    expect(ta.value).toBe('a\nb\nc')
  })

  it('lets Tab move focus after Escape (no keyboard trap)', () => {
    render(<Harness initial="x" />)
    const ta = textarea()
    ta.focus()
    fireEvent.keyDown(ta, { key: 'Escape' })
    const notPrevented = fireEvent.keyDown(ta, { key: 'Tab' })
    expect(notPrevented).toBe(true)
    expect(ta.value).toBe('x')
  })

  it('keeps default Tab behaviour when tabIndent is false', () => {
    render(<Harness initial="x" tabIndent={false} />)
    const notPrevented = fireEvent.keyDown(textarea(), { key: 'Tab' })
    expect(notPrevented).toBe(true)
  })

  it('describes the Tab behaviour to assistive tech', () => {
    render(<Harness />)
    const describedBy = textarea().getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toMatch(/Esc/)
  })
})
