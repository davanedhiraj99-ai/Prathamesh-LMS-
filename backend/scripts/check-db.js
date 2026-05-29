#!/usr/bin/env node

import dotenv from 'dotenv';
import pool from '../utils/db-client.js';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env (repo root)');
    process.exit(1);
  }

  try {
    const result = await pool.query('SELECT 1 as ok');
    console.log('DB connection OK:', result.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connection FAILED.');
    console.error('Message:', err?.message || err);
    console.error('Hint: If you see ECONNREFUSED 127.0.0.1:5432, your DATABASE_URL is pointing to localhost but Postgres is not running.');
    process.exit(1);
  }
}

main();
