type FormatSuccess = { success: true; output: string }
type FormatError = { success: false; error: string; line?: number }
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
 * Formats (pretty-prints) a JSON string with the specified indentation.
 * Returns a user-friendly error message and optional line number on failure.
 */
export function formatJson(input: string, indent: 2 | 4): FormatResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { success: false, error: 'Input is empty. Paste some JSON to format.' }
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)
    return { success: true, output: JSON.stringify(parsed, null, indent) }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: humanizeError(raw),
      line: extractLineNumber(raw, trimmed),
    }
  }
}

/**
 * Minifies (compresses) a JSON string by removing all unnecessary whitespace.
 * Returns a user-friendly error message on failure.
 */
export function minifyJson(input: string): FormatResult {
  const trimmed = input.trim()
  if (trimmed === '') {
    return { success: false, error: 'Input is empty. Paste some JSON to minify.' }
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)
    return { success: true, output: JSON.stringify(parsed) }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: humanizeError(raw),
      line: extractLineNumber(raw, trimmed),
    }
  }
}
