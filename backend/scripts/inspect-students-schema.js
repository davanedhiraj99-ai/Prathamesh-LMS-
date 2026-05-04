import 'dotenv/config';
import pool from '../utils/db-client.js';

const result = await pool.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position"
);
console.log(result.rows);
await pool.end();

