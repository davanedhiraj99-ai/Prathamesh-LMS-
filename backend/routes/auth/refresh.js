import { Router } from 'express';
import pool from '../../utils/db-client.js';
import { getClientIp } from '../../utils/client-ip.js';
import rateLimit from '../../middleware/rate-limit.js';
import {
  buildFingerprintHash,
  clearRefreshTokenCookie,
  createRefreshToken,
  getRefreshExpiryDate,
  hashRefreshToken,
  issueAccessToken,
  setRefreshTokenCookie,
} from '../../utils/auth-session.js';

const router = Router();

router.post(
  '/',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 120, keyPrefix: 'refresh' }),
  async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    const deviceId = String(req.headers['x-device-id'] || '').trim();
    const fingerprint = String(req.headers['x-device-fingerprint'] || '').trim();
    const fingerprintHash = buildFingerprintHash(fingerprint);
    const clientIp = getClientIp(req);

    if (!refreshToken || !deviceId) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Refresh session missing.' });
    }

    try {
      const refreshTokenHash = hashRefreshToken(refreshToken);
      const sessionResult = await pool.query(
        `SELECT rs.id, rs.user_id, rs.device_id, rs.token_family, rs.expires_at, rs.revoked_at,
                rs.fingerprint_hash, s.name, s.email, s.role
         FROM refresh_sessions rs
         INNER JOIN students s ON s.id = rs.user_id
         WHERE rs.refresh_token_hash = $1 AND rs.is_current = true`,
        [refreshTokenHash]
      );

      const session = sessionResult.rows[0];

      if (!session) {
        clearRefreshTokenCookie(res);
        return res.status(401).json({ error: 'Refresh session invalid.' });
      }

      if (session.device_id !== deviceId || session.revoked_at || new Date(session.expires_at) <= new Date()) {
        await pool.query(
          `UPDATE refresh_sessions
           SET revoked_at = CURRENT_TIMESTAMP,
               revoke_reason = 'invalid refresh attempt',
               is_current = false
           WHERE id = $1`,
          [session.id]
        );
        clearRefreshTokenCookie(res);
        return res.status(401).json({ error: 'Refresh session expired.' });
      }

      if (session.fingerprint_hash && fingerprintHash && session.fingerprint_hash !== fingerprintHash) {
        await pool.query(
          `UPDATE refresh_sessions
           SET revoked_at = CURRENT_TIMESTAMP,
               revoke_reason = 'fingerprint mismatch',
               is_current = false
           WHERE token_family = $1`,
          [session.token_family]
        );
        clearRefreshTokenCookie(res);
        return res.status(401).json({ error: 'Device verification failed.' });
      }

      const deviceResult = await pool.query(
        `SELECT id FROM user_devices
         WHERE user_id = $1 AND device_id = $2 AND is_active = true AND revoked_at IS NULL`,
        [session.user_id, deviceId]
      );

      if (deviceResult.rows.length === 0) {
        clearRefreshTokenCookie(res);
        return res.status(401).json({ error: 'Device session revoked.' });
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        await client.query(
          `UPDATE refresh_sessions
           SET revoked_at = CURRENT_TIMESTAMP,
               revoke_reason = 'rotated',
               is_current = false,
               last_used_at = CURRENT_TIMESTAMP,
               last_ip = $2
           WHERE id = $1`,
          [session.id, clientIp || null]
        );

        const nextRefreshToken = createRefreshToken();
        const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);
        const nextExpiry = getRefreshExpiryDate();

        await client.query(
          `INSERT INTO refresh_sessions
           (user_id, device_id, refresh_token_hash, token_family, expires_at, last_used_at, last_ip, fingerprint_hash)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7)`,
          [
            session.user_id,
            deviceId,
            nextRefreshTokenHash,
            session.token_family,
            nextExpiry,
            clientIp || null,
            fingerprintHash,
          ]
        );

        await client.query(
          `UPDATE user_devices
           SET last_seen_at = CURRENT_TIMESTAMP,
               last_ip = $3,
               fingerprint_hash = COALESCE($4, fingerprint_hash)
           WHERE user_id = $1 AND device_id = $2`,
          [session.user_id, deviceId, clientIp || null, fingerprintHash]
        );

        await client.query('COMMIT');

        setRefreshTokenCookie(res, nextRefreshToken);

        const token = issueAccessToken(
          {
            id: session.user_id,
            name: session.name,
            email: session.email,
            role: session.role,
          },
          deviceId
        );

        return res.status(200).json({
          success: true,
          token,
          user: {
            id: session.user_id,
            name: session.name,
            email: session.email,
            role: session.role,
          },
        });
      } catch (transactionError) {
        await client.query('ROLLBACK').catch(() => {});
        throw transactionError;
      } finally {
        client.release();
      }
    } catch (error) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Unable to refresh session.' });
    }
  }
);

export default router;
