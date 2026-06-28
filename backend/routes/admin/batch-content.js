import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';
import { ensureBatchContentOrderColumn, normalizeBatchContentOrder } from '../../utils/content-order.js';
import {
  deleteRemoteBatchContent,
  isRetryableBunnyStatus,
  queueRemoteBatchContentCleanup,
  syncBatchContentRows
} from '../../utils/bunny-stream.js';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  const { batchId } = req.query;
  
  if (!batchId) {
    return res.status(400).json({ error: 'batchId is required' });
  }

  try {
    await ensureBatchContentOrderColumn();
    await normalizeBatchContentOrder(batchId, 'video');
    await normalizeBatchContentOrder(batchId, 'note');

    const result = await pool.query(
      `SELECT *
       FROM batch_content
       WHERE batch_id = $1
       ORDER BY type ASC, sort_order ASC NULLS LAST, created_at ASC, id ASC`,
      [batchId]
    );

    const syncedRows = await syncBatchContentRows(result.rows);
    const videos = syncedRows.filter(item => item.type === 'video');
    const notes = syncedRows.filter(item => item.type === 'note');
    
    res.status(200).json({ videos, notes });
  } catch (error) {
    console.error('Fetch content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
}, 'admin'));

router.put('/', checkAuth(async (req, res) => {
  const { id } = req.query;
  const { title, description } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Content ID is required' });
  }
  
  if (!title && description === undefined) {
    return res.status(400).json({ error: 'Title or description required' });
  }

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (title) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE batch_content SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.status(200).json({ success: true, content: result.rows[0] });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content', details: error.message });
  }
}, 'admin'));

router.delete('/', checkAuth(async (req, res) => {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Content ID is required' });
  }

  try {
    const existingResult = await pool.query('SELECT * FROM batch_content WHERE id = $1', [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const contentRow = existingResult.rows[0];
    let remoteDeleteWarning = null;

    try {
      await deleteRemoteBatchContent(contentRow);
    } catch (error) {
      if (!isRetryableBunnyStatus(error.statusCode)) {
        throw error;
      }

      await queueRemoteBatchContentCleanup(contentRow, error.message);

      remoteDeleteWarning =
        'Content was removed from the LMS, and Bunny cleanup was queued to retry automatically after the outage.';
    }

    const result = await pool.query('DELETE FROM batch_content WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.status(200).json({
      success: true,
      message: remoteDeleteWarning || 'Content deleted',
      remoteDeleteWarning
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
}, 'admin'));

export default router;
