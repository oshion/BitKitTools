'use client'

import { useState, useEffect } from 'react'
import { decodeJwt, explainStandardClaims } from '@/lib/utils/jwtDecoder'
import type { ClaimExplanation } from '@/lib/utils/jwtDecoder'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

type Locale = 'en' | 'ko'

type Props = {
  locale: Locale
}

type DecodeState =
  | { status: 'idle' }
  | {
      status: 'success'
      header: Record<string, unknown>
      payload: Record<string, unknown>
      signature: string
      claims: ClaimExplanation[]
      expStatus: 'expired' | 'valid' | null
    }
  | { status: 'error'; message: string }

export default function JwtDecoderTool({ locale }: Props) {
  const [token, setToken] = useState('')
  const [state, setState] = useState<DecodeState>({ status: 'idle' })
  const [headerCopied, setHeaderCopied] = useState(false)
  const [payloadCopied, setPayloadCopied] = useState(false)
  const { sendEvent } = useAnalyticsEvent()

  useEffect(() => {
    sendEvent('tool_open')
  }, [sendEvent])

  function handleDecode() {
    const trimmed = token.trim()
    if (!trimmed) {
      setState({ status: 'error', message: locale === 'ko' ? '토큰을 입력해 주세요.' : 'Please enter a token.' })
      return
    }

    const result = decodeJwt(trimmed)
    if (!result.success) {
      setState({ status: 'error', message: result.error })
      return
    }

    const { header, payload, signature } = result.decoded
    const claims = explainStandardClaims(payload, locale)

    let expStatus: 'expired' | 'valid' | null = null
    if ('exp' in payload && typeof payload['exp'] === 'number') {
      expStatus = payload['exp'] < Math.floor(Date.now() / 1000) ? 'expired' : 'valid'
    }

    setState({ status: 'success', header, payload, signature, claims, expStatus })
    // Do NOT include token value in event payload (sensitive auth data)
    sendEvent('calculate')
  }

  function handleCopy(text: string, which: 'header' | 'payload') {
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'header') {
        setHeaderCopied(true)
        setTimeout(() => setHeaderCopied(false), 1500)
      } else {
        setPayloadCopied(true)
        setTimeout(() => setPayloadCopied(false), 1500)
      }
    })
  }

  const isKo = locale === 'ko'

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-400" htmlFor="jwt-input">
          {isKo ? 'JWT 토큰 붙여넣기' : 'Paste JWT Token'}
        </label>
        <textarea
          id="jwt-input"
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-200 font-mono focus:border-neutral-600 focus:outline-none resize-none leading-relaxed break-all"
          rows={4}
          placeholder={
            isKo
              ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.xxxxx'
              : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.xxxxx'
          }
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        <p className="text-xs text-neutral-500">
          🔒{' '}
          {isKo
            ? '토큰은 브라우저를 벗어나지 않습니다 — 서버로 전송되지 않습니다.'
            : 'Your token never leaves your browser — it is not sent to any server.'}
        </p>
      </div>

      <button
        onClick={handleDecode}
        className="rounded-lg bg-white text-black text-sm font-medium px-5 py-2.5 hover:bg-neutral-200 transition-colors"
      >
        {isKo ? '디코딩' : 'Decode'}
      </button>

      {/* Error */}
      {state.status === 'error' && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {state.message}
        </div>
      )}

      {/* Results */}
      {state.status === 'success' && (
        <div className="space-y-6 animate-fade-in">
          {/* Expiry badge */}
          {state.expStatus !== null && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium border ${
                state.expStatus === 'expired'
                  ? 'border-red-900/50 bg-red-950/30 text-red-300'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-300'
              }`}
            >
              {state.expStatus === 'expired' ? (
                <>
                  <span>⚠</span>
                  <span>
                    {isKo
                      ? '만료 시각이 지났습니다 (시간 비교 기반; 암호학적 검증 아님)'
                      : 'Expiry time has passed (time-based check only; not a cryptographic check)'}
                  </span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>
                    {isKo
                      ? '아직 유효한 시각입니다 (시간 비교 기반; 암호학적 검증 아님)'
                      : 'Within the valid window (time-based check only; not a cryptographic check)'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Header + Payload side by side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                  {isKo ? 'Header' : 'Header'}
                </span>
                <button
                  onClick={() =>
                    handleCopy(JSON.stringify(state.header, null, 2), 'header')
                  }
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {headerCopied ? (isKo ? '복사됨!' : 'Copied!') : (isKo ? '복사' : 'Copy')}
                </button>
              </div>
              <pre className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 text-sm text-neutral-300 font-mono overflow-auto leading-relaxed">
                {JSON.stringify(state.header, null, 2)}
              </pre>
            </div>

            {/* Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                  {isKo ? 'Payload' : 'Payload'}
                </span>
                <button
                  onClick={() =>
                    handleCopy(JSON.stringify(state.payload, null, 2), 'payload')
                  }
                  className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {payloadCopied ? (isKo ? '복사됨!' : 'Copied!') : (isKo ? '복사' : 'Copy')}
                </button>
              </div>
              <pre className="rounded-lg bg-neutral-900 border border-neutral-800 p-4 text-sm text-neutral-300 font-mono overflow-auto leading-relaxed">
                {JSON.stringify(state.payload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Signature (read-only display, not verified) */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              {isKo
                ? 'Signature (검증하지 않음 — 표시 전용)'
                : 'Signature (not verified — display only)'}
            </span>
            <div className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-xs text-neutral-500 font-mono break-all">
              {state.signature}
            </div>
          </div>

          {/* Claim explanations */}
          {state.claims.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-300">
                {isKo ? '표준 클레임 설명' : 'Standard Claims'}
              </h3>
              <ul className="space-y-3">
                {state.claims.map((claim) => (
                  <li
                    key={claim.key}
                    className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-medium text-[#f59e0b]">
                        {claim.key}
                      </code>
                      <span className="text-xs text-neutral-500 font-mono">
                        {typeof claim.value === 'string'
                          ? `"${claim.value}"`
                          : String(claim.value)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{claim.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
