import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import axios from 'axios';
import {
  ensureBatchContentOrderColumn,
  getBatchContentInsertOrder,
  shiftBatchContentOrder
} from '../../utils/content-order.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(file.originalname || '').toLowerCase() === '.pdf';

    if (!isPdfMime && !isPdfExt) {
      cb(new Error('Only PDF files are allowed'));
      return;
    }

    cb(null, true);
  }
});

function buildStorageFileName(fileName) {
  const safeBaseName = path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const extension = path.extname(fileName || '').toLowerCase() || '.pdf';
  const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
  return `${safeBaseName || 'note'}-${uniqueSuffix}${extension}`;
}

function getRequiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function uploadPdfToBunny(file) {
  const storageZone = getRequiredEnv('BUNNY_STORAGE_ZONE');
  const storagePassword = getRequiredEnv('BUNNY_STORAGE_PASSWORD');
  const storageHost = String(process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com').trim();
  const pullZoneHost = getRequiredEnv('BUNNY_PULL_ZONE_HOST');

  const fileName = buildStorageFileName(file.originalname || 'note.pdf');
  const storagePath = `notes/${fileName}`;
  const uploadUrl = `https://${storageHost}/${storageZone}/${storagePath}`;

  await axios.put(uploadUrl, file.buffer, {
    headers: {
      AccessKey: storagePassword,
      'Content-Type': 'application/octet-stream'
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });

  return {
    storagePath,
    publicUrl: `https://${pullZoneHost}/${storagePath}`
  };
}

router.post(
  '/',
  checkAuth(async (req, res) => {
    upload.single('file')(req, res, async (uploadError) => {
      if (uploadError) {
        return res.status(400).json({ error: uploadError.message || 'Failed to upload PDF' });
      }

      try {
        const { title, batchId, placement = 'last', positionNumber = null } = req.body;
        const { file } = req;

        if (!title || !batchId) {
          return res.status(400).json({ error: 'Missing required fields: title, batchId' });
        }

        if (!file) {
          return res.status(400).json({ error: 'PDF file is required' });
        }

        const { publicUrl, storagePath } = await uploadPdfToBunny(file);
        await ensureBatchContentOrderColumn();
        const sortOrder = await getBatchContentInsertOrder(batchId, 'note', placement, positionNumber);
        await shiftBatchContentOrder(batchId, 'note', sortOrder);

        const result = await pool.query(
          `INSERT INTO batch_content (title, type, batch_id, sort_order, url, file_size) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [title, 'note', batchId, sortOrder, publicUrl, file.size || 0]
        );

        res.status(201).json({
          success: true,
          content: result.rows[0],
          storagePath
        });
      } catch (error) {
        console.error('Note upload error:', error);
        const bunnyMessage =
          error.response?.data?.message ||
          error.response?.data?.Message ||
          error.response?.statusText ||
          error.message;
        res.status(500).json({
          error: 'Failed to save note',
          details: bunnyMessage,
          statusCode: error.response?.status
        });
      }
    });
  }, 'admin')
);

export default router;
