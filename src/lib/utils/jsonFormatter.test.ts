import { formatJson, minifyJson } from './jsonFormatter'

describe('formatJson', () => {
  describe('valid JSON', () => {
    it('formats a simple object with 2-space indent', () => {
      const result = formatJson('{"a":1,"b":2}', 2)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBe('{\n  "a": 1,\n  "b": 2\n}')
      }
    })

    it('formats a simple object with 4-space indent', () => {
      const result = formatJson('{"a":1}', 4)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBe('{\n    "a": 1\n}')
      }
    })

    it('formats a nested object', () => {
      const input = '{"user":{"name":"Alice","age":30}}'
      const result = formatJson(input, 2)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toContain('"user"')
        expect(result.output).toContain('"name": "Alice"')
      }
    })

    it('formats an array', () => {
      const result = formatJson('[1,2,3]', 2)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBe('[\n  1,\n  2,\n  3\n]')
      }
    })

    it('handles already-formatted JSON (idempotent output)', () => {
      const input = JSON.stringify({ x: 1, y: 2 }, null, 2)
      const result = formatJson(input, 2)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBe(input)
      }
    })

    it('strips leading/trailing whitespace from input', () => {
      const result = formatJson('  {"a":1}  ', 2)
      expect(result.success).toBe(true)
    })
  })

  describe('invalid JSON', () => {
    it('returns error for empty input', () => {
      const result = formatJson('', 2)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toMatch(/empty/i)
      }
    })

    it('returns error for input with only whitespace', () => {
      const result = formatJson('   ', 2)
      expect(result.success).toBe(false)
    })

    it('returns a user-friendly error for trailing comma', () => {
      const result = formatJson('{"a":1,}', 2)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
        expect(typeof result.error).toBe('string')
      }
    })

    it('returns error for missing quotes on key', () => {
      const result = formatJson('{a:1}', 2)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('returns error for incomplete JSON', () => {
      const result = formatJson('{"a":', 2)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })

    it('may include a line number for located errors', () => {
      // Line number extraction is best-effort; we only verify type when present
      const result = formatJson('{\n  "a": 1,\n}', 2)
      expect(result.success).toBe(false)
      if (!result.success && result.line !== undefined) {
        expect(typeof result.line).toBe('number')
        expect(result.line).toBeGreaterThan(0)
      }
    })

    it('includes a context window around the exact error position, not the whole line', () => {
      const input = '{\n  "totalBills": 0,\n  "grossSales": 0\n  "netSales": 0\n}'
      const result = formatJson(input, 2)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.line).toBe(4)
        expect(result.errorContext).toBe('"grossSales": 0 "netSales": 0 }')
      }
    })

    it('captures both sides of a broken junction (e.g. missing comma/quote glued across lines)', () => {
      const input = '{"salesDate": "","storeCode": ""' + '"totalBills": 0}'
      const result = formatJson(input, 2)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorContext).toContain('storeCode')
        expect(result.errorContext).toContain('totalBills')
      }
    })
  })
})

describe('minifyJson', () => {
  describe('valid JSON', () => {
    it('minifies a pretty-printed object', () => {
      const input = '{\n  "a": 1,\n  "b": 2\n}'
      const result = minifyJson(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBe('{"a":1,"b":2}')
      }
    })

    it('minifies a nested structure', () => {
      const input = JSON.stringify({ user: { name: 'Alice' } }, null, 2)
      const result = minifyJson(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBe('{"user":{"name":"Alice"}}')
      }
    })

    it('minifies an array', () => {
      const result = minifyJson('[ 1 , 2 , 3 ]')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBe('[1,2,3]')
      }
    })

    it('is idempotent on already-minified JSON', () => {
      const input = '{"a":1}'
      const result = minifyJson(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toBe(input)
      }
    })
  })

  describe('invalid JSON', () => {
    it('returns error for empty input', () => {
      const result = minifyJson('')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toMatch(/empty/i)
      }
    })

    it('returns error for invalid JSON', () => {
      const result = minifyJson('{bad json}')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })
  })
})
