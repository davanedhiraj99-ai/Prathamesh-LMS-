import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';
import { syncBatchContentForBatchIds } from '../../utils/bunny-stream.js';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  const studentId = req.user.id;

  try {
    const studentBatchIdsResult = await pool.query(
      `SELECT batch_id
       FROM student_batches
       WHERE student_id = $1 AND is_active = true`,
      [studentId]
    );

    await syncBatchContentForBatchIds(studentBatchIdsResult.rows.map((row) => row.batch_id));

    const enrolledResult = await pool.query(`
      SELECT 
        b.id,
        b.uuid,
        b.name,
        b.description,
        b.thumbnail_url,
        b.created_at,
        sb.enrolled_at,
        sb.expires_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', v.id,
              'title', v.title,
              'description', v.description,
              'bunny_video_id', v.url,
              'thumbnail_url', v.thumbnail,
              'duration', v.duration,
              'status', v.status,
              'created_at', v.created_at
            ) ORDER BY v.created_at DESC
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'
        ) as videos
      FROM batches b
      INNER JOIN student_batches sb ON b.id = sb.batch_id
      LEFT JOIN batch_content v ON b.id = v.batch_id AND v.type = 'video' AND v.status = 'ready'
      WHERE sb.student_id = $1 AND sb.is_active = true AND b.is_active = true
      GROUP BY b.id, b.uuid, b.name, b.description, b.thumbnail_url, b.created_at, sb.enrolled_at, sb.expires_at
      ORDER BY sb.enrolled_at DESC
    `, [studentId]);

    const availableResult = await pool.query(`
      SELECT 
        b.id,
        b.uuid,
        b.name,
        b.description,
        b.thumbnail_url,
        b.created_at,
        COUNT(v.id) as video_count
      FROM batches b
      LEFT JOIN batch_content v ON b.id = v.batch_id AND v.status = 'ready' AND v.type = 'video'
      WHERE b.is_active = true
      AND b.id NOT IN (
        SELECT batch_id FROM student_batches 
        WHERE student_id = $1 AND is_active = true
      )
      GROUP BY b.id, b.uuid, b.name, b.description, b.thumbnail_url, b.created_at
      ORDER BY b.created_at DESC
    `, [studentId]);

    res.status(200).json({
      enrolled: enrolledResult.rows,
      available: availableResult.rows
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
}));

export default router;
