import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.post('/', checkAuth(async (req, res) => {
  const { studentId } = req.body;
  const id = Number(studentId);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'studentId is required' });
  }

  try {
    await pool.query(
      `UPDATE refresh_sessions
       SET revoked_at = CURRENT_TIMESTAMP,
           revoke_reason = 'admin reset',
           is_current = false
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [id]
    );

    await pool.query(
      `UPDATE user_devices
       SET is_active = false,
           revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [id]
    );

    res.status(200).json({ success: true, message: 'Device sessions reset successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to reset device sessions' });
  }
}, 'admin'));

export default router;
