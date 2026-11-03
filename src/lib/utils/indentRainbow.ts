const DEFAULT_INDENT_UNIT = 2

// Smallest non-zero leading-space count across non-blank lines — the indent width the
// text was formatted with (2 or 4 for JSON.stringify output). Falls back to 2.
export function detectIndentUnit(text: string): number {
  let unit = 0
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue
    const leading = line.length - line.trimStart().length
    if (leading > 0 && (unit === 0 || leading < unit)) unit = leading
  }
  return unit || DEFAULT_INDENT_UNIT
}

// Splits a line's leading spaces into one `unit`-wide segment per indent level.
// Leftover spaces that don't fill a whole level stay in `rest`.
export function splitIndent(line: string, unit: number): { levels: string[]; rest: string } {
  const leading = line.length - line.trimStart().length
  const levelCount = Math.floor(leading / unit)
  const levels = Array.from({ length: levelCount }, (_, i) => line.slice(i * unit, (i + 1) * unit))
  return { levels, rest: line.slice(levelCount * unit) }
}
