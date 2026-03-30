import type { LLMClient } from '@/lib/llm/client';
import type { ConversationMessage } from '@/types';
import { buildSQLGenerationPrompt } from '@/lib/llm/prompts';

export interface GenerateSQLParams {
  llmClient: LLMClient;
  schemaText: string;
  userQuestion: string;
  conversationHistory: ConversationMessage[];
}

/**
 * Generates a SQL query from natural language using the LLM.
 * @param params - Generation parameters including LLM client, schema, question, and history
 * @returns The generated SQL query string
 * @throws Error if generated SQL is not a SELECT statement
 */
export async function generateSQL(params: GenerateSQLParams): Promise<string> {
  const messages = buildSQLGenerationPrompt({
    schemaText: params.schemaText,
    userQuestion: params.userQuestion,
    conversationHistory: params.conversationHistory,
    dialect: 'postgresql'
  });

  const rawResponse = await params.llmClient.complete(messages);

  let sql = rawResponse
    .replace(/^```sql\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  if (!sql.toUpperCase().startsWith('SELECT')) {
    throw new Error(`Generated SQL is not a SELECT statement: ${sql.slice(0, 100)}`);
  }

  return sql;
}
