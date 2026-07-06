type FormatSuccess = { success: true; output: string }
type FormatError = { success: false; error: string; line?: number; errorContext?: string }
type FormatResult = FormatSuccess | FormatError

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

type ParseOutcome = { success: true; value: unknown } | FormatError

/**
 * Parses a trimmed JSON string. On failure, resolves the line number and a
 * bounded context snippet around the exact error position so the caller can
 * show the user what to fix.
 */
function parseJson(trimmed: string): ParseOutcome {
  try {
    const value: unknown = JSON.parse(trimmed)
    return { success: true, value }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    const { line, position } = extractErrorLocation(raw, trimmed)
    return {
      success: false,
      error: humanizeError(raw),
      line,
      errorContext: position !== undefined ? buildErrorContext(trimmed, position) : undefined,
    }
  }
}

/**
 * Formats (pretty-prints) a JSON string with the specified indentation.
 * Returns a user-friendly error message and optional line/context on failure.
 */
export function formatJson(input: string, indent: 2 | 4): FormatResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { success: false, error: 'Input is empty. Paste some JSON to format.' }
  }

  const outcome = parseJson(trimmed)
  if (!outcome.success) return outcome
  return { success: true, output: JSON.stringify(outcome.value, null, indent) }
}

/**
 * Minifies (compresses) a JSON string by removing all unnecessary whitespace.
 * Returns a user-friendly error message and optional line/context on failure.
 */
export function minifyJson(input: string): FormatResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { success: false, error: 'Input is empty. Paste some JSON to minify.' }
  }

  const outcome = parseJson(trimmed)
  if (!outcome.success) return outcome
  return { success: true, output: JSON.stringify(outcome.value) }
}
