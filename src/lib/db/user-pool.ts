import pg, { Pool } from 'pg';

const poolCache = new Map<string, Pool>();

/**
 * Get or create a connection pool for a user's custom database connection.
 * Pools are cached by connection string to avoid creating too many connections.
 * 
 * @param connectionString - The PostgreSQL connection string
 * @returns A pg Pool instance
 */
export function getUserPool(connectionString: string): Pool {
  if (poolCache.has(connectionString)) {
    return poolCache.get(connectionString)!;
  }

  const pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
  });

  pool.on('connect', () => {
    console.log('User database pool: new client connected');
  });

  poolCache.set(connectionString, pool);
  return pool;
}
