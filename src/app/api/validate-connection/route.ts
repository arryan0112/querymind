import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import pg from 'pg';

const { Pool } = pg;

const validateConnectionSchema = z.object({
  connectionString: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = validateConnectionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { connectionString } = parseResult.data;

    const pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    try {
      const result = await pool.query('SELECT version()');
      const postgresVersion = result.rows[0].version;

      return NextResponse.json({
        success: true,
        data: { postgresVersion },
      });
    } finally {
      await pool.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[validate-connection] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'VALIDATION_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
