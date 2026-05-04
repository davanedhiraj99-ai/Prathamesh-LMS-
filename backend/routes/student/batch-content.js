import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  const { batchId } = req.query;
  const studentId = req.user.id;

  if (!batchId) {
    return res.status(400).json({ error: 'batchId is required' });
  }

  try {
    const enrollmentCheck = await pool.query(
      'SELECT * FROM student_batches WHERE student_id = $1 AND batch_id = $2 AND is_active = true',
      [studentId, batchId]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this batch' });
    }

    const result = await pool.query(
      `SELECT * FROM batch_content 
       WHERE batch_id = $1 
       ORDER BY created_at DESC`,
      [batchId]
    );

    const videos = result.rows.filter(item => item.type === 'video');
    const notes = result.rows.filter(item => item.type === 'note');

    res.status(200).json({
      success: true,
      videos,
      notes
    });
  } catch (error) {
    console.error('Fetch batch content error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch content',
      details: error.message 
    });
  }
}));

export default router;