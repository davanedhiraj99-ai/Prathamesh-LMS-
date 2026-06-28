import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';
import {
  ensureBatchContentOrderColumn,
  getBatchContentInsertOrder,
  shiftBatchContentOrder
} from '../../utils/content-order.js';

const router = Router();

router.post('/', checkAuth(async (req, res) => {
  const {
    title,
    type,
    batchId,
    url,
    fileSize,
    duration,
    thumbnail,
    placement = 'last',
    positionNumber = null
  } = req.body;

  if (!title || !type || !batchId || !url) {
    return res.status(400).json({ 
      error: 'Missing required fields: title, type, batchId, url' 
    });
  }

  if (!['video', 'note'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "video" or "note"' });
  }

  try {
    await ensureBatchContentOrderColumn();
    const sortOrder = await getBatchContentInsertOrder(batchId, type, placement, positionNumber);
    await shiftBatchContentOrder(batchId, type, sortOrder);

    const initialStatus = type === 'video' ? 'processing' : 'ready';
    const result = await pool.query(
      `INSERT INTO batch_content 
       (title, type, batch_id, sort_order, url, file_size, duration, thumbnail, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        title,
        type,
        batchId,
        sortOrder,
        url,
        fileSize || null,
        duration || null,
        thumbnail || null,
        initialStatus
      ]
    );

    res.status(201).json({
      success: true,
      content: result.rows[0]
    });
  } catch (error) {
    console.error('Upload content error:', error);
    res.status(500).json({ 
      error: 'Failed to save content',
      details: error.message 
    });
  }
}, 'admin'));

export default router;
