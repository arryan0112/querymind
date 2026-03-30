import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { appPool } from '@/lib/db/app-pool';
import type { Dashboard } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dashboardId } = await params;
    const { searchParams } = new URL(req.url);
    const shareToken = searchParams.get('share');

    let dashboard: Dashboard | null = null;

    if (shareToken) {
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
      dashboard = {
        id: row.id,
        name: row.name,
        description: row.description,
        widgets: row.widgets || [],
        shareToken: row.share_token,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } else {
      const session = await getServerSession();
      if (!session?.user?.email) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const userId = session.user.email;

      const result = await appPool.query(`
        SELECT id, name, description, widgets, share_token, created_at, updated_at
        FROM dashboards
        WHERE id = $1 AND user_id = $2
      `, [dashboardId, userId]);

      if (result.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Dashboard not found', code: 'DASHBOARD_NOT_FOUND' },
          { status: 404 }
        );
      }

      const row = result.rows[0];
      dashboard = {
        id: row.id,
        name: row.name,
        description: row.description,
        widgets: row.widgets || [],
        shareToken: row.share_token,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    return NextResponse.json({
      success: true,
      data: { dashboard },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[dashboard/[id]] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'DASHBOARD_FETCH_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
