import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { LLMClient } from '@/lib/llm/client';
import { generateSQL } from '@/lib/sql/generate';
import { executeQuery, SqlSafetyError } from '@/lib/sql/execute';
import { getChartRecommendation } from '@/lib/chart/advisor';
import { formatSchemaForPrompt } from '@/lib/schema/format-schema';
import { registryGet } from '@/lib/db/connection-registry';
import type { LLMProvider, ConversationMessage, QueryResult } from '@/types';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000;
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of queryCache.entries()) {
    if (now - entry.timestamp > CACHE_CLEANUP_INTERVAL) {
      queryCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

function getCacheKey(sql: string, connectionId: string): string {
  return `${connectionId}:${sql}`;
}

function getCachedResult(key: string): unknown | null {
  const entry = queryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  queryCache.delete(key);
  return null;
}

function setCachedResult(key: string, data: unknown): void {
  queryCache.set(key, { data, timestamp: Date.now() });
}

const conversationMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  sql: z.string().optional(),
  timestamp: z.string().optional(),
});

const queryRequestSchema = z.object({
  connectionId: z.string().uuid(),
  question: z.string().min(1),
  conversationHistory: z.array(conversationMessageSchema).optional(),
});

function getLLMConfigFromHeaders(headers: Headers): { provider: LLMProvider; apiKey: string; model: string } {
  const apiKey = headers.get('x-llm-key');
  const provider = headers.get('x-llm-provider') as LLMProvider | null;

  if (!apiKey) {
    throw new Error('Missing x-llm-key header');
  }
  if (!provider || !['anthropic', 'openai', 'groq'].includes(provider)) {
    throw new Error('Invalid x-llm-provider header');
  }

  const model = headers.get('x-llm-model') || (
    provider === 'anthropic' ? 'claude-sonnet-4-5' :
    provider === 'openai' ? 'gpt-4o' : 'llama-3.3-70b-versatile'
  );

  return { provider, apiKey, model };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.email;

    const body = await req.json();
    const parseResult = queryRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { connectionId, question, conversationHistory } = parseResult.data;

    const cached = registryGet(userId, connectionId);
    if (!cached) {
      return NextResponse.json(
        { success: false, error: 'Connection not found or expired', code: 'CONNECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const { pool, schemaAnalysis } = cached;
    const schemaText = formatSchemaForPrompt(schemaAnalysis.tables);

    const cacheKey = getCacheKey(question, connectionId);
    const cachedResponse = getCachedResult(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const llmConfig = getLLMConfigFromHeaders(req.headers);
    const llmClient = new LLMClient(llmConfig);

    let sql: string;
    try {
      const historyForLLM = (conversationHistory || []).map((msg) => ({
        id: msg.id || crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
        sql: msg.sql,
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
      sql = await generateSQL({
        llmClient,
        schemaText,
        userQuestion: question,
        conversationHistory: historyForLLM,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[query] SQL generation error', { error: message });
      return NextResponse.json(
        { success: false, error: message, code: 'LLM_ERROR' },
        { status: 502 }
      );
    }

    let queryResult: QueryResult;
    try {
      queryResult = await executeQuery({
        pool,
        sql,
        maxRows: 500,
        timeoutMs: 10000,
      });
    } catch (error) {
      if (error instanceof SqlSafetyError) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'SQL_SAFETY_ERROR' },
          { status: 400 }
        );
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('timeout')) {
        return NextResponse.json(
          { success: false, error: 'Query timed out', code: 'QUERY_TIMEOUT' },
          { status: 504 }
        );
      }
      console.error('[query] Query execution error', { error: message });
      return NextResponse.json(
        { success: false, error: message, code: 'QUERY_FAILED' },
        { status: 400 }
      );
    }

    let chartRecommendation;
    try {
      chartRecommendation = await getChartRecommendation({
        llmClient,
        queryResult,
        userQuestion: question,
        sql,
      });
    } catch (error) {
      console.error('[query] Chart recommendation error', { error: error instanceof Error ? error.message : 'Unknown' });
      chartRecommendation = {
        type: 'table' as const,
        title: 'Query Results',
        reasoning: 'Fallback due to error',
      };
    }

    const note = queryResult.rowCount === 0 
      ? '\n\nNote: The query returned no results.' 
      : '';

    const assistantMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `I ran the following query:\n\`\`\`sql\n${sql}\n\`\`\`\nReturned ${queryResult.rowCount} rows in ${queryResult.executionTimeMs}ms.${note}`,
      sql,
      queryResult,
      chartRecommendation,
      timestamp: new Date().toISOString(),
    };

    const response = {
      success: true,
      data: {
        message: assistantMessage,
      },
    };
    
    setCachedResult(cacheKey, response);
    
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[query] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'QUERY_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
