import { tokenize, type Token } from './syntaxHighlight'

const join = (tokens: Token[]) => tokens.map((t) => t.text).join('')
const kinds = (tokens: Token[]) => tokens.filter((t) => t.kind !== 'plain').map((t) => [t.kind, t.text])

describe('tokenize — json', () => {
  it('reproduces the input exactly', () => {
    const text = '{\n  "a": [1, -2.5e3, true, null],\n  "b": "x"\n}'
    expect(join(tokenize(text, 'json'))).toBe(text)
  })

  it('tells keys from string values and types literals', () => {
    expect(kinds(tokenize('{"name": "Alice", "age": -30.5, "ok": false, "x": null}', 'json'))).toEqual([
      ['bracket', '{'],
      ['key', '"name"'],
      ['punctuation', ':'],
      ['string', '"Alice"'],
      ['punctuation', ','],
      ['key', '"age"'],
      ['punctuation', ':'],
      ['number', '-30.5'],
      ['punctuation', ','],
      ['key', '"ok"'],
      ['punctuation', ':'],
      ['boolean', 'false'],
      ['punctuation', ','],
      ['key', '"x"'],
      ['punctuation', ':'],
      ['null-literal', 'null'],
      ['bracket', '}'],
    ])
  })

  it('gives matching brackets the same depth and nested ones a deeper depth', () => {
    const brackets = tokenize('{"a": [{"b": []}]}', 'json').filter((t) => t.kind === 'bracket')
    expect(brackets.map((t) => [t.text, t.depth])).toEqual([
      ['{', 0],
      ['[', 1],
      ['{', 2],
      ['[', 3],
      [']', 3],
      ['}', 2],
      [']', 1],
      ['}', 0],
    ])
  })

  it('handles escaped quotes inside strings', () => {
    expect(kinds(tokenize('"say \\"hi\\""', 'json'))).toEqual([['string', '"say \\"hi\\""']])
  })

  it('tolerates invalid / half-typed input without throwing', () => {
    const text = '{"a": "unterminated\n  "b": tru, }]] @'
    const tokens = tokenize(text, 'json')
    expect(join(tokens)).toBe(text)
    // stray closing brackets never go below depth 0
    expect(tokens.every((t) => (t.depth ?? 0) >= 0)).toBe(true)
  })
})

describe('tokenize — sql', () => {
  it('reproduces the input exactly', () => {
    const text = 'CREATE TABLE "users" (\n  "id" INTEGER,\n  "name" VARCHAR(255)\n);'
    expect(join(tokenize(text, 'sql'))).toBe(text)
  })

  it('colors keywords, quoted identifiers, strings, numbers and literals', () => {
    expect(kinds(tokenize(`INSERT INTO "t" ("a", [b]) VALUES (1, 'it''s', NULL, TRUE);`, 'sql'))).toEqual([
      ['keyword', 'INSERT'],
      ['keyword', 'INTO'],
      ['identifier', '"t"'],
      ['bracket', '('],
      ['identifier', '"a"'],
      ['punctuation', ','],
      ['identifier', '[b]'],
      ['bracket', ')'],
      ['keyword', 'VALUES'],
      ['bracket', '('],
      ['number', '1'],
      ['punctuation', ','],
      ['string', "'it''s'"],
      ['punctuation', ','],
      ['null-literal', 'NULL'],
      ['punctuation', ','],
      ['boolean', 'TRUE'],
      ['bracket', ')'],
      ['punctuation', ';'],
    ])
  })

  it('treats type names as keywords and leaves plain words plain', () => {
    expect(kinds(tokenize('`price` DOUBLE PRECISION, foo', 'sql'))).toEqual([
      ['identifier', '`price`'],
      ['keyword', 'DOUBLE'],
      ['keyword', 'PRECISION'],
      ['punctuation', ','],
    ])
  })
})

describe('tokenize — jwt', () => {
  it('colors header, payload and signature segments like jwt.io', () => {
    expect(kinds(tokenize('aaa.bbb.ccc', 'jwt'))).toEqual([
      ['jwt-header', 'aaa'],
      ['punctuation', '.'],
      ['jwt-payload', 'bbb'],
      ['punctuation', '.'],
      ['jwt-signature', 'ccc'],
    ])
  })

  it('reproduces the input exactly, including partial tokens', () => {
    for (const text of ['', 'eyJh', 'a.b', 'a.b.c.d']) expect(join(tokenize(text, 'jwt'))).toBe(text)
  })
})
