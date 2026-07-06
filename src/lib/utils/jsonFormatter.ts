type FormatSuccess = { success: true; output: string }
type FormatError = { success: false; error: string; line?: number; lineContent?: string }
type FormatResult = FormatSuccess | FormatError

/**
 * Attempts to parse an error message from JSON.parse to extract a line number.
 * Chrome/Node produce messages like "Unexpected token } in JSON at position 42"
 * or "Expected ',' or '}' after property value in JSON at line 3 column 1 (char 42)".
 */
function extractLineNumber(raw: string, input: string): number | undefined {
  // Modern V8: "at line N column M"
  const lineMatch = raw.match(/at line (\d+)/i)
  if (lineMatch?.[1]) return parseInt(lineMatch[1], 10)

  // Older V8: "at position N" — convert char offset to line number
  const posMatch = raw.match(/at position (\d+)/i)
  if (posMatch?.[1]) {
    const pos = parseInt(posMatch[1], 10)
    const upToPos = input.slice(0, pos)
    return upToPos.split('\n').length
  }

  return undefined
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

/**
 * Strips // and -- line comments so JSONC-ish input can be parsed as JSON.
 * Comment markers found inside double-quoted strings are left untouched
 * (e.g. a "https://..." URL or a "a -- b" string value must survive intact).
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

    if ((ch === '/' && input[i + 1] === '/') || (ch === '-' && input[i + 1] === '-')) {
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
 * Parses a trimmed JSON(C-ish) string, tolerating // and -- line comments.
 * On failure, resolves both the line number and the original source line
 * text (comments included) so the caller can show the user exactly what to fix.
 */
function parseTolerant(trimmed: string): ParseOutcome {
  const stripped = stripJsonComments(trimmed)

  try {
    const value: unknown = JSON.parse(stripped)
    return { success: true, value }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    const line = extractLineNumber(raw, stripped)
    return {
      success: false,
      error: humanizeError(raw),
      line,
      lineContent: line !== undefined ? trimmed.split('\n')[line - 1] : undefined,
    }
  }
}

/**
 * Formats (pretty-prints) a JSON string with the specified indentation.
 * Returns a user-friendly error message and optional line number/content on failure.
 */
export function formatJson(input: string, indent: 2 | 4): FormatResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { success: false, error: 'Input is empty. Paste some JSON to format.' }
  }

  const outcome = parseTolerant(trimmed)
  if (!outcome.success) return outcome
  return { success: true, output: JSON.stringify(outcome.value, null, indent) }
}

/**
 * Minifies (compresses) a JSON string by removing all unnecessary whitespace.
 * Returns a user-friendly error message and optional line number/content on failure.
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
