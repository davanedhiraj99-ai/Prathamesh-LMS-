import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';
import { ensureBatchContentOrderColumn, normalizeBatchContentOrder } from '../../utils/content-order.js';
import { syncBatchContentRows } from '../../utils/bunny-stream.js';

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

    await ensureBatchContentOrderColumn();
    await normalizeBatchContentOrder(batchId, 'video');
    await normalizeBatchContentOrder(batchId, 'note');

    const result = await pool.query(
      `SELECT * FROM batch_content 
       WHERE batch_id = $1 
       ORDER BY type ASC, sort_order ASC NULLS LAST, created_at ASC, id ASC`,
      [batchId]
    );

    const syncedRows = await syncBatchContentRows(result.rows);
    const videos = syncedRows.filter(item => item.type === 'video' && item.status === 'ready');
    const notes = syncedRows.filter(item => item.type === 'note');

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
