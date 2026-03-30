import { NextRequest, NextResponse } from 'next/server';
import { appPool } from '@/lib/db/app-pool';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shareToken = searchParams.get('shareToken');

    if (!shareToken) {
      return NextResponse.json(
        { success: false, error: 'Missing shareToken', code: 'MISSING_TOKEN' },
        { status: 400 }
      );
    }

    const result = await appPool.query(`
      SELECT id, name, description, widgets, share_token, created_at, updated_at
      FROM dashboards
      WHERE share_token = $1
    `, [shareToken]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Dashboard not found', code: 'DASHBOARD_NOT_FOUND' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        dashboard: {
          id: row.id,
          name: row.name,
          description: row.description,
          widgets: row.widgets || [],
          shareToken: row.share_token,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[dashboard/shared] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'FETCH_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
