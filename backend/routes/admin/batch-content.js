import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  const { batchId } = req.query;
  
  if (!batchId) {
    return res.status(400).json({ error: 'batchId is required' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM batch_content WHERE batch_id = $1 ORDER BY created_at DESC`,
      [batchId]
    );
    
    const videos = result.rows.filter(item => item.type === 'video');
    const notes = result.rows.filter(item => item.type === 'note');
    
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
    const result = await pool.query('DELETE FROM batch_content WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.status(200).json({ success: true, message: 'Content deleted' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
}, 'admin'));

export default router;