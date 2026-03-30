import type { TableSchema } from '@/types';

function formatSampleValues(values: unknown[]): string {
  if (values.length === 0) return '';
  const formatted = values.slice(0, 3).map(v => {
    if (v === null) return 'NULL';
    if (typeof v === 'string') return `'${v.slice(0, 20)}'`;
    if (v instanceof Date) return `'${v.toISOString().split('T')[0]}'`;
    return String(v).slice(0, 20);
  });
  return formatted.join(', ') + (values.length > 3 ? ', ...' : '');
}

function formatColumn(
  column: TableSchema['columns'][0],
  sampleValues: Record<string, unknown[]>
): string {
  let line = `  - ${column.columnName}: ${column.dataType}`;
  if (!column.isNullable) {
    line += ', NOT NULL';
  } else {
    line += ', NULL';
  }

  const fk = column.columnName;
  const samples = sampleValues[column.columnName];
  if (samples && samples.length > 0) {
    const sampleStr = formatSampleValues(samples);
    if (sampleStr) {
      line += ` (sample values: ${sampleStr})`;
    }
  }

  return line;
}

/**
 * Formats the database schema into a compact text representation for LLM prompts.
 * @param tables - Array of TableSchema objects
 * @returns Formatted schema string suitable for LLM consumption
 */
export function formatSchemaForPrompt(tables: TableSchema[]): string {
  const MAX_TABLES = 20;
  const MAX_CHARS = 16000;

  let result = '';
  const tablesToProcess = tables.slice(0, MAX_TABLES);

  for (const table of tablesToProcess) {
    const rowCount = table.rowCount.toLocaleString();
    result += `TABLE: ${table.tableName} (${rowCount} rows)\n`;
    result += 'COLUMNS:\n';

    for (const column of table.columns) {
      const fk = table.foreignKeys.find(f => f.columnName === column.columnName);
      let line = formatColumn(column, table.sampleValues);
      
      if (fk) {
        line += ` → FK → ${fk.referencedTable}.${fk.referencedColumn}`;
      }

      result += line + '\n';
    }

    result += '\n';
  }

  if (result.length > MAX_CHARS) {
    result = result.slice(0, MAX_CHARS);
    const lastTableIdx = result.lastIndexOf('\n\nTABLE:');
    if (lastTableIdx > 0) {
      result = result.slice(0, lastTableIdx);
    }
    result += '\n\n... (schema truncated due to size)';
  }

  return result.trim();
}
