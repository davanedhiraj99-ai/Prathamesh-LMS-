import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

function normalizeDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return databaseUrl;
  try {
    const url = new URL(databaseUrl);
    // Force SSL handling via the explicit `ssl` option below.
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

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

const databaseUrl = process.env.DATABASE_URL;
const useSsl = shouldUseSsl(databaseUrl);

const pool = new Pool({
  connectionString: normalizeDatabaseUrl(databaseUrl),
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

export default pool;
