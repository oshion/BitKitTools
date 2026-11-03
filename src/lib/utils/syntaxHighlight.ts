// Small, dependency-free tokenizers for coloring tool inputs/outputs (Postman-style
// JSON body/response coloring). They never throw and the concatenated token texts
// always equal the input, so they work on half-typed or invalid text too.

export type HighlightLanguage = 'json' | 'sql' | 'jwt'

export type TokenKind =
  | 'key'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null-literal'
  | 'bracket'
  | 'punctuation'
  | 'keyword'
  | 'identifier'
  | 'jwt-header'
  | 'jwt-payload'
  | 'jwt-signature'
  | 'plain'

export type Token = {
  text: string
  kind: TokenKind
  /** Nesting depth for brackets (matching pairs share a depth) */
  depth?: number
}

const NUMBER_RE = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/
const WORD_RE = /^[A-Za-z_][\w$]*/
const WHITESPACE_RE = /^\s+/

// Reads a quoted run starting at `start`. JSON strings cannot span lines, so an
// unterminated string ends at the newline instead of swallowing the rest of the text.
function readQuoted(text: string, start: number, close: string, doubledEscape: boolean): number {
  let i = start + 1
  while (i < text.length) {
    const ch = text[i]
    if (!doubledEscape && ch === '\\') {
      i += 2
      continue
    }
    if (ch === close) {
      if (doubledEscape && text[i + 1] === close) {
        i += 2
        continue
      }
      return i + 1
    }
    if (ch === '\n') return i
    i++
  }
  return text.length
}

function tokenizeJson(text: string): Token[] {
  const tokens: Token[] = []
  let depth = 0
  let i = 0
  while (i < text.length) {
    const rest = text.slice(i)
    const ch = text[i]!

    const ws = WHITESPACE_RE.exec(rest)
    if (ws) {
      tokens.push({ text: ws[0], kind: 'plain' })
      i += ws[0].length
      continue
    }
    if (ch === '"') {
      const end = readQuoted(text, i, '"', false)
      const after = text.slice(end).trimStart()
      tokens.push({ text: text.slice(i, end), kind: after.startsWith(':') ? 'key' : 'string' })
      i = end
      continue
    }
    if (ch === '{' || ch === '[') {
      tokens.push({ text: ch, kind: 'bracket', depth })
      depth++
      i++
      continue
    }
    if (ch === '}' || ch === ']') {
      depth = Math.max(0, depth - 1)
      tokens.push({ text: ch, kind: 'bracket', depth })
      i++
      continue
    }
    if (ch === ':' || ch === ',') {
      tokens.push({ text: ch, kind: 'punctuation' })
      i++
      continue
    }
    const num = NUMBER_RE.exec(rest)
    if (num) {
      tokens.push({ text: num[0], kind: 'number' })
      i += num[0].length
      continue
    }
    const word = WORD_RE.exec(rest)
    if (word) {
      const w = word[0]
      tokens.push({ text: w, kind: w === 'true' || w === 'false' ? 'boolean' : w === 'null' ? 'null-literal' : 'plain' })
      i += w.length
      continue
    }
    tokens.push({ text: ch, kind: 'plain' })
    i++
  }
  return tokens
}

// Keywords and column types emitted by lib/utils/jsonToSql.ts, plus common SQL words.
const SQL_KEYWORDS = new Set([
  'INSERT', 'INTO', 'VALUES', 'CREATE', 'TABLE', 'SELECT', 'FROM', 'DUAL', 'ALL', 'WHERE',
  'UPDATE', 'SET', 'DELETE', 'PRIMARY', 'KEY', 'NOT', 'DEFAULT', 'UNIQUE', 'IF', 'EXISTS',
  'INTEGER', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'BIT', 'BOOLEAN', 'BOOL', 'TEXT',
  'VARCHAR', 'VARCHAR2', 'NVARCHAR', 'CHAR', 'CLOB', 'MAX', 'JSON', 'JSONB', 'NUMBER',
  'NUMERIC', 'DECIMAL', 'FLOAT', 'REAL', 'DOUBLE', 'PRECISION', 'DATE', 'TIMESTAMP',
])

function tokenizeSql(text: string): Token[] {
  const tokens: Token[] = []
  let depth = 0
  let i = 0
  while (i < text.length) {
    const rest = text.slice(i)
    const ch = text[i]!

    const ws = WHITESPACE_RE.exec(rest)
    if (ws) {
      tokens.push({ text: ws[0], kind: 'plain' })
      i += ws[0].length
      continue
    }
    if (ch === "'") {
      const end = readQuoted(text, i, "'", true)
      tokens.push({ text: text.slice(i, end), kind: 'string' })
      i = end
      continue
    }
    if (ch === '"' || ch === '`' || ch === '[') {
      const end = readQuoted(text, i, ch === '[' ? ']' : ch, true)
      tokens.push({ text: text.slice(i, end), kind: 'identifier' })
      i = end
      continue
    }
    if (ch === '(') {
      tokens.push({ text: ch, kind: 'bracket', depth })
      depth++
      i++
      continue
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1)
      tokens.push({ text: ch, kind: 'bracket', depth })
      i++
      continue
    }
    if (ch === ',' || ch === ';' || ch === '.') {
      tokens.push({ text: ch, kind: 'punctuation' })
      i++
      continue
    }
    const num = NUMBER_RE.exec(rest)
    if (num) {
      tokens.push({ text: num[0], kind: 'number' })
      i += num[0].length
      continue
    }
    const word = WORD_RE.exec(rest)
    if (word) {
      const w = word[0]
      const upper = w.toUpperCase()
      const kind: TokenKind =
        upper === 'NULL' ? 'null-literal' : upper === 'TRUE' || upper === 'FALSE' ? 'boolean' : SQL_KEYWORDS.has(upper) ? 'keyword' : 'plain'
      tokens.push({ text: w, kind })
      i += w.length
      continue
    }
    tokens.push({ text: ch, kind: 'plain' })
    i++
  }
  return tokens
}

const JWT_SEGMENT_KINDS: TokenKind[] = ['jwt-header', 'jwt-payload', 'jwt-signature']

function tokenizeJwt(text: string): Token[] {
  const tokens: Token[] = []
  text.split('.').forEach((segment, index) => {
    if (index > 0) tokens.push({ text: '.', kind: 'punctuation' })
    if (segment) tokens.push({ text: segment, kind: JWT_SEGMENT_KINDS[Math.min(index, 2)]! })
  })
  return tokens
}

export function tokenize(text: string, language: HighlightLanguage): Token[] {
  if (language === 'json') return tokenizeJson(text)
  if (language === 'sql') return tokenizeSql(text)
  return tokenizeJwt(text)
}
