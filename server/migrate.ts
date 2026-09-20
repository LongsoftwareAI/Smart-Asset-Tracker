import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { closePool, getPool } from './db.js';

const migrationName = '001_initial_schema';

async function migrate() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const existing = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [migrationName]);
  if (existing.rowCount) {
    console.log(`Migration ${migrationName} already applied.`);
    return;
  }

  const schema = await readFile(resolve(process.cwd(), 'database/schema.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migrationName]);
    await client.query('COMMIT');
    console.log(`Applied migration ${migrationName}.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .catch((error: unknown) => {
    console.error('Migration failed.', error);
    process.exitCode = 1;
  })
  .finally(closePool);
