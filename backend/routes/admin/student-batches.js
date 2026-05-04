import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  const { studentId } = req.query;
  const id = Number(studentId);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'studentId is required' });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          sb.student_id,
          sb.batch_id,
          sb.enrolled_at,
          b.name as batch_name
        FROM student_batches sb
        INNER JOIN batches b ON b.id = sb.batch_id
        WHERE sb.student_id = $1
        ORDER BY sb.enrolled_at DESC
      `,
      [id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student batches' });
  }
}, 'admin'));

router.delete('/', checkAuth(async (req, res) => {
  const { studentId, batchId } = req.query;
  const sId = Number(studentId);
  const bId = Number(batchId);

  if (!Number.isInteger(sId) || sId <= 0 || !Number.isInteger(bId) || bId <= 0) {
    return res.status(400).json({ error: 'studentId and batchId are required' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM student_batches WHERE student_id = $1 AND batch_id = $2 RETURNING *',
      [sId, bId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove enrollment' });
  }
}, 'admin'));

export default router;

