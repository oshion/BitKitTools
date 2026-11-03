import type { MouseEventHandler, ReactNode } from 'react'
import { tokenize, type HighlightLanguage, type TokenKind } from '@/lib/utils/syntaxHighlight'

// Above this size, per-token spans cost more than they help — render plain text.
export const MAX_HIGHLIGHT_CHARS = 200_000

// Postman-style token colors for the dark theme. Color only — no font-weight/italic,
// because CodeEditor overlays this layer under a textarea and glyph widths must match.
// No purple/indigo (docs/UI_GUIDE.md).
const KIND_COLORS: Partial<Record<TokenKind, string>> = {
  key: 'text-sky-300',
  string: 'text-emerald-300',
  number: 'text-orange-300',
  boolean: 'text-rose-300',
  'null-literal': 'text-neutral-400',
  keyword: 'text-sky-400',
  identifier: 'text-amber-200',
  punctuation: 'text-neutral-500',
  'jwt-header': 'text-rose-300',
  'jwt-payload': 'text-sky-300',
  'jwt-signature': 'text-emerald-300',
}

// Bracket pair colors by nesting depth (like VS Code bracket pair colorization).
const BRACKET_COLORS = ['text-yellow-300', 'text-pink-300', 'text-cyan-300']

/** Token spans for `text`, or the plain text when it is too large to highlight. */
export function highlightedNodes(text: string, language: HighlightLanguage): ReactNode {
  if (text.length > MAX_HIGHLIGHT_CHARS) return text

  return tokenize(text, language).map((token, i) => {
    if (token.kind === 'plain') return token.text
    const depth = token.depth ?? 0
    const color = token.kind === 'bracket' ? BRACKET_COLORS[depth % BRACKET_COLORS.length] : KIND_COLORS[token.kind]
    return (
      <span
        key={i}
        data-token={token.kind}
        data-depth={token.kind === 'bracket' ? depth : undefined}
        className={color}
      >
        {token.text}
      </span>
    )
  })
}

type CodeHighlightProps = {
  text: string
  language: HighlightLanguage
  className?: string
  title?: string
  onClick?: MouseEventHandler<HTMLPreElement>
}

// Read-only syntax-highlighted <pre> for tool outputs. The text content stays
// byte-identical, so selecting/copying the output is unchanged.
export default function CodeHighlight({ text, language, className, title, onClick }: CodeHighlightProps) {
  return (
    <pre className={className} title={title} onClick={onClick}>
      {highlightedNodes(text, language)}
    </pre>
  )
}
