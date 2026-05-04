import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../utils/db-client.js';
import { Router } from 'express';
import { getClientIp } from '../../utils/client-ip.js';
import rateLimit from '../../middleware/rate-limit.js';

const router = Router();

router.post('/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'login' }), async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const clientIp = getClientIp(req);

  try {
    const result = await pool.query('SELECT * FROM students WHERE email = $1', [normalizedEmail]);
    const student = result.rows[0];

    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password exists in DB
    if (!student.password) {
      return res.status(500).json({ error: 'Account setup incomplete' });
    }

    const validPassword = await bcrypt.compare(password, student.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const currentIp1 = student.ip_slot_1;
    const currentIp2 = student.ip_slot_2;
    const isIp1Match = currentIp1 === clientIp;
    const isIp2Match = currentIp2 === clientIp;

    if (!isIp1Match && !isIp2Match) {
      if (!currentIp1) {
        await pool.query('UPDATE students SET ip_slot_1 = $1 WHERE id = $2', [clientIp, student.id]);
      } else if (!currentIp2) {
        await pool.query('UPDATE students SET ip_slot_2 = $1 WHERE id = $2', [clientIp, student.id]);
      } else {
        return res.status(403).json({ 
          error: 'Maximum devices reached. Contact Prathamesh Sir to reset IP slots.',
          code: 'IP_LIMIT_EXCEEDED'
        });
      }
    }

    const token = jwt.sign(
      { 
        id: student.id, 
        email: student.email, 
        name: student.name, 
        role: student.role,
        ip: clientIp
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role
      }
    });

  } catch (error) {
    console.error('Login error:', error?.message || error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
