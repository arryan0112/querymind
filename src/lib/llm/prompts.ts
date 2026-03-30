import type { ConversationMessage } from '@/types';

export interface SQLGenerationParams {
  schemaText: string;
  userQuestion: string;
  conversationHistory: ConversationMessage[];
  dialect: 'postgresql';
}

export interface ChartAdvisorParams {
  columns: string[];
  sampleRows: Record<string, unknown>[];
  userQuestion: string;
  sqlQuery: string;
}

/**
 * Builds a prompt for analyzing the database schema and producing a summary.
 * @param schemaText - The formatted schema text
 * @returns System and user message pair
 */
export function buildSchemaAnalysisPrompt(schemaText: string): Array<{ role: 'system' | 'user'; content: string }> {
  const systemMessage = `You are a database analyst. Analyze the provided database schema and produce a concise human-readable summary.`;

  const userMessage = `Analyze this database schema and provide a 3-5 sentence summary describing:
1. What the database contains
2. What business domain it serves
3. What kinds of questions can be answered

Schema:
${schemaText}

Respond with plain prose only - no bullet points, no SQL.`;

  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage }
  ];
}

/**
 * Builds a prompt for generating SQL queries from natural language.
 * @param params - SQL generation parameters
 * @returns Array of messages for LLM
 */
export function buildSQLGenerationPrompt(params: SQLGenerationParams): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const today = new Date().toISOString().split('T')[0];
  const recentHistory = params.conversationHistory.slice(-6);

  const systemMessage = `You are a PostgreSQL expert. Generate ONLY valid PostgreSQL SQL queries.

CRITICAL RULES:
- Never use destructive statements (DROP, DELETE, TRUNCATE, UPDATE, INSERT, ALTER, CREATE, GRANT, REVOKE, EXECUTE, COPY)
- Always use table aliases for clarity
- Always LIMIT results to 500 rows unless the user asks for aggregates/counts
- Return ONLY the SQL query, no explanation, no markdown fences, no comments
- Use created_at for all date filtering
- Today's date is: ${today}

The schema:
${params.schemaText}`;

  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemMessage }
  ];

  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant' && msg.sql) {
      messages.push({ role: 'assistant', content: msg.sql });
    }
  }

  messages.push({ role: 'user', content: params.userQuestion });

  return messages;
}

/**
 * Builds a prompt for recommending chart types based on query results.
 * @param params - Chart advisor parameters
 * @returns Prompt string
 */
export function buildChartAdvisorPrompt(params: ChartAdvisorParams): string {
  const columnsStr = params.columns.join(', ');
  const sampleRowsStr = JSON.stringify(params.sampleRows, null, 2);

  return `You are a data visualization expert. Based on the query results, recommend the best chart type.

COLUMNS: ${columnsStr}
SAMPLE ROWS (first 5):
${sampleRowsStr}

USER QUESTION: ${params.userQuestion}
SQL QUERY: ${params.sqlQuery}

Respond with ONLY valid JSON (no markdown fences) matching this exact structure:
{
  "type": "bar" | "line" | "pie" | "scatter" | "table" | "grouped_bar" | "area",
  "xAxis": "column_name" | undefined,
  "yAxis": "column_name" | ["column_name", ...] | undefined,
  "title": "descriptive title",
  "reasoning": "1-2 sentence explanation"
}

CHART TYPE SELECTION LOGIC:
- Time series (date column + numeric) → line or area
- Category + one numeric → bar
- Category + two+ numerics → grouped_bar
- Two numeric columns → scatter
- One category with <= 8 values + one numeric → pie
- Anything else, or large row count → table`;
}
