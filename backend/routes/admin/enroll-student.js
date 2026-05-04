import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.post('/', checkAuth(async (req, res) => {
  const { studentId, batchId } = req.body;
  const sId = Number(studentId);
  const bId = Number(batchId);

  if (!Number.isInteger(sId) || sId <= 0 || !Number.isInteger(bId) || bId <= 0) {
    return res.status(400).json({ error: 'studentId and batchId are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM student_batches WHERE student_id = $1 AND batch_id = $2',
      [sId, bId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Student already enrolled in this batch' });
    }

    const result = await pool.query(
      'INSERT INTO student_batches (student_id, batch_id) VALUES ($1, $2) RETURNING *',
      [sId, bId]
    );

    res.status(201).json({
      success: true,
      enrollment: result.rows[0]
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
}, 'admin'));

export default router;
