import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.post('/', checkAuth(async (req, res) => {
  try {
    const { title, batchId, url, fileSize } = req.body;

    if (!title || !batchId || !url) {
      return res.status(400).json({ error: 'Missing required fields: title, batchId, url' });
    }

    const result = await pool.query(
      `INSERT INTO batch_content (title, type, batch_id, url, file_size) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, 'note', batchId, url, fileSize || 0]
    );

    res.status(201).json({
      success: true,
      content: result.rows[0]
    });
  } catch (error) {
    console.error('Note upload error:', error);
    res.status(500).json({ error: 'Failed to save note', details: error.message });
  }
}, 'admin'));

export default router;