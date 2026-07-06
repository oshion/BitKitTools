type FormatSuccess = { success: true; output: string }
type FormatError = { success: false; error: string; line?: number; errorContext?: string }
type FormatResult = FormatSuccess | FormatError
export type FormatOptions = { preserveComments?: boolean }

const ERROR_CONTEXT_RADIUS = 20

/**
 * Extracts the line number and absolute character position from a JSON.parse
 * error message. Chrome/Node produce messages like
 * "Unexpected token } in JSON at position 42" (older V8, position only) or
 * "Expected ',' or '}' after property value in JSON at position 41 (line 4 column 3)"
 * (modern V8, both position and line/column).
 */
function extractErrorLocation(raw: string, input: string): { line?: number; position?: number } {
  const posMatch = raw.match(/at position (\d+)/i)
  const lineMatch = raw.match(/at line (\d+)/i)

  if (posMatch?.[1]) {
    const position = parseInt(posMatch[1], 10)
    const line = lineMatch?.[1]
      ? parseInt(lineMatch[1], 10)
      : input.slice(0, position).split('\n').length
    return { line, position }
  }

  const lineColMatch = raw.match(/at line (\d+) column (\d+)/i)
  if (lineColMatch?.[1] && lineColMatch[2]) {
    const targetLine = parseInt(lineColMatch[1], 10)
    const column = parseInt(lineColMatch[2], 10)
    const lines = input.split('\n')
    let offset = 0
    for (let i = 0; i < targetLine - 1 && i < lines.length; i++) {
      offset += (lines[i]?.length ?? 0) + 1
    }
    return { line: targetLine, position: offset + (column - 1) }
  }

  if (lineMatch?.[1]) {
    return { line: parseInt(lineMatch[1], 10) }
  }

  return {}
}

/**
 * Builds a compact, single-line snippet of source text centered on the error
 * position. Showing a fixed window (rather than the whole source line) keeps
 * the snippet useful even when a missing comma/quote glues what the user
 * intended as multiple lines into one long line.
 */
function buildErrorContext(text: string, position: number): string {
  const start = Math.max(0, position - ERROR_CONTEXT_RADIUS)
  const end = Math.min(text.length, position + ERROR_CONTEXT_RADIUS)
  return text.slice(start, end).replace(/\s+/g, ' ').trim()
}

/**
 * Converts a raw JSON.parse error message into a user-friendly description.
 */
function humanizeError(raw: string): string {
  if (/unexpected token/i.test(raw)) {
    if (/,/i.test(raw)) return 'Unexpected comma — check for trailing commas after the last item.'
    return 'Unexpected character — check for missing quotes, brackets, or commas.'
  }
  if (/unexpected end/i.test(raw)) {
    return 'Unexpected end of input — the JSON may be incomplete or missing a closing bracket/brace.'
  }
  if (/expected property name/i.test(raw) || /double quotes/i.test(raw)) {
    return 'Property names must be wrapped in double quotes.'
  }
  if (/unterminated string/i.test(raw)) {
    return 'Unterminated string — a string value is missing its closing double quote.'
  }
  return `Invalid JSON: ${raw}`
}

function isCommentStart(input: string, i: number): boolean {
  return (
    (input[i] === '/' && input[i + 1] === '/') ||
    (input[i] === '-' && input[i + 1] === '-') ||
    input[i] === '#'
  )
}

/**
 * Strips //, --, and # line comments so JSONC-ish input can be parsed as JSON.
 * Comment markers found inside double-quoted strings are left untouched
 * (e.g. a "https://..." URL, a "a -- b" value, or a "#fff" color must survive intact).
 */
function stripJsonComments(input: string): string {
  let result = ''
  let inString = false
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    if (inString) {
      result += ch
      if (ch === '\\' && i + 1 < input.length) {
        result += input[i + 1]
        i += 2
        continue
      }
      if (ch === '"') inString = false
      i++
      continue
    }

    if (ch === '"') {
      inString = true
      result += ch
      i++
      continue
    }

    if (isCommentStart(input, i)) {
      const newlineIdx = input.indexOf('\n', i)
      i = newlineIdx === -1 ? input.length : newlineIdx
      continue
    }

    result += ch
    i++
  }

  return result
}

type ParseOutcome = { success: true; value: unknown } | FormatError

/**
 * Parses a trimmed JSON(C-ish) string, tolerating //, --, and # line comments.
 * On failure, resolves the line number and a bounded context snippet around
 * the exact error position so the caller can show the user what to fix.
 */
function parseTolerant(trimmed: string): ParseOutcome {
  const stripped = stripJsonComments(trimmed)

  try {
    const value: unknown = JSON.parse(stripped)
    return { success: true, value }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    const { line, position } = extractErrorLocation(raw, stripped)
    return {
      success: false,
      error: humanizeError(raw),
      line,
      errorContext: position !== undefined ? buildErrorContext(stripped, position) : undefined,
    }
  }
}

type Token =
  | { kind: 'punct'; value: '{' | '}' | '[' | ']' | ':' | ','; precededByNewline: boolean }
  | { kind: 'value'; text: string; precededByNewline: boolean }
  | { kind: 'comment'; text: string; precededByNewline: boolean }

/**
 * Tokenizes trimmed, already-validated JSONC-ish input into structural
 * punctuation, value literals (strings/numbers/true/false/null), and comments.
 * Each token records whether a newline preceded it, so the printer can tell
 * a same-line trailing comment from a standalone comment on its own line.
 */
function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let sawNewline = false

  function push(token: { kind: 'punct'; value: '{' | '}' | '[' | ']' | ':' | ',' } | { kind: 'value' | 'comment'; text: string }) {
    tokens.push({ ...token, precededByNewline: sawNewline } as Token)
    sawNewline = false
  }

  while (i < input.length) {
    const ch = input[i]

    if (ch === '\n') {
      sawNewline = true
      i++
      continue
    }
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++
      continue
    }

    if (ch === '"') {
      let j = i + 1
      while (j < input.length) {
        if (input[j] === '\\') {
          j += 2
          continue
        }
        if (input[j] === '"') {
          j++
          break
        }
        j++
      }
      push({ kind: 'value', text: input.slice(i, j) })
      i = j
      continue
    }

    if (ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ':' || ch === ',') {
      push({ kind: 'punct', value: ch })
      i++
      continue
    }

    if (isCommentStart(input, i)) {
      const newlineIdx = input.indexOf('\n', i)
      const end = newlineIdx === -1 ? input.length : newlineIdx
      push({ kind: 'comment', text: input.slice(i, end) })
      i = end
      continue
    }

    let j = i
    while (j < input.length && !' \t\n\r{}[]:,"'.includes(input[j] ?? '') && !isCommentStart(input, j)) {
      j++
    }
    push({ kind: 'value', text: input.slice(i, j) })
    i = j
  }

  return tokens
}

/**
 * Re-indents a token stream produced by tokenize(), reattaching comments to
 * whichever token they followed instead of regenerating output from a parsed
 * JS value (which would discard them). Trailing comments stay on the same
 * output line as their preceding token; comments on their own input line
 * stay on their own output line.
 */
function printWithComments(tokens: Token[], indent: 2 | 4): string {
  const pad = (depth: number) => ' '.repeat(depth * indent)
  let out = ''
  let depth = 0
  let needsNewlineIndent = false
  let prevWasOpener = false

  function flush(targetDepth: number) {
    if (needsNewlineIndent) {
      out += '\n' + pad(targetDepth)
      needsNewlineIndent = false
    }
  }

  for (const token of tokens) {
    if (token.kind === 'comment') {
      if (token.precededByNewline) {
        flush(depth)
        out += token.text
      } else {
        out += (out === '' ? '' : '  ') + token.text
      }
      needsNewlineIndent = true
      prevWasOpener = false
      continue
    }

    if (token.kind === 'punct' && (token.value === '{' || token.value === '[')) {
      flush(depth)
      out += token.value
      depth++
      needsNewlineIndent = true
      prevWasOpener = true
      continue
    }

    if (token.kind === 'punct' && (token.value === '}' || token.value === ']')) {
      const wasEmpty = prevWasOpener
      depth--
      needsNewlineIndent = !wasEmpty
      flush(depth)
      out += token.value
      prevWasOpener = false
      continue
    }

    if (token.kind === 'punct' && token.value === ':') {
      out += ': '
      prevWasOpener = false
      continue
    }

    if (token.kind === 'punct' && token.value === ',') {
      out += ','
      needsNewlineIndent = true
      prevWasOpener = false
      continue
    }

    if (token.kind === 'value') {
      flush(depth)
      out += token.text
      prevWasOpener = false
    }
  }

  return out
}

/**
 * Formats (pretty-prints) a JSON string with the specified indentation.
 * With `preserveComments`, //, --, and # comments are kept in place instead
 * of discarded — only meaningful in format mode, since a minified single
 * line can't contain a trailing line comment without swallowing the rest of it.
 * Returns a user-friendly error message and optional line/context on failure.
 */
export function formatJson(input: string, indent: 2 | 4, options: FormatOptions = {}): FormatResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { success: false, error: 'Input is empty. Paste some JSON to format.' }
  }

  const outcome = parseTolerant(trimmed)
  if (!outcome.success) return outcome

  if (options.preserveComments) {
    return { success: true, output: printWithComments(tokenize(trimmed), indent) }
  }

  return { success: true, output: JSON.stringify(outcome.value, null, indent) }
}

/**
 * Minifies (compresses) a JSON string by removing all unnecessary whitespace.
 * Comments are always stripped (never preserved) since a minified single line
 * can't contain a line comment without breaking the rest of that line.
 * Returns a user-friendly error message and optional line/context on failure.
 */
export function minifyJson(input: string): FormatResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { success: false, error: 'Input is empty. Paste some JSON to minify.' }
  }

  const outcome = parseTolerant(trimmed)
  if (!outcome.success) return outcome
  return { success: true, output: JSON.stringify(outcome.value) }
}
