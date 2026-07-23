import { convertJsonToSql } from './jsonToSql'

// ── Identifier quoting by dialect ─────────────────────────────────────────────

describe('identifier quoting by dialect', () => {
  const base = { json: { id: 1 }, tableName: 'users', outputMode: 'insert-only' as const }

  it('mysql: uses backticks for table and column names', () => {
    const r = convertJsonToSql({ ...base, dialect: 'mysql' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('`users`')
    expect(r.sql).toContain('`id`')
  })

  it('postgres: uses double quotes for table and column names', () => {
    const r = convertJsonToSql({ ...base, dialect: 'postgres' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('"users"')
    expect(r.sql).toContain('"id"')
  })

  it('oracle: uses double quotes for table and column names', () => {
    const r = convertJsonToSql({ ...base, dialect: 'oracle' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('"users"')
    expect(r.sql).toContain('"id"')
  })

  it('mssql: uses brackets for table and column names', () => {
    const r = convertJsonToSql({ ...base, dialect: 'mssql' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('[users]')
    expect(r.sql).toContain('[id]')
  })
})

// ── Basic INSERT generation ───────────────────────────────────────────────────

describe('basic INSERT generation', () => {
  const row = { id: 1, name: 'Alice', active: true }

  it('mysql: produces a valid INSERT with TRUE for boolean', () => {
    const r = convertJsonToSql({ json: row, tableName: 'users', dialect: 'mysql', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toMatch(/INSERT INTO `users`/)
    expect(r.sql).toContain("'Alice'")
    expect(r.sql).toContain('TRUE')
  })

  it('postgres: produces a valid INSERT with TRUE for boolean', () => {
    const r = convertJsonToSql({ json: row, tableName: 'users', dialect: 'postgres', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toMatch(/INSERT INTO "users"/)
    expect(r.sql).toContain('TRUE')
  })

  it('oracle: produces a valid INSERT with 1 for boolean', () => {
    const r = convertJsonToSql({ json: row, tableName: 'users', dialect: 'oracle', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toMatch(/INSERT INTO "users"/)
    expect(r.sql).not.toContain('TRUE')
  })

  it('mssql: produces a valid INSERT with 1 for boolean', () => {
    const r = convertJsonToSql({ json: row, tableName: 'users', dialect: 'mssql', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toMatch(/INSERT INTO \[users\]/)
    expect(r.sql).not.toContain('TRUE')
  })
})

// ── NULL value formatting ─────────────────────────────────────────────────────

describe('NULL value formatting', () => {
  it('formats null as NULL keyword in all dialects', () => {
    const row = { id: 1, note: null }
    for (const dialect of ['mysql', 'postgres', 'oracle', 'mssql'] as const) {
      const r = convertJsonToSql({ json: row, tableName: 'items', dialect, outputMode: 'insert-only' })
      expect(r.success).toBe(true)
      if (!r.success) return
      expect(r.sql).toContain('NULL')
    }
  })
})

// ── String escaping ───────────────────────────────────────────────────────────

describe('string escaping', () => {
  it("escapes single quotes by doubling them", () => {
    const row = { name: "it's here" }
    const r = convertJsonToSql({ json: row, tableName: 't', dialect: 'mysql', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain("'it''s here'")
  })

  it('escapes single quotes in JSON-serialized nested values', () => {
    const row = { meta: { note: "don't" } }
    const r = convertJsonToSql({ json: row, tableName: 't', dialect: 'postgres', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    // The apostrophe in the JSON string will be in the serialized JSON
    expect(r.sql).toContain("''")
  })
})

// ── Boolean formatting ────────────────────────────────────────────────────────

describe('boolean formatting', () => {
  it('mysql: true → TRUE, false → FALSE', () => {
    const r1 = convertJsonToSql({ json: { f: true }, tableName: 't', dialect: 'mysql', outputMode: 'insert-only' })
    expect(r1.success).toBe(true)
    if (!r1.success) return
    expect(r1.sql).toContain('TRUE')

    const r2 = convertJsonToSql({ json: { f: false }, tableName: 't', dialect: 'mysql', outputMode: 'insert-only' })
    expect(r2.success).toBe(true)
    if (!r2.success) return
    expect(r2.sql).toContain('FALSE')
  })

  it('postgres: true → TRUE, false → FALSE', () => {
    const r = convertJsonToSql({ json: { f: false }, tableName: 't', dialect: 'postgres', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('FALSE')
  })

  it('oracle: true → 1, false → 0 (no native boolean)', () => {
    const r1 = convertJsonToSql({ json: { f: true }, tableName: 't', dialect: 'oracle', outputMode: 'insert-only' })
    expect(r1.success).toBe(true)
    if (!r1.success) return
    expect(r1.sql).not.toContain('TRUE')

    const r2 = convertJsonToSql({ json: { f: false }, tableName: 't', dialect: 'oracle', outputMode: 'insert-only' })
    expect(r2.success).toBe(true)
    if (!r2.success) return
    expect(r2.sql).not.toContain('FALSE')
  })

  it('mssql: true → 1, false → 0 (BIT type)', () => {
    const r = convertJsonToSql({ json: { f: false }, tableName: 't', dialect: 'mssql', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).not.toContain('FALSE')
  })
})

// ── Nested JSON values ────────────────────────────────────────────────────────

describe('nested JSON values in INSERT', () => {
  it('serializes nested object as a JSON string literal', () => {
    const row = { id: 1, meta: { key: 'value' } }
    const r = convertJsonToSql({ json: row, tableName: 't', dialect: 'postgres', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('"key"')
    expect(r.sql).toContain('"value"')
  })

  it('serializes nested array as a JSON string literal', () => {
    const row = { id: 1, tags: ['a', 'b', 'c'] }
    const r = convertJsonToSql({ json: row, tableName: 't', dialect: 'mysql', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('"a"')
    expect(r.sql).toContain('"b"')
  })
})

// ── Single object auto-array ──────────────────────────────────────────────────

describe('single object treated as 1-row array', () => {
  it('a single object generates exactly one INSERT row', () => {
    const r = convertJsonToSql({ json: { x: 42 }, tableName: 'nums', dialect: 'postgres', outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('INSERT INTO')
    expect(r.sql).toContain('42')
  })
})

// ── Batch INSERT ──────────────────────────────────────────────────────────────

describe('batch INSERT', () => {
  const rows = [
    { id: 1, val: 'a' },
    { id: 2, val: 'b' },
    { id: 3, val: 'c' },
  ]

  it('mysql: batchSize > rows → single INSERT with multiple value rows', () => {
    const r = convertJsonToSql({ json: rows, tableName: 't', dialect: 'mysql', outputMode: 'insert-only', batchSize: 10 })
    expect(r.success).toBe(true)
    if (!r.success) return
    const insertCount = (r.sql.match(/INSERT INTO/g) ?? []).length
    expect(insertCount).toBe(1)
    expect(r.sql).toContain("'a'")
    expect(r.sql).toContain("'b'")
    expect(r.sql).toContain("'c'")
  })

  it('postgres: batchSize > rows → single INSERT statement', () => {
    const r = convertJsonToSql({ json: rows, tableName: 't', dialect: 'postgres', outputMode: 'insert-only', batchSize: 10 })
    expect(r.success).toBe(true)
    if (!r.success) return
    const insertCount = (r.sql.match(/INSERT INTO/g) ?? []).length
    expect(insertCount).toBe(1)
  })

  it('mssql: batchSize > rows → single INSERT statement', () => {
    const r = convertJsonToSql({ json: rows, tableName: 't', dialect: 'mssql', outputMode: 'insert-only', batchSize: 10 })
    expect(r.success).toBe(true)
    if (!r.success) return
    const insertCount = (r.sql.match(/INSERT INTO/g) ?? []).length
    expect(insertCount).toBe(1)
  })

  it('oracle: uses INSERT ALL ... SELECT * FROM dual for multiple rows', () => {
    const r = convertJsonToSql({ json: rows, tableName: 't', dialect: 'oracle', outputMode: 'insert-only', batchSize: 10 })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('INSERT ALL')
    expect(r.sql).toContain('SELECT * FROM dual')
    // Each INTO line
    expect((r.sql.match(/INTO "t"/g) ?? []).length).toBe(3)
  })

  it('splits into multiple INSERT statements when batchSize < rows.length', () => {
    const r = convertJsonToSql({ json: rows, tableName: 't', dialect: 'postgres', outputMode: 'insert-only', batchSize: 2 })
    expect(r.success).toBe(true)
    if (!r.success) return
    // 3 rows, batchSize 2 → batch[0,1] + batch[2] → 2 INSERT statements
    const insertCount = (r.sql.match(/INSERT INTO/g) ?? []).length
    expect(insertCount).toBe(2)
  })

  it('oracle: single-row oracle still uses regular INSERT (not INSERT ALL)', () => {
    const r = convertJsonToSql({ json: { id: 1 }, tableName: 't', dialect: 'oracle', outputMode: 'insert-only', batchSize: 10 })
    expect(r.success).toBe(true)
    if (!r.success) return
    // Single row → regular INSERT even with batchSize > 1
    expect(r.sql).not.toContain('INSERT ALL')
    expect(r.sql).toContain('INSERT INTO')
  })
})

// ── CREATE TABLE ──────────────────────────────────────────────────────────────

describe('CREATE TABLE generation', () => {
  it('create-only mode: has CREATE TABLE but no INSERT', () => {
    const r = convertJsonToSql({ json: { id: 1, name: 'Alice' }, tableName: 'users', dialect: 'postgres', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('CREATE TABLE')
    expect(r.sql).not.toContain('INSERT')
  })

  it('postgres: INTEGER for integer column', () => {
    const r = convertJsonToSql({ json: { count: 5 }, tableName: 't', dialect: 'postgres', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('INTEGER')
  })

  it('oracle: NUMBER(10,0) for integer column', () => {
    const r = convertJsonToSql({ json: { count: 5 }, tableName: 't', dialect: 'oracle', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('NUMBER(10,0)')
  })

  it('postgres: DOUBLE PRECISION for float column', () => {
    const r = convertJsonToSql({ json: { price: 9.99 }, tableName: 't', dialect: 'postgres', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('DOUBLE PRECISION')
  })

  it('mysql: TINYINT(1) for boolean column', () => {
    const r = convertJsonToSql({ json: { active: true }, tableName: 't', dialect: 'mysql', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('TINYINT(1)')
  })

  it('postgres: BOOLEAN for boolean column', () => {
    const r = convertJsonToSql({ json: { active: true }, tableName: 't', dialect: 'postgres', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('BOOLEAN')
  })

  it('mssql: BIT for boolean column', () => {
    const r = convertJsonToSql({ json: { active: true }, tableName: 't', dialect: 'mssql', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('BIT')
  })

  it('postgres: JSONB for nested object column', () => {
    const r = convertJsonToSql({ json: { meta: { k: 'v' } }, tableName: 't', dialect: 'postgres', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('JSONB')
  })

  it('mysql: JSON for nested object column', () => {
    const r = convertJsonToSql({ json: { meta: { k: 'v' } }, tableName: 't', dialect: 'mysql', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain(' JSON')
  })

  it('oracle: CLOB for nested object column', () => {
    const r = convertJsonToSql({ json: { meta: { k: 'v' } }, tableName: 't', dialect: 'oracle', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('CLOB')
  })

  it('mssql: NVARCHAR(MAX) for nested object column', () => {
    const r = convertJsonToSql({ json: { meta: { k: 'v' } }, tableName: 't', dialect: 'mssql', outputMode: 'create-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('NVARCHAR(MAX)')
  })
})

// ── Output modes ──────────────────────────────────────────────────────────────

describe('output modes', () => {
  const base = { json: { id: 1 }, tableName: 't', dialect: 'mysql' as const }

  it('insert-only: has INSERT but no CREATE TABLE', () => {
    const r = convertJsonToSql({ ...base, outputMode: 'insert-only' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('INSERT')
    expect(r.sql).not.toContain('CREATE TABLE')
  })

  it('create-and-insert: has both CREATE TABLE and INSERT', () => {
    const r = convertJsonToSql({ ...base, outputMode: 'create-and-insert' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.sql).toContain('CREATE TABLE')
    expect(r.sql).toContain('INSERT')
  })
})

// ── Error cases ───────────────────────────────────────────────────────────────

describe('error cases', () => {
  it('fails for empty array input', () => {
    const r = convertJsonToSql({ json: [], tableName: 't', dialect: 'mysql', outputMode: 'insert-only' })
    expect(r.success).toBe(false)
  })

  it('fails for string input', () => {
    const r = convertJsonToSql({ json: 'not an object', tableName: 't', dialect: 'mysql', outputMode: 'insert-only' })
    expect(r.success).toBe(false)
  })

  it('fails for number input', () => {
    const r = convertJsonToSql({ json: 42, tableName: 't', dialect: 'postgres', outputMode: 'insert-only' })
    expect(r.success).toBe(false)
  })

  it('fails for null input', () => {
    const r = convertJsonToSql({ json: null, tableName: 't', dialect: 'oracle', outputMode: 'insert-only' })
    expect(r.success).toBe(false)
  })

  it('fails for array containing non-object elements', () => {
    const r = convertJsonToSql({ json: [1, 2, 3], tableName: 't', dialect: 'mysql', outputMode: 'insert-only' })
    expect(r.success).toBe(false)
  })

  it('fails for array containing nested arrays as top-level elements', () => {
    const r = convertJsonToSql({ json: [[1, 2], [3, 4]], tableName: 't', dialect: 'mssql', outputMode: 'insert-only' })
    expect(r.success).toBe(false)
  })
})
