import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { appPool } from '@/lib/db/app-pool';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.username;
    const { id: dashboardId } = await params;

    const result = await appPool.query(`
      UPDATE dashboards 
      SET share_token = $1, updated_at = NOW() 
      WHERE id = $2 AND user_id = $3
      RETURNING share_token
    `, [uuidv4(), dashboardId, userId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Dashboard not found', code: 'DASHBOARD_NOT_FOUND' },
        { status: 404 }
      );
    }

    const shareToken = result.rows[0].share_token;
    const shareUrl = `/dashboard/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      data: { shareToken, shareUrl },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[dashboard/share] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'SHARE_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
