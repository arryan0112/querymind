import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { appPool } from '@/lib/db/app-pool';
import type { Dashboard, DashboardWidget } from '@/types';

const createDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const addWidgetSchema = z.object({
  dashboardId: z.string().uuid(),
  widget: z.object({
    title: z.string(),
    sql: z.string(),
    naturalLanguageQuery: z.string(),
    chartType: z.enum(['bar', 'line', 'pie', 'scatter', 'table', 'grouped_bar', 'area']),
    chartConfig: z.record(z.string(), z.unknown()),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    }),
  }),
});

const updateWidgetSchema = z.object({
  dashboardId: z.string().uuid(),
  widgetId: z.string().uuid(),
  updates: z.record(z.string(), z.unknown()),
});

const removeWidgetSchema = z.object({
  dashboardId: z.string().uuid(),
  widgetId: z.string().uuid(),
});

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

    const result = await appPool.query(`
      SELECT d.id, d.name, d.description, d.created_at, d.updated_at, 
             COALESCE(jsonb_array_length(d.widgets), 0) as widget_count
      FROM dashboards d
      WHERE d.user_id = $1
      ORDER BY d.updated_at DESC
    `, [userId]);

    const dashboards = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      widgetCount: row.widget_count,
    }));

    return NextResponse.json({
      success: true,
      data: { dashboards },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[dashboard/list] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'DASHBOARD_LIST_FAILED' },
      { status: 400 }
    );
  }
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
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'create') {
      const body = await req.json();
      const parseResult = createDashboardSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      const { name, description } = parseResult.data;
      const id = uuidv4();

      await appPool.query(`
        INSERT INTO dashboards (id, user_id, name, description, widgets, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [id, userId, name, description || null, '[]']);

      const dashboard: Dashboard = {
        id,
        name,
        description,
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: { dashboard },
      });
    }

    if (action === 'addWidget') {
      const body = await req.json();
      const parseResult = addWidgetSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      const { dashboardId, widget } = parseResult.data;
      const widgetId = uuidv4();
      const widgetWithId: DashboardWidget = {
        ...widget,
        id: widgetId,
      };

      const result = await appPool.query(`
        UPDATE dashboards 
        SET widgets = widgets || $1::jsonb, updated_at = NOW() 
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `, [JSON.stringify([widgetWithId]), dashboardId, userId]);

      if (result.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Dashboard not found', code: 'DASHBOARD_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { widget: widgetWithId },
      });
    }

    if (action === 'updateWidget') {
      const body = await req.json();
      const parseResult = updateWidgetSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      const { dashboardId, widgetId, updates } = parseResult.data;

      const dashboardResult = await appPool.query(`
        SELECT widgets FROM dashboards WHERE id = $1 AND user_id = $2
      `, [dashboardId, userId]);

      if (dashboardResult.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Dashboard not found', code: 'DASHBOARD_NOT_FOUND' },
          { status: 404 }
        );
      }

      const widgets: DashboardWidget[] = dashboardResult.rows[0].widgets || [];
      const widgetIndex = widgets.findIndex(w => w.id === widgetId);

      if (widgetIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Widget not found', code: 'WIDGET_NOT_FOUND' },
          { status: 404 }
        );
      }

      widgets[widgetIndex] = { ...widgets[widgetIndex], ...updates };

      await appPool.query(`
        UPDATE dashboards SET widgets = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3
      `, [JSON.stringify(widgets), dashboardId, userId]);

      return NextResponse.json({
        success: true,
        data: { widget: widgets[widgetIndex] },
      });
    }

    if (action === 'removeWidget') {
      const body = await req.json();
      const parseResult = removeWidgetSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      const { dashboardId, widgetId } = parseResult.data;

      const dashboardResult = await appPool.query(`
        SELECT widgets FROM dashboards WHERE id = $1 AND user_id = $2
      `, [dashboardId, userId]);

      if (dashboardResult.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Dashboard not found', code: 'DASHBOARD_NOT_FOUND' },
          { status: 404 }
        );
      }

      const widgets: DashboardWidget[] = dashboardResult.rows[0].widgets || [];
      const filteredWidgets = widgets.filter(w => w.id !== widgetId);

      await appPool.query(`
        UPDATE dashboards SET widgets = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3
      `, [JSON.stringify(filteredWidgets), dashboardId, userId]);

      return NextResponse.json({
        success: true,
        data: { removed: true },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action', code: 'INVALID_ACTION' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[dashboard] Error', { error: message });
    return NextResponse.json(
      { success: false, error: message, code: 'DASHBOARD_OPERATION_FAILED' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
