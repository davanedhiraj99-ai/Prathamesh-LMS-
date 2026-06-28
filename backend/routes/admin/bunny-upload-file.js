import checkAuth from '../../middleware/check-auth.js';
import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';

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

    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    if (!req.file?.path) {
      return res.status(400).json({ error: 'file is required' });
    }

    const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`;

    try {
      const fileStats = await fs.promises.stat(req.file.path);
      const fileStream = fs.createReadStream(req.file.path);
      const response = await axios.put(uploadUrl, fileStream, {
        headers: {
          AccessKey: process.env.BUNNY_API_KEY,
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileStats.size
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true
      });

      if (response.status < 200 || response.status >= 300) {
        const responseDetails =
          typeof response.data === 'string'
            ? response.data
            : response.data?.message || response.data?.Message || JSON.stringify(response.data || {});
        return res.status(502).json({
          error: 'Failed to upload to Bunny',
          details: responseDetails || String(response.status)
        });
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
