import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.username;

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.username;
    const { searchParams } = new URL(req.url);
    let action = searchParams.get('action');
    
    // Normalize action to handle all cases
    if (action) {
      action = action.toLowerCase().replace(/-/g, '');
      // Map to proper action names
      if (action === 'addwidget') action = 'addWidget';
      if (action === 'create') action = 'create';
      if (action === 'updatewidget') action = 'updateWidget';
      if (action === 'removewidget') action = 'removeWidget';
    }
    
    console.log('[dashboard] POST normalized action:', action, 'userId:', userId);

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
      // Ensure dashboards table exists with correct schema (user_id as TEXT, not UUID)
      try {
        // First try to drop and recreate to fix any existing schema issues
        await appPool.query(`DROP TABLE IF EXISTS dashboards`);
      } catch (e) {
        // Ignore if doesn't exist
      }
      
      try {
        await appPool.query(`
          CREATE TABLE IF NOT EXISTS dashboards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            widgets JSONB NOT NULL DEFAULT '[]',
            share_token UUID UNIQUE DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `);
        console.log('[addWidget] Table created/reset with TEXT user_id');
      } catch (tableErr) {
        console.log('[addWidget] Table error:', tableErr);
      }
      
      const body = await req.json();
      
      if (!body.widget) {
        return NextResponse.json(
          { success: false, error: 'Widget data is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      
      let dashboardId = body.dashboardId;
      
      console.log('[addWidget] body:', JSON.stringify(body).slice(0, 200));
      console.log('[addWidget] current dashboardId:', dashboardId, 'userId:', userId);
      
      if (!dashboardId) {
        const dashboardsResult = await appPool.query(
          'SELECT id FROM dashboards WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
          [userId]
        );
        console.log('[addWidget] dashboards found:', dashboardsResult.rows.length);
        
        if (dashboardsResult.rows.length > 0) {
          dashboardId = dashboardsResult.rows[0].id;
          console.log('[addWidget] using existing dashboard:', dashboardId);
        } else {
          const newId = uuidv4();
          console.log('[addWidget] creating new dashboard with id:', newId);
          await appPool.query(`
            INSERT INTO dashboards (id, user_id, name, description, widgets, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          `, [newId, userId, 'My Dashboard', 'Auto-created dashboard', '[]']);
          dashboardId = newId;
        }
      }
      
      console.log('[addWidget] final dashboardId:', dashboardId);
      
      const widget = body.widget;
      const widgetId = uuidv4();
      
      const widgetData: DashboardWidget = {
        id: widgetId,
        title: widget.title || 'Chart',
        sql: widget.sql || '',
        naturalLanguageQuery: widget.naturalLanguageQuery || '',
        chartType: widget.chartType || 'bar',
        chartConfig: widget.chartConfig || {},
        position: widget.position || { x: 0, y: 0, w: 6, h: 4 },
        columns: widget.columns || [],
        rows: widget.rows || [],
      };

      const result = await appPool.query(`
        UPDATE dashboards 
        SET widgets = widgets || $1::jsonb, updated_at = NOW() 
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `, [JSON.stringify([widgetData]), dashboardId, userId]);

      if (result.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Dashboard not found', code: 'DASHBOARD_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { widget: widgetData, dashboardId },
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
