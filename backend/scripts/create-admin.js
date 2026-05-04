import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../utils/db-client.js';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'Admin';

if (!email || !password) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars.');
  console.error('Example: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="StrongPass123!" node scripts/create-admin.js');
  process.exit(1);
}

const hashedPassword = await bcrypt.hash(String(password), 10);

const existing = await pool.query('SELECT id FROM students WHERE email = $1', [email]);

if (existing.rows.length > 0) {
  await pool.query('UPDATE students SET password = $1, role = $2, name = $3 WHERE id = $4', [
    hashedPassword,
    'admin',
    name,
    existing.rows[0].id
  ]);
  console.log(`Updated admin user: ${email}`);
} else {
  const result = await pool.query(
    'INSERT INTO students (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, hashedPassword, 'admin']
  );
  console.log(`Created admin user: ${email} (id=${result.rows[0].id})`);
}

await pool.end();
