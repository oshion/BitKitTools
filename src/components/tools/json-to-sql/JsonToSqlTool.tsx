'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { convertJsonToSql } from '@/lib/utils/jsonToSql'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { localeHref } from '@/lib/utils/locale-href'
import type { SqlDialect, OutputMode } from '@/lib/utils/jsonToSql'

// sessionStorage key shared by convention with JsonFormatterTool (same string literal,
// no cross-import — rule 8). JsonFormatterTool writes this key; this component reads it.
const SESSION_KEY = 'json-formatter-to-sql:payload'

type ConvertResult =
  | { type: 'idle' }
  | { type: 'success'; sql: string }
  | { type: 'error'; message: string; isJsonInvalid: boolean }

const DIALECT_LABELS: Record<SqlDialect, string> = {
  mssql: 'MSSQL',
  mysql: 'MySQL / MariaDB',
  oracle: 'Oracle',
  postgres: 'PostgreSQL',
}

const OUTPUT_MODE_LABELS: Record<OutputMode, string> = {
  'insert-only': 'INSERT only',
  'create-and-insert': 'CREATE + INSERT',
  'create-only': 'CREATE only',
}

export default function JsonToSqlTool() {
  const [inputJson, setInputJson] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        sessionStorage.removeItem(SESSION_KEY)
        return stored
      }
    } catch {
      // sessionStorage unavailable (private mode, etc.)
    }
    return ''
  })
  const [dialect, setDialect] = useState<SqlDialect>('mysql')
  const [tableName, setTableName] = useState('')
  const [outputMode, setOutputMode] = useState<OutputMode>('insert-only')
  const [batchEnabled, setBatchEnabled] = useState(false)
  const [batchSize, setBatchSize] = useState(100)
  const [result, setResult] = useState<ConvertResult>({ type: 'idle' })
  const [copied, setCopied] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const inputEnteredRef = useRef(false)
  const { sendEvent } = useAnalyticsEvent()
  const locale = useLocale() as 'en' | 'ko'

  // Fire tool_open once on mount
  useEffect(() => {
    sendEvent('tool_open')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fade-in animation on result change
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

  function handleConvert() {
    if (!tableName.trim()) {
      setResult({ type: 'error', message: 'Table name is required.', isJsonInvalid: false })
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(inputJson.trim())
    } catch {
      setResult({
        type: 'error',
        message: 'Invalid JSON — please fix the syntax before converting.',
        isJsonInvalid: true,
      })
      sendEvent('calculate')
      return
    }

    const r = convertJsonToSql({
      json: parsed,
      tableName: tableName.trim(),
      dialect,
      outputMode,
      batchSize: batchEnabled ? batchSize : 1,
    })

    if (r.success) {
      setResult({ type: 'success', sql: r.sql })
    } else {
      setResult({ type: 'error', message: r.error, isJsonInvalid: false })
    }
    sendEvent('calculate')
  }

  async function handleCopy() {
    if (result.type !== 'success') return
    try {
      await navigator.clipboard.writeText(result.sql)
      setCopied(true)
      sendEvent('copy_result')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable in insecure contexts; silent fail
    }
  }

  return (
    <div className="space-y-6">
      {/* Trust message */}
      <p className="text-xs text-neutral-500">
        Processed entirely in your browser — JSON never leaves your device.
      </p>

      {/* JSON input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-400" htmlFor="json-input">
          JSON Input
        </label>
        <textarea
          id="json-input"
          value={inputJson}
          onChange={(e) => {
            if (!inputEnteredRef.current) {
              inputEnteredRef.current = true
              sendEvent('input_enter')
            }
            setInputJson(e.target.value)
          }}
          placeholder={'Paste JSON here…\n\nExample:\n{"id": 1, "name": "Alice", "active": true}'}
          rows={8}
          spellCheck={false}
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-200 font-mono leading-relaxed focus:border-neutral-600 focus:outline-none resize-y"
        />
      </div>

      {/* Options row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Dialect selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-400">SQL Dialect</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DIALECT_LABELS) as SqlDialect[]).map((d) => (
              <button
                key={d}
                onClick={() => setDialect(d)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  dialect === d
                    ? 'bg-white text-black'
                    : 'bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                }`}
              >
                {DIALECT_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Table name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-400" htmlFor="table-name">
            Table Name <span className="text-red-400">*</span>
          </label>
          <input
            id="table-name"
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g. users"
            className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-neutral-200 focus:border-neutral-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Output mode */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-400">Output Mode</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(OUTPUT_MODE_LABELS) as OutputMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setOutputMode(mode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                outputMode === mode
                  ? 'bg-white text-black'
                  : 'bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-neutral-500'
              }`}
            >
              {OUTPUT_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* Batch options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={batchEnabled}
            onChange={(e) => setBatchEnabled(e.target.checked)}
            className="rounded border-neutral-700 bg-neutral-900 text-white"
          />
          <span className="text-sm text-neutral-300">Batch multiple rows into one INSERT statement</span>
        </label>
        {batchEnabled && (
          <div className="flex items-center gap-3 pl-6">
            <label className="text-sm text-neutral-400" htmlFor="batch-size">
              Rows per batch:
            </label>
            <input
              id="batch-size"
              type="number"
              min={2}
              max={1000}
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(2, parseInt(e.target.value) || 2))}
              className="w-24 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-sm text-neutral-200 focus:border-neutral-600 focus:outline-none"
            />
            {dialect === 'oracle' && (
              <span className="text-xs text-neutral-500">Oracle: uses INSERT ALL syntax</span>
            )}
          </div>
        )}
      </div>

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={!inputJson.trim()}
        className="rounded-lg bg-white text-black px-6 py-2.5 text-sm font-medium hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Convert to SQL
      </button>

      {/* Result */}
      {result.type !== 'idle' && (
        <div ref={resultRef} className="space-y-3">
          {result.type === 'error' ? (
            <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4 space-y-2">
              <p className="text-sm font-medium text-red-300">{result.message}</p>
              {result.isJsonInvalid && (
                <p className="text-xs text-neutral-400">
                  Need to clean up your JSON first?{' '}
                  <Link
                    href={localeHref(locale, '/developer/json-formatter')}
                    className="text-neutral-300 underline underline-offset-2 hover:text-white"
                  >
                    Open JSON Formatter
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-400">Generated SQL</p>
                <button
                  onClick={handleCopy}
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-6 overflow-x-auto">
                <pre className="text-sm font-mono text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                  {result.sql}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
