import type { LLMClient } from '@/lib/llm/client';
import type { ChartRecommendation, QueryResult } from '@/types';
import { buildChartAdvisorPrompt } from '@/lib/llm/prompts';

export interface GetChartRecommendationParams {
  llmClient: LLMClient;
  queryResult: QueryResult;
  userQuestion: string;
  sql: string;
}

function isDateColumn(values: unknown[]): boolean {
  if (values.length === 0) return false;
  const sample = values[0];
  if (sample instanceof Date) return true;
  if (typeof sample === 'string') {
    const dateMatch = sample.match(/^\d{4}-\d{2}-\d{2}/);
    if (dateMatch) return true;
    const parsed = new Date(sample);
    if (!isNaN(parsed.getTime())) return true;
  }
  return false;
}

function isNumericColumn(values: unknown[]): boolean {
  if (values.length === 0) return false;
  return values.every(v => {
    if (v === null || v === undefined) return true;
    if (typeof v === 'number') return true;
    if (typeof v === 'string') {
      const parsed = parseFloat(v);
      return !isNaN(parsed);
    }
    return false;
  });
}

function getUniqueValues(values: unknown[]): number {
  const unique = new Set(values.map(v => String(v)));
  return unique.size;
}

/**
 * Rule-based chart type inference without LLM.
 * @param columns - Array of column names
 * @param rows - Array of row objects
 * @returns ChartRecommendation based on data patterns
 */
export function inferChartType(
  columns: string[],
  rows: Record<string, unknown>[]
): ChartRecommendation {
  if (columns.length === 0 || rows.length === 0) {
    return {
      type: 'table',
      title: 'Query Results',
      reasoning: 'No data to visualize'
    };
  }

  const dateColumns: string[] = [];
  const numericColumns: string[] = [];
  const categoryColumns: string[] = [];

  for (const col of columns) {
    const values = rows.map(r => r[col]);
    if (isDateColumn(values)) {
      dateColumns.push(col);
    } else if (isNumericColumn(values)) {
      numericColumns.push(col);
    } else {
      categoryColumns.push(col);
    }
  }

  if (dateColumns.length > 0 && numericColumns.length > 0) {
    return {
      type: 'line',
      xAxis: dateColumns[0],
      yAxis: numericColumns[0],
      title: `${numericColumns[0]} over time`,
      reasoning: 'Time series detected (date + numeric columns)'
    };
  }

  if (categoryColumns.length === 1 && numericColumns.length === 1) {
    const uniqueCount = getUniqueValues(rows.map(r => r[categoryColumns[0]]));
    if (uniqueCount <= 8) {
      return {
        type: 'pie',
        xAxis: categoryColumns[0],
        yAxis: numericColumns[0],
        title: `${numericColumns[0]} by ${categoryColumns[0]}`,
        reasoning: 'Category with <= 8 values and one numeric'
      };
    }
    return {
      type: 'bar',
      xAxis: categoryColumns[0],
      yAxis: numericColumns[0],
      title: `${numericColumns[0]} by ${categoryColumns[0]}`,
      reasoning: 'Category + one numeric column'
    };
  }

  if (categoryColumns.length >= 1 && numericColumns.length >= 2) {
    return {
      type: 'grouped_bar',
      xAxis: categoryColumns[0],
      yAxis: numericColumns,
      title: `Comparison of ${numericColumns.join(', ')}`,
      reasoning: 'Category with two or more numeric columns'
    };
  }

  if (numericColumns.length >= 2) {
    return {
      type: 'scatter',
      xAxis: numericColumns[0],
      yAxis: numericColumns[1],
      title: `${numericColumns[1]} vs ${numericColumns[0]}`,
      reasoning: 'Two numeric columns for correlation'
    };
  }

  return {
    type: 'table',
    title: 'Query Results',
    reasoning: 'Default to table for non-standard data patterns'
  };
}

/**
 * Gets chart recommendation using LLM based on query results.
 * @param params - Parameters including LLM client, query result, question, and SQL
 * @returns ChartRecommendation object
 */
export async function getChartRecommendation(
  params: GetChartRecommendationParams
): Promise<ChartRecommendation> {
  const { queryResult, userQuestion, sql } = params;
  const sampleRows = queryResult.rows.slice(0, 5);
  const columns = queryResult.columns;

  try {
    const prompt = buildChartAdvisorPrompt({
      columns,
      sampleRows,
      userQuestion,
      sqlQuery: sql
    });

    const rawResponse = await params.llmClient.complete([
      { role: 'user', content: prompt }
    ]);

    const jsonStr = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonStr) as ChartRecommendation;

    if (
      parsed.type &&
      parsed.title &&
      parsed.reasoning
    ) {
      return {
        type: parsed.type,
        xAxis: parsed.xAxis,
        yAxis: parsed.yAxis,
        title: parsed.title,
        reasoning: parsed.reasoning
      };
    }

    return inferChartType(columns, queryResult.rows);
  } catch {
    return inferChartType(columns, queryResult.rows);
  }
}
