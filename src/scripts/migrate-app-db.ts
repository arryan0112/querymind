import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

async function migrate() {
  const appDatabaseUrl = process.env.APP_DATABASE_URL;
  
  if (!appDatabaseUrl) {
    throw new Error('APP_DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString: appDatabaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('connect', () => {
    console.log('Connected to app database');
  });

  try {
    console.log('Running migrations...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created users table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        widgets JSONB NOT NULL DEFAULT '[]',
        share_token UUID UNIQUE DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created dashboards table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        connection_string TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created saved_connections table');

    const demoPasswordHash = bcrypt.hashSync('demo1234', 10);
    await pool.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING;`,
      ['demo', demoPasswordHash]
    );
    console.log('Inserted demo user');

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
