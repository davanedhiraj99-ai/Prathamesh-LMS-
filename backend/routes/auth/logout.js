import { Router } from 'express';
import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { clearRefreshTokenCookie, hashRefreshToken } from '../../utils/auth-session.js';

const router = Router();

router.post('/', checkAuth(async (req, res) => {
  const userId = req.user.id;
  const deviceId = String(req.headers['x-device-id'] || '').trim();
  const refreshToken = req.cookies?.refreshToken;

  try {
    if (refreshToken) {
      await pool.query(
        `UPDATE refresh_sessions
         SET revoked_at = CURRENT_TIMESTAMP,
             revoke_reason = 'logout',
             is_current = false
         WHERE user_id = $1 AND refresh_token_hash = $2`,
        [userId, hashRefreshToken(refreshToken)]
      );
    }

    if (deviceId) {
      await pool.query(
        `UPDATE user_devices
         SET last_seen_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND device_id = $2`,
        [userId, deviceId]
      );
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}));

export default router;
