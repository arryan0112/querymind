import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { appPool } from '@/lib/db/app-pool';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userResult = await appPool.query(
      'SELECT id FROM users WHERE username = $1',
      [session.user.email]
    );

    if (userResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    const result = await appPool.query(`
      SELECT id, name, connection_string, created_at
      FROM saved_connections
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    const connections = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: { connections },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[connections] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'FETCH_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
