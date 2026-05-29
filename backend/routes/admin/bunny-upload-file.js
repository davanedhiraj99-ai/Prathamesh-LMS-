import checkAuth from '../../middleware/check-auth.js';
import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';

const tmpDir = process.env.VERCEL ? '/tmp' : path.resolve('tmp');
fs.mkdirSync(tmpDir, { recursive: true });
const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }
});
const router = Router();

router.post(
  '/',
  (req, res, next) =>
    upload.single('file')(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
      }
      return next(err);
    }),
  checkAuth(async (req, res) => {
    if (!process.env.BUNNY_API_KEY || !process.env.BUNNY_LIBRARY_ID) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { videoId, libraryId } = req.body;
    if (!videoId || !libraryId) {
      return res.status(400).json({ error: 'videoId and libraryId are required' });
    }

    if (!req.file?.path) {
      return res.status(400).json({ error: 'file is required' });
    }

    const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;
    const fileStream = fs.createReadStream(req.file.path);

    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { AccessKey: process.env.BUNNY_API_KEY },
        body: fileStream
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return res.status(502).json({ error: 'Failed to upload to Bunny', details: text || String(response.status) });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Upload failed', details: error.message });
    } finally {
      fs.promises.unlink(req.file.path).catch(() => {});
    }
  }, 'admin')
);

export default router;
