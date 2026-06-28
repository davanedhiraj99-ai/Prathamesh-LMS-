import checkAuth from '../../middleware/check-auth.js';
import { Router } from 'express';
import rateLimit from '../../middleware/rate-limit.js';
import pool from '../../utils/db-client.js';
import { syncVideoStatuses } from '../../utils/bunny-stream.js';

const router = Router();

router.post(
  '/',
  rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: 'sign-video' }),
  checkAuth(async (req, res) => {
  const { bunnyVideoId } = req.body;
  const studentId = req.user.id;

  if (!bunnyVideoId || typeof bunnyVideoId !== 'string') {
    return res.status(400).json({ error: 'bunnyVideoId is required' });
  }

  if (!process.env.BUNNY_LIBRARY_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const videoResult = await pool.query(
    `SELECT bc.*, sb.student_id
     FROM batch_content bc
     INNER JOIN student_batches sb
       ON sb.batch_id = bc.batch_id
      AND sb.student_id = $1
      AND sb.is_active = true
     WHERE bc.type = 'video' AND bc.url = $2
     LIMIT 1`,
    [studentId, bunnyVideoId]
  );

  if (videoResult.rows.length === 0) {
    return res.status(404).json({ error: 'Video not found for this student.' });
  }

  const [videoRow] = await syncVideoStatuses(videoResult.rows);

  if (!videoRow) {
    return res.status(404).json({
      error: 'This lecture is no longer available. Please contact the admin if this looks unexpected.'
    });
  }

  if (videoRow.status === 'failed') {
    return res.status(409).json({
      error: 'This lecture is unavailable in the current Bunny library. Please re-upload it from the active account.'
    });
  }

  if (videoRow.status !== 'ready') {
    return res.status(409).json({
      error: 'This lecture is still processing. Please try again in a few minutes.'
    });
  }

  const signedUrl =
    `https://player.mediadelivery.net/play/${process.env.BUNNY_LIBRARY_ID}/${bunnyVideoId}` +
    `?autoplay=false&muted=false&preload=true&playsinline=true`;

  res.status(200).json({ 
    signedUrl,
    expiresAt: null
  });
  })
);

export default router;
