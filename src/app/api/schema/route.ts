import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { registryGet } from '@/lib/db/connection-registry';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Missing connectionId query parameter', code: 'MISSING_CONNECTION_ID' },
        { status: 400 }
      );
    }

    const cached = registryGet(userId, connectionId);
    if (!cached) {
      return NextResponse.json(
        { success: false, error: 'Connection not found or expired', code: 'CONNECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        schemaAnalysis: cached.schemaAnalysis,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[schema] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'SCHEMA_FETCH_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
