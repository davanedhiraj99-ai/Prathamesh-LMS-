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
      'UPDATE students SET ip_slot_1 = NULL, ip_slot_2 = NULL WHERE id = $1',
      [id]
    );
    res.status(200).json({ success: true, message: 'IP slots reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset IP slots' });
  }
}, 'admin'));

export default router;
