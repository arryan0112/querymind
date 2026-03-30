import pg from 'pg';
import type { QueryResult } from '@/types';

const { Pool } = pg;

const FORBIDDEN_KEYWORDS = /\b(DROP|DELETE|TRUNCATE|UPDATE|INSERT|ALTER|CREATE|GRANT|REVOKE|EXECUTE|COPY)\b/i;
const MULTIPLE_STATEMENTS = /;(?!\s*$)/;
const AGGREGATE_KEYWORDS = /\b(COUNT|SUM|AVG|MIN|MAX|GROUP BY|ORDER BY|HAVING)\b/i;

export class SqlSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SqlSafetyError';
  }
}

function stripComments(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

function containsForbiddenKeywords(sql: string): boolean {
  return FORBIDDEN_KEYWORDS.test(sql);
}

function hasMultipleStatements(sql: string): boolean {
  return MULTIPLE_STATEMENTS.test(sql);
}

function isAggregateQuery(sql: string): boolean {
  return AGGREGATE_KEYWORDS.test(sql);
}

function hasLimit(sql: string): boolean {
  return /\bLIMIT\b/i.test(sql);
}

/**
 * Safely executes a SQL query with safety checks and timeout.
 * @param params - Execution parameters including pool, SQL, maxRows, and timeout
 * @returns Query result with columns, rows, rowCount, executionTimeMs, and sql
 * @throws SqlSafetyError if the SQL fails safety checks
 */
export async function executeQuery(params: {
  pool: pg.Pool;
  sql: string;
  maxRows?: number;
  timeoutMs?: number;
}): Promise<QueryResult> {
  const cleanedSql = stripComments(params.sql);

  if (containsForbiddenKeywords(cleanedSql)) {
    throw new SqlSafetyError('SQL contains forbidden keywords (DROP, DELETE, TRUNCATE, UPDATE, INSERT, ALTER, CREATE, GRANT, REVOKE, EXECUTE, COPY)');
  }

  if (hasMultipleStatements(cleanedSql)) {
    throw new SqlSafetyError('SQL contains multiple statements');
  }

  const client = await params.pool.connect();
  try {
    const timeoutMs = params.timeoutMs ?? 10000;
    await client.query(`SET statement_timeout = ${timeoutMs}`);

    let finalSql = cleanedSql;
    const maxRows = params.maxRows ?? 500;

    if (!hasLimit(cleanedSql) && !isAggregateQuery(cleanedSql)) {
      finalSql = `SELECT * FROM (${cleanedSql}) AS __qm_result LIMIT ${maxRows}`;
    }

    const startTime = Date.now();
    const result = await client.query(finalSql);
    const executionTimeMs = Date.now() - startTime;

    const columns = result.fields.map(field => field.name);
    const rows = result.rows;
    const rowCount = result.rowCount ?? rows.length;

    return {
      columns,
      rows,
      rowCount,
      executionTimeMs,
      sql: params.sql
    };
  } finally {
    await client.query('SET statement_timeout = 0');
    client.release();
  }
}
