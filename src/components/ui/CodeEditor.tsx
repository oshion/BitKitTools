'use client'

import { useId, useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { highlightedNodes, MAX_HIGHLIGHT_CHARS } from './CodeHighlight'
import type { HighlightLanguage } from '@/lib/utils/syntaxHighlight'

const INDENT = '  '

// Both layers must lay text out identically, so they share every metric-affecting class.
const LAYER = 'px-4 py-3 text-base font-mono leading-relaxed whitespace-pre-wrap break-all [scrollbar-gutter:stable]'

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
  language: HighlightLanguage
  id?: string
  placeholder?: string
  /** Wrapper sizing, e.g. 'h-[420px] md:h-[700px]'. The editor is vertically resizable. */
  className?: string
  /** Tab inserts indentation (Esc then Tab moves focus). Default true. */
  tabIndent?: boolean
}

// Syntax-highlighted plain-text editor: a transparent <textarea> (caret, selection,
// undo, IME, paste all native) over a highlighted <pre> that mirrors its value.
export default function CodeEditor({
  value,
  onChange,
  language,
  id,
  placeholder,
  className = '',
  tabIndent = true,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const layerRef = useRef<HTMLPreElement>(null)
  const escapedRef = useRef(false)
  const pendingSelection = useRef<[number, number] | null>(null)
  const hintId = useId()
  const highlighted = value.length <= MAX_HIGHLIGHT_CHARS

  // Restore the caret after a Tab edit applied through onChange (fallback path).
  useLayoutEffect(() => {
    const sel = pendingSelection.current
    if (sel && textareaRef.current) {
      textareaRef.current.setSelectionRange(sel[0], sel[1])
      pendingSelection.current = null
    }
  }, [value])

  function syncScroll() {
    if (textareaRef.current && layerRef.current) {
      layerRef.current.scrollTop = textareaRef.current.scrollTop
      layerRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  // Replaces [start, end) with `text`. execCommand keeps the browser's undo history;
  // where it's unavailable (e.g. jsdom) the edit goes through onChange instead.
  function replaceRange(ta: HTMLTextAreaElement, start: number, end: number, text: string, selStart: number, selEnd: number) {
    ta.setSelectionRange(start, end)
    const inserted =
      typeof document.execCommand === 'function' && document.execCommand('insertText', false, text)
    if (inserted) {
      ta.setSelectionRange(selStart, selEnd)
    } else {
      pendingSelection.current = [selStart, selEnd]
      onChange(ta.value.slice(0, start) + text + ta.value.slice(end))
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      escapedRef.current = true
      return
    }
    if (e.key !== 'Tab' || !tabIndent || e.ctrlKey || e.altKey || e.metaKey) {
      escapedRef.current = false
      return
    }
    if (escapedRef.current) {
      escapedRef.current = false
      return // let Tab move focus
    }
    e.preventDefault()

    const ta = e.currentTarget
    const { selectionStart: start, selectionEnd: end } = ta
    const text = ta.value
    const multiLine = text.slice(start, end).includes('\n')

    if (!e.shiftKey && !multiLine) {
      replaceRange(ta, start, end, INDENT, start + INDENT.length, start + INDENT.length)
      return
    }

    // Indent/outdent every line touched by the selection.
    const blockStart = text.lastIndexOf('\n', start - 1) + 1
    const block = text.slice(blockStart, end)
    const lines = block.split('\n')
    const changed = e.shiftKey
      ? lines.map((line) => line.replace(new RegExp(`^ {1,${INDENT.length}}`), ''))
      : lines.map((line) => INDENT + line)
    const firstDelta = changed[0]!.length - lines[0]!.length
    const replacement = changed.join('\n')
    replaceRange(
      ta,
      blockStart,
      end,
      replacement,
      Math.max(blockStart, start + firstDelta),
      blockStart + replacement.length
    )
  }

  return (
    <div
      className={`relative overflow-hidden resize-y rounded-lg bg-neutral-900 border border-neutral-800 focus-within:border-neutral-600 ${className}`}
    >
      <pre
        ref={layerRef}
        aria-hidden="true"
        className={`${LAYER} pointer-events-none absolute inset-0 m-0 overflow-hidden text-neutral-300`}
      >
        {highlighted ? highlightedNodes(value, language) : null}
        {/* keeps a trailing newline's empty last line the same height as in the textarea */}
        {'\n '}
      </pre>
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        aria-describedby={tabIndent ? hintId : undefined}
        className={`${LAYER} absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent outline-none caret-neutral-200 placeholder:text-neutral-600 selection:bg-sky-500/30 ${
          highlighted ? 'text-transparent' : 'text-neutral-300'
        }`}
      />
      {tabIndent && (
        <span id={hintId} className="sr-only">
          Tab inserts indentation. Press Esc, then Tab, to move focus out of the editor.
        </span>
      )}
    </div>
  )
}
