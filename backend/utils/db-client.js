import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

function shouldUseSsl(databaseUrl) {
  if (!databaseUrl) return false;

  try {
    const url = new URL(databaseUrl);
    const sslmode = url.searchParams.get('sslmode');
    if (sslmode === 'require' || sslmode === 'verify-full' || sslmode === 'verify-ca') return true;
    if (sslmode === 'disable') return false;

    const hostname = (url.hostname || '').toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  } catch {
    // ignore parse errors; fall back to heuristics below
  }

  return true;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false
});

export default pool;
