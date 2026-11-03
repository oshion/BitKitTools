import type { MouseEventHandler } from 'react'
import { detectIndentUnit, splitIndent } from '@/lib/utils/indentRainbow'

// Above this many lines, per-line spans cost more than they help — render plain text.
export const MAX_RAINBOW_LINES = 5000

// Subtle background bands per indent level (dark theme). No purple/indigo, no glow —
// see docs/UI_GUIDE.md.
const LEVEL_COLORS = [
  'bg-amber-400/10',
  'bg-emerald-400/10',
  'bg-sky-400/10',
  'bg-rose-400/10',
  'bg-lime-400/10',
  'bg-orange-400/10',
]

type IndentRainbowPreProps = {
  text: string
  className?: string
  title?: string
  onClick?: MouseEventHandler<HTMLPreElement>
}

// <pre> that colors each indent level of formatted output (JSON, SQL) like the
// "indent-rainbow" editor extension. The text content stays byte-identical, so
// selecting/copying the output is unchanged.
export default function IndentRainbowPre({ text, className, title, onClick }: IndentRainbowPreProps) {
  const lines = text.split('\n')

  if (lines.length > MAX_RAINBOW_LINES) {
    return (
      <pre className={className} title={title} onClick={onClick}>
        {text}
      </pre>
    )
  }

  const unit = detectIndentUnit(text)

  return (
    <pre className={className} title={title} onClick={onClick}>
      {lines.map((line, i) => {
        const { levels, rest } = splitIndent(line, unit)
        return (
          <span key={i}>
            {levels.map((segment, level) => (
              <span
                key={level}
                data-indent-level={level}
                className={LEVEL_COLORS[level % LEVEL_COLORS.length]}
              >
                {segment}
              </span>
            ))}
            {rest}
            {i < lines.length - 1 ? '\n' : null}
          </span>
        )
      })}
    </pre>
  )
}
