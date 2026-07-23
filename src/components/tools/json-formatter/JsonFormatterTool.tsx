'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { formatJson, minifyJson } from '@/lib/utils/jsonFormatter'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

// sessionStorage key shared by convention with JsonToSqlTool (same string literal,
// no cross-import — rule 8). This component writes this key; JsonToSqlTool reads it.
const SESSION_KEY = 'json-formatter-to-sql:payload'

type Mode = 'format' | 'minify'
type Indent = 2 | 4

type Result =
  | { type: 'idle' }
  | { type: 'success'; output: string }
  | { type: 'error'; message: string; line?: number; errorContext?: string }

export default function JsonFormatterTool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('format')
  const [indent, setIndent] = useState<Indent>(2)
  const [result, setResult] = useState<Result>({ type: 'idle' })
  const [copied, setCopied] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const { sendEvent } = useAnalyticsEvent()
  const pathname = usePathname()
  const router = useRouter()

  // Fire tool_open once on mount
  useEffect(() => {
    sendEvent('tool_open')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate result on change
  useEffect(() => {
    if (result.type === 'idle') return
    const el = resultRef.current
    if (!el) return
    el.style.opacity = '0'
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.4s ease'
      el.style.opacity = '1'
    })
    return () => cancelAnimationFrame(raf)
  }, [result])

  const charCount = input.length
  const lineCount = input === '' ? 0 : input.split('\n').length

  function run() {
    const res = mode === 'format' ? formatJson(input, indent) : minifyJson(input)
    if (res.success) {
      setResult({ type: 'success', output: res.output })
    } else {
      setResult({ type: 'error', message: res.error, line: res.line, errorContext: res.errorContext })
    }
    sendEvent('calculate')
  }

  async function handleCopy() {
    if (result.type !== 'success') return
    try {
      await navigator.clipboard.writeText(result.output)
      setCopied(true)
      sendEvent('copy_result')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (insecure context); silent fail
    }
  }

  function handleConvertToSql() {
    if (result.type !== 'success') return
    try {
      sessionStorage.setItem(SESSION_KEY, result.output)
    } catch {
      // sessionStorage unavailable (private mode, etc.); navigate without pre-fill
    }
    sendEvent('calculate')
    const isKo = pathname.startsWith('/ko/') || pathname === '/ko'
    const target = isKo ? '/ko/developer/json-to-sql' : '/developer/json-to-sql'
    router.push(target)
  }

  function handleDownload() {
    if (result.type !== 'success') return
    const blob = new Blob([result.output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'output.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-neutral-800 overflow-hidden">
          <button
            onClick={() => setMode('format')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'format'
                ? 'bg-white text-black'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Format
          </button>
          <button
            onClick={() => setMode('minify')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'minify'
                ? 'bg-white text-black'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Minify
          </button>
        </div>

        {/* Indent selector — only relevant in format mode */}
        {mode === 'format' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Indent:</span>
            <div className="flex rounded-lg border border-neutral-800 overflow-hidden">
              {([2, 4] as Indent[]).map((n) => (
                <button
                  key={n}
                  onClick={() => setIndent(n)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    indent === n
                      ? 'bg-white text-black'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={run}
          disabled={input.trim() === ''}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {mode === 'format' ? 'Format' : 'Minify'}
        </button>
      </div>

      {/* Editor pane */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-400">Input</label>
            <span className="text-xs text-neutral-500">
              {charCount} chars · {lineCount} lines
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste JSON here, e.g. {"name":"Alice","age":30}'
            spellCheck={false}
            className="w-full h-64 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 font-mono leading-relaxed resize-y focus:outline-none focus:border-neutral-600 placeholder-neutral-600"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-400">Output</label>
            {result.type === 'success' && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Download .json
                </button>
                <button
                  onClick={handleConvertToSql}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Convert to SQL →
                </button>
              </div>
            )}
          </div>

          <div ref={resultRef} className="h-64">
            {result.type === 'idle' && (
              <div className="h-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 flex items-center justify-center">
                <p className="text-sm text-neutral-600">
                  Result will appear here after you click Format or Minify.
                </p>
              </div>
            )}

            {result.type === 'error' && (
              <div className="h-full rounded-lg border border-[#ef4444]/40 bg-red-950/20 px-4 py-3 overflow-auto">
                <p className="text-sm font-medium text-[#ef4444] mb-1">
                  Invalid JSON
                  {result.line !== undefined ? ` — line ${result.line}` : ''}
                </p>
                <p className="text-sm text-red-300/80">{result.message}</p>
                {result.errorContext !== undefined && (
                  <pre className="mt-2 text-sm text-red-300/80 font-mono whitespace-pre-wrap break-all">
                    {result.errorContext}
                  </pre>
                )}
              </div>
            )}

            {result.type === 'success' && (
              <pre
                onClick={handleCopy}
                title="Click to copy"
                className="h-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 font-mono leading-relaxed overflow-auto whitespace-pre-wrap break-all cursor-pointer hover:border-neutral-600 transition-colors"
              >
                {result.output}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
