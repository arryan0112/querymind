import pg from 'pg';

const { Pool } = pg;

const appDatabaseUrl = process.env.APP_DATABASE_URL;

if (!appDatabaseUrl) {
  throw new Error('APP_DATABASE_URL environment variable is not set');
}

/**
 * Singleton pool for the app database (users, dashboards, sessions)
 */
export const appPool = new Pool({
  connectionString: appDatabaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

appPool.on('connect', () => {
  console.log('App database pool: new client connected');
});
