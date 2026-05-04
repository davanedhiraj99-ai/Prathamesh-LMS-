import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

// Public listing for marketing/nav dropdown (no auth required)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.id,
        b.uuid,
        b.name,
        b.description,
        b.thumbnail_url,
        b.created_at,
        COUNT(v.id) as video_count
      FROM batches b
      LEFT JOIN batch_content v
        ON b.id = v.batch_id AND v.status = 'ready' AND v.type = 'video'
      WHERE b.is_active = true
      GROUP BY b.id, b.uuid, b.name, b.description, b.thumbnail_url, b.created_at
      ORDER BY b.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch public batches error:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

export default router;

