import pg from 'pg';

const { Pool } = pg;

const demoDatabaseUrl = process.env.DEMO_DATABASE_URL;

if (!demoDatabaseUrl) {
  throw new Error('DEMO_DATABASE_URL environment variable is not set');
}

/**
 * Singleton pool for the demo database (ecommerce data, read-only by convention)
 */
export const demoPool = new Pool({
  connectionString: demoDatabaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

demoPool.on('connect', () => {
  console.log('Demo database pool: new client connected');
});
