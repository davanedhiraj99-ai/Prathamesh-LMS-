import checkAuth from '../../middleware/check-auth.js';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import rateLimit from '../../middleware/rate-limit.js';

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

  const expirationTime = Math.floor(Date.now() / 1000) + (5 * 60);
  const token = jwt.sign(
    { 
      videoId: bunnyVideoId,
      studentId: studentId,
      exp: expirationTime
    },
    process.env.JWT_SECRET
  );

  const signedUrl = `https://iframe.mediadelivery.net/embed/${process.env.BUNNY_LIBRARY_ID}/${bunnyVideoId}?token=${token}`;

  res.status(200).json({ 
    signedUrl,
    expiresAt: expirationTime 
  });
  })
);

export default router;
