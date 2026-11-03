import { detectIndentUnit, splitIndent } from './indentRainbow'

describe('detectIndentUnit', () => {
  it('detects 2-space indentation', () => {
    expect(detectIndentUnit('{\n  "a": {\n    "b": 1\n  }\n}')).toBe(2)
  })

  it('detects 4-space indentation', () => {
    expect(detectIndentUnit('{\n    "a": {\n        "b": 1\n    }\n}')).toBe(4)
  })

  it('falls back to 2 when nothing is indented (e.g. minified JSON)', () => {
    expect(detectIndentUnit('{"a":1}')).toBe(2)
  })

  it('ignores blank lines made of spaces', () => {
    expect(detectIndentUnit('a\n \n    b')).toBe(4)
  })
})

describe('splitIndent', () => {
  it('splits leading whitespace into one segment per indent level', () => {
    expect(splitIndent('    "b": 1', 2)).toEqual({ levels: ['  ', '  '], rest: '"b": 1' })
  })

  it('keeps a partial (non-multiple) indent in the rest of the line', () => {
    expect(splitIndent('   x', 2)).toEqual({ levels: ['  '], rest: ' x' })
  })

  it('returns no levels for an unindented line', () => {
    expect(splitIndent('{', 2)).toEqual({ levels: [], rest: '{' })
  })

  it('handles an all-space line', () => {
    expect(splitIndent('    ', 4)).toEqual({ levels: ['    '], rest: '' })
  })
})
