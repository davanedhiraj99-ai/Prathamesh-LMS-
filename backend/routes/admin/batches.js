import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM batches ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
}, 'admin'));

router.post('/', checkAuth(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO batches (name, description) VALUES ($1, $2) RETURNING *',
      [String(name).trim(), description ? String(description).trim() : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create batch' });
  }
}, 'admin'));

router.delete('/', checkAuth(async (req, res) => {
  const { id } = req.query;
  const batchId = Number(id);
  if (!Number.isInteger(batchId) || batchId <= 0) {
    return res.status(400).json({ error: 'Batch id is required' });
  }
  try {
    await pool.query('DELETE FROM batches WHERE id = $1', [batchId]);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete batch' });
  }
}, 'admin'));

export default router;
