import { Router } from 'express';
import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import { getClientIp } from '../../utils/client-ip.js';

const router = Router();

router.post('/', checkAuth(async (req, res) => {
  const userId = req.user.id;
  const ip = getClientIp(req);

  try {
    await pool.query(`
      UPDATE students 
      SET ip_slot_1 = CASE WHEN ip_slot_1 = $1 THEN NULL ELSE ip_slot_1 END,
          ip_slot_2 = CASE WHEN ip_slot_2 = $1 THEN NULL ELSE ip_slot_2 END
      WHERE id = $2
    `, [ip, userId]);

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}));

export default router;
