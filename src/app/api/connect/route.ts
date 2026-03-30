import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { LLMClient } from '@/lib/llm/client';
import { introspectSchema } from '@/lib/schema/introspect';
import { formatSchemaForPrompt } from '@/lib/schema/format-schema';
import { buildSchemaAnalysisPrompt } from '@/lib/llm/prompts';
import { registrySet } from '@/lib/db/connection-registry';
import { demoPool } from '@/lib/db/demo-pool';
import { checkRateLimit } from '@/lib/rate-limiter';
import { CONNECTION_REGISTRY_TTL_MS } from '@/lib/constants';
import type { LLMProvider, SchemaAnalysis, TableSchema } from '@/types';

const { Pool } = pg;

function sanitizeConnectionString(input: string): string {
  const sanitized = input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .trim();
  
  if (sanitized.length !== input.length) {
    throw new Error('Connection string contains invalid characters');
  }
  
  return sanitized;
}

const connectRequestSchema = z.object({
  type: z.enum(['demo', 'custom']),
  connectionString: z.string().optional(),
  name: z.string().max(100, 'Name must be 100 characters or less').optional(),
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
    const parseResult = connectRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

        const { type, connectionString, name } = parseResult.data;

    const rateLimit = checkRateLimit(userId, 'connect');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { 
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateLimit.retryAfterMs || 0) / 1000)) }
        }
      );
    }

    let pool: pg.Pool;

    if (type === 'demo') {
      pool = demoPool;
    } else {
      if (!connectionString) {
        return NextResponse.json(
          { success: false, error: 'Connection string required for custom type', code: 'MISSING_CONNECTION_STRING' },
          { status: 400 }
        );
      }

      const sanitizedConnectionString = sanitizeConnectionString(connectionString);

      if (!sanitizedConnectionString.startsWith('postgresql://') && !sanitizedConnectionString.startsWith('postgres://')) {
        return NextResponse.json(
          { success: false, error: 'Connection string must start with postgresql:// or postgres://', code: 'INVALID_CONNECTION_STRING' },
          { status: 400 }
        );
      }

      pool = new Pool({
        connectionString: sanitizedConnectionString,
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }

    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }

      const tables: TableSchema[] = await introspectSchema(pool);
      const schemaText = formatSchemaForPrompt(tables);

      const llmConfig = getLLMConfigFromHeaders(req.headers);
      const llmClient = new LLMClient(llmConfig);
      const messages = buildSchemaAnalysisPrompt(schemaText);
      const llmResponse = await llmClient.complete(messages);

      const schemaAnalysis: SchemaAnalysis = {
        tables,
        relationships: [],
        summary: llmResponse,
        analyzedAt: new Date().toISOString(),
      };

      const connectionId = uuidv4();

      registrySet(userId, connectionId, {
        pool,
        schemaAnalysis,
        expiresAt: Date.now() + CONNECTION_REGISTRY_TTL_MS,
      });

      console.error('[connect] Connection established', { userId, connectionId, type, name });

      return NextResponse.json({
        success: true,
        data: {
          connectionId,
          schemaAnalysis,
          name: name || (type === 'demo' ? 'Demo Database' : 'Custom Connection'),
        },
      });
    } catch (error) {
      if (type === 'custom') {
        await pool.end();
      }
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[connect] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'CONNECTION_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
