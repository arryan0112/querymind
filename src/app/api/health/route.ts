import { NextResponse } from 'next/server';
import { appPool } from '@/lib/db/app-pool';
import { demoPool } from '@/lib/db/demo-pool';

export async function GET() {
  let appDbStatus: 'ok' | 'error' = 'ok';
  let demoDbStatus: 'ok' | 'error' = 'ok';

  try {
    await appPool.query('SELECT 1');
  } catch {
    appDbStatus = 'error';
  }

  try {
    await demoPool.query('SELECT 1');
  } catch {
    demoDbStatus = 'error';
  }

  const status = appDbStatus === 'ok' && demoDbStatus === 'ok' ? 'ok' : 'degraded';

  return NextResponse.json({
    status,
    services: {
      appDb: appDbStatus,
      demoDb: demoDbStatus,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
