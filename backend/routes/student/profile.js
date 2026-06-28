import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM students WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}));

router.put('/', checkAuth(async (req, res) => {
  const { name } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE students SET name = $1 WHERE id = $2 RETURNING id, name, email, role',
      [String(name).trim(), req.user.id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
}));

export default router;
