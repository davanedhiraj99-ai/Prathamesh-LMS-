import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  try {
    const [
      studentsResult,
      batchesResult,
      videosResult,
      enrollmentsResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM students WHERE role = $1', ['student']),
      pool.query('SELECT COUNT(*) FROM batches WHERE is_active = true'),
      pool.query('SELECT COUNT(*) FROM batch_content WHERE type = $1', ['video']),
      pool.query('SELECT COUNT(*) FROM student_batches WHERE is_active = true')
    ]);

    res.status(200).json({
      totalStudents: parseInt(studentsResult.rows[0].count),
      totalBatches: parseInt(batchesResult.rows[0].count),
      totalVideos: parseInt(videosResult.rows[0].count),
      totalEnrollments: parseInt(enrollmentsResult.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}, 'admin'));

export default router;
