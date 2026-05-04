import checkAuth from '../../middleware/check-auth.js';
import pool from '../../utils/db-client.js';
import bcrypt from 'bcryptjs';
import { Router } from 'express';

const router = Router();

router.get('/', checkAuth(async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, ip_slot_1, ip_slot_2, created_at 
      FROM students 
      ORDER BY created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('GET students error:', error);
    res.status(500).json({ error: 'Failed to fetch students', details: error.message });
  }
}, 'admin'));

router.post('/', checkAuth(async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'Name, email, and password are required'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email format',
      details: 'Please provide a valid email address'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      error: 'Password too short',
      details: 'Password must be at least 6 characters'
    });
  }
  
  try {
    const existingCheck = await pool.query(
      'SELECT id FROM students WHERE email = $1',
      [email]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Email already exists',
        details: 'A student with this email is already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO students (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, role]
    );
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('POST student error:', error);
    res.status(500).json({ 
      error: 'Failed to create student',
      details: error.message,
      hint: 'Check database connection and schema'
    });
  }
}, 'admin'));

router.delete('/', checkAuth(async (req, res) => {
  const { id } = req.query;
  const studentId = Number(id);
  
  if (!Number.isInteger(studentId) || studentId <= 0) {
    return res.status(400).json({ error: 'Student ID is required' });
  }
  
  try {
    const checkResult = await pool.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await pool.query('DELETE FROM students WHERE id = $1', [studentId]);
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('DELETE student error:', error);
    res.status(500).json({ 
      error: 'Failed to delete student',
      details: error.message
    });
  }
}, 'admin'));

export default router;
