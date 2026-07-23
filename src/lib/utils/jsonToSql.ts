export type SqlDialect = 'mssql' | 'mysql' | 'oracle' | 'postgres'
export type OutputMode = 'insert-only' | 'create-and-insert' | 'create-only'

type SimpleValueType = 'integer' | 'float' | 'boolean' | 'string' | 'json' | 'null'
type ColumnInferredType = SimpleValueType | 'mixed'

function inferValueType(value: unknown): SimpleValueType {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'object') return 'json' // both arrays and plain objects
  return 'string'
}

function getSqlColumnType(type: ColumnInferredType, dialect: SqlDialect, maxStrLen: number): string {
  switch (type) {
    case 'integer': {
      const map: Record<SqlDialect, string> = {
        mysql: 'INT',
        postgres: 'INTEGER',
        oracle: 'NUMBER(10,0)',
        mssql: 'INT',
      }
      return map[dialect]
    }
    case 'float': {
      const map: Record<SqlDialect, string> = {
        mysql: 'DOUBLE',
        postgres: 'DOUBLE PRECISION',
        oracle: 'NUMBER',
        mssql: 'FLOAT',
      }
      return map[dialect]
    }
    case 'boolean': {
      const map: Record<SqlDialect, string> = {
        mysql: 'TINYINT(1)',
        postgres: 'BOOLEAN',
        oracle: 'NUMBER(1,0)',
        mssql: 'BIT',
      }
      return map[dialect]
    }
    case 'json': {
      const map: Record<SqlDialect, string> = {
        mysql: 'JSON',
        postgres: 'JSONB',
        oracle: 'CLOB',
        mssql: 'NVARCHAR(MAX)',
      }
      return map[dialect]
    }
    case 'string':
    case 'mixed':
    case 'null': {
      if (maxStrLen > 255) {
        const map: Record<SqlDialect, string> = {
          mysql: 'TEXT',
          postgres: 'TEXT',
          oracle: 'CLOB',
          mssql: 'NVARCHAR(MAX)',
        }
        return map[dialect]
      }
      const map: Record<SqlDialect, string> = {
        mysql: 'VARCHAR(255)',
        postgres: 'VARCHAR(255)',
        oracle: 'VARCHAR2(255)',
        mssql: 'NVARCHAR(255)',
      }
      return map[dialect]
    }
  }
}

function quoteIdentifier(name: string, dialect: SqlDialect): string {
  switch (dialect) {
    case 'mysql': return `\`${name}\``
    case 'postgres': return `"${name}"`
    case 'oracle': return `"${name}"`
    case 'mssql': return `[${name}]`
  }
}

function formatLiteral(value: unknown, dialect: SqlDialect): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') {
    if (dialect === 'mysql' || dialect === 'postgres') return value ? 'TRUE' : 'FALSE'
    return value ? '1' : '0'
  }
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
  // object or array — serialize to JSON string
  const serialized = JSON.stringify(value)
  return `'${serialized.replace(/'/g, "''")}'`
}

function extractColumns(rows: Record<string, unknown>[]): string[] {
  return Object.keys(rows[0] ?? {})
}

function analyzeColumns(
  rows: Record<string, unknown>[],
  columns: string[],
): { types: Record<string, ColumnInferredType>; maxStrLens: Record<string, number> } {
  const types: Record<string, ColumnInferredType> = {}
  const maxStrLens: Record<string, number> = {}

  for (const col of columns) {
    types[col] = 'null'
    maxStrLens[col] = 0
  }

  for (const row of rows) {
    for (const col of columns) {
      const val = row[col]
      const vtype = inferValueType(val)
      if (vtype === 'null') continue

      if (typeof val === 'string') {
        maxStrLens[col] = Math.max(maxStrLens[col] ?? 0, val.length)
      }

      const current = types[col]!
      if (current === 'null') {
        types[col] = vtype
      } else if (current !== vtype) {
        types[col] = 'mixed'
      }
    }
  }

  return { types, maxStrLens }
}

function generateCreateTable(
  rows: Record<string, unknown>[],
  tableName: string,
  dialect: SqlDialect,
): string {
  const columns = extractColumns(rows)
  const { types, maxStrLens } = analyzeColumns(rows, columns)

  const quotedTable = quoteIdentifier(tableName, dialect)
  const colDefs = columns.map((col) => {
    const quotedCol = quoteIdentifier(col, dialect)
    const sqlType = getSqlColumnType(types[col] ?? 'null', dialect, maxStrLens[col] ?? 0)
    return `  ${quotedCol} ${sqlType}`
  })

  return `CREATE TABLE ${quotedTable} (\n${colDefs.join(',\n')}\n);`
}

function generateInserts(
  rows: Record<string, unknown>[],
  tableName: string,
  dialect: SqlDialect,
  batchSize: number,
): string {
  const columns = extractColumns(rows)
  const quotedTable = quoteIdentifier(tableName, dialect)
  const colList = columns.map((col) => quoteIdentifier(col, dialect)).join(', ')

  const statements: string[] = []

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)

    if (dialect === 'oracle' && batchSize > 1 && batch.length > 1) {
      // Oracle batch: INSERT ALL INTO ... SELECT * FROM dual
      const lines = batch.map((row) => {
        const vals = columns.map((col) => formatLiteral(row[col], dialect)).join(', ')
        return `  INTO ${quotedTable} (${colList}) VALUES (${vals})`
      })
      statements.push(`INSERT ALL\n${lines.join('\n')}\nSELECT * FROM dual;`)
    } else if (batchSize > 1 && batch.length > 1) {
      // Standard multi-row INSERT VALUES
      const rowValues = batch.map((row) => {
        const vals = columns.map((col) => formatLiteral(row[col], dialect)).join(', ')
        return `  (${vals})`
      })
      statements.push(`INSERT INTO ${quotedTable} (${colList}) VALUES\n${rowValues.join(',\n')};`)
    } else {
      // Single-row INSERT (default, or batchSize=1, or last odd batch)
      const row = batch[0]!
      const vals = columns.map((col) => formatLiteral(row[col], dialect)).join(', ')
      statements.push(`INSERT INTO ${quotedTable} (${colList}) VALUES (${vals});`)
    }
  }

  return statements.join('\n')
}

export function convertJsonToSql(input: {
  json: unknown
  tableName: string
  dialect: SqlDialect
  outputMode: OutputMode
  batchSize?: number
}): { success: true; sql: string } | { success: false; error: string } {
  const { json, tableName, dialect, outputMode, batchSize: rawBatchSize } = input
  const batchSize = rawBatchSize !== undefined && rawBatchSize > 1 ? rawBatchSize : 1

  let rows: Record<string, unknown>[]

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return { success: false, error: 'Input array is empty. Provide at least one row.' }
    }
    for (let i = 0; i < json.length; i++) {
      const item = json[i]
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return {
          success: false,
          error: `Array element at index ${i} must be a plain object, not ${Array.isArray(item) ? 'an array' : String(typeof item)}.`,
        }
      }
    }
    rows = json as Record<string, unknown>[]
  } else if (typeof json === 'object' && json !== null) {
    rows = [json as Record<string, unknown>]
  } else {
    return { success: false, error: 'Input must be a JSON object or an array of objects.' }
  }

  const parts: string[] = []

  if (outputMode === 'create-only' || outputMode === 'create-and-insert') {
    parts.push(generateCreateTable(rows, tableName, dialect))
  }

  if (outputMode === 'insert-only' || outputMode === 'create-and-insert') {
    parts.push(generateInserts(rows, tableName, dialect, batchSize))
  }

  return { success: true, sql: parts.join('\n\n') }
}
