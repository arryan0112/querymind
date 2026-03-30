import type pg from 'pg';
import type { TableSchema, ColumnInfo, ForeignKey } from '@/types';

interface TableRow {
  table_name: string;
}

interface ColumnRow {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface ForeignKeyRow {
  column_name: string;
  referenced_table: string;
  referenced_column: string;
}

interface RowCountRow {
  row_count: number;
}

/**
 * Introspects all user tables in the public schema and returns detailed schema information.
 * @param pool - PostgreSQL pool connection
 * @returns Promise resolving to array of TableSchema objects
 */
export async function introspectSchema(pool: pg.Pool): Promise<TableSchema[]> {
  const tablesResult = await pool.query<TableRow>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );

  const tableNames = tablesResult.rows.map(row => row.table_name);

  const schemaPromises = tableNames.map(async (tableName): Promise<TableSchema> => {
    const [columnsResult, foreignKeysResult, rowCountResult] = await Promise.all([
      pool.query<ColumnRow>(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [tableName]
      ),
      pool.query<ForeignKeyRow>(
        `SELECT kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
         FROM information_schema.key_column_usage kcu
         JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
         WHERE kcu.table_schema = 'public' AND kcu.table_name = $1`,
        [tableName]
      ),
      pool.query<RowCountRow>(
        `SELECT reltuples::BIGINT AS row_count FROM pg_class
         WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
        [tableName]
      )
    ]);

    const columns: ColumnInfo[] = columnsResult.rows.map(col => ({
      columnName: col.column_name,
      dataType: col.data_type,
      isNullable: col.is_nullable === 'YES',
      columnDefault: col.column_default
    }));

    const foreignKeys: ForeignKey[] = foreignKeysResult.rows.map(fk => ({
      columnName: fk.column_name,
      referencedTable: fk.referenced_table,
      referencedColumn: fk.referenced_column
    }));

    const rowCount = rowCountResult.rows[0]?.row_count ?? 0;

    const sampleValues: Record<string, unknown[]> = {};

    for (const col of columns) {
      const quotedCol = `"${col.columnName}"`;
      const quotedTable = `"${tableName}"`;
      try {
        const sampleResult = await pool.query(
          `SELECT DISTINCT ${quotedCol} FROM ${quotedTable} LIMIT 5`,
          []
        );
        sampleValues[col.columnName] = sampleResult.rows.map(row => row[col.columnName]);
      } catch {
        sampleValues[col.columnName] = [];
      }
    }

    return {
      tableName,
      columns,
      foreignKeys,
      sampleValues,
      rowCount
    };
  });

  return Promise.all(schemaPromises);
}
