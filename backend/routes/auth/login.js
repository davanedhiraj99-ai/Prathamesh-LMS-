import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import pool from '../../utils/db-client.js';
import { Router } from 'express';
import { getClientIp } from '../../utils/client-ip.js';
import rateLimit from '../../middleware/rate-limit.js';
import {
  buildFingerprintHash,
  createRefreshToken,
  getMaxActiveDevices,
  getRefreshExpiryDate,
  hashRefreshToken,
  issueAccessToken,
  setRefreshTokenCookie,
} from '../../utils/auth-session.js';

const router = Router();

router.post('/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'login' }), async (req, res) => {
  const body =
    req.body && typeof req.body === 'object'
      ? req.body
      : {};
  const { email, password } = body;
  const deviceId = String(req.headers['x-device-id'] || '').trim();
  const fingerprint = String(req.headers['x-device-fingerprint'] || '').trim();
  const deviceName = String(req.headers['x-device-name'] || '').trim() || 'Unknown device';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!deviceId) {
    return res.status(400).json({ error: 'Device identification is required' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;
  const fingerprintHash = buildFingerprintHash(fingerprint);

  try {
    const result = await pool.query('SELECT * FROM students WHERE email = $1', [normalizedEmail]);
    const student = result.rows[0];

    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!student.password) {
      return res.status(500).json({ error: 'Account setup incomplete' });
    }

    const validPassword = await bcrypt.compare(password, student.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existingDeviceResult = await client.query(
        `SELECT id FROM user_devices
         WHERE user_id = $1 AND device_id = $2`,
        [student.id, deviceId]
      );

      if (existingDeviceResult.rows.length === 0) {
        const activeDevicesResult = await client.query(
          `SELECT COUNT(*)::int AS count
           FROM user_devices
           WHERE user_id = $1 AND is_active = true AND revoked_at IS NULL`,
          [student.id]
        );

        if (activeDevicesResult.rows[0].count >= getMaxActiveDevices()) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            error: 'Maximum devices reached. Contact support to reset your device slots.',
            code: 'DEVICE_LIMIT_EXCEEDED',
          });
        }

        await client.query(
          `INSERT INTO user_devices
           (user_id, device_id, device_name, fingerprint_hash, user_agent, last_ip)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [student.id, deviceId, deviceName, fingerprintHash, userAgent, clientIp || null]
        );
      } else {
        await client.query(
          `UPDATE user_devices
           SET device_name = $3,
               fingerprint_hash = $4,
               user_agent = $5,
               last_ip = $6,
               last_seen_at = CURRENT_TIMESTAMP,
               is_active = true,
               revoked_at = NULL
           WHERE user_id = $1 AND device_id = $2`,
          [student.id, deviceId, deviceName, fingerprintHash, userAgent, clientIp || null]
        );
      }

      await client.query(
        `UPDATE refresh_sessions
         SET revoked_at = CURRENT_TIMESTAMP,
             revoke_reason = 'superseded by new login',
             is_current = false
         WHERE user_id = $1 AND device_id = $2 AND revoked_at IS NULL`,
        [student.id, deviceId]
      );

      const refreshToken = createRefreshToken();
      const refreshTokenHash = hashRefreshToken(refreshToken);
      const refreshExpiry = getRefreshExpiryDate();
      const tokenFamily = crypto.randomUUID();

      await client.query(
        `INSERT INTO refresh_sessions
         (user_id, device_id, refresh_token_hash, token_family, expires_at, last_used_at, last_ip, fingerprint_hash)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7)`,
        [student.id, deviceId, refreshTokenHash, tokenFamily, refreshExpiry, clientIp || null, fingerprintHash]
      );

      await client.query('COMMIT');

      const token = issueAccessToken(student, deviceId);
      setRefreshTokenCookie(res, refreshToken);

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role,
        },
      });
    } catch (transactionError) {
      await client.query('ROLLBACK').catch(() => {});
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error?.message || error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
