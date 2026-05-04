import pool from '../utils/db-client.js';
import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM testimonials ORDER BY created_at ASC'
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch testimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, rating, review, course } = req.body;

  if (!name || !email || !rating || !review || !course) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const insertResult = await pool.query(
      `INSERT INTO testimonials (name, email, rating, review, course) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email, rating, review, course]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM testimonials');
    const totalCount = parseInt(countResult.rows[0].count);

    if (totalCount > 5) {
      await pool.query(
        `DELETE FROM testimonials 
         WHERE id = (SELECT id FROM testimonials ORDER BY created_at ASC LIMIT 1)`
      );
    }

    res.status(201).json({
      success: true,
      testimonial: insertResult.rows[0]
    });

  } catch (error) {
    console.error('Add testimonial error:', error);
    res.status(500).json({ error: 'Failed to add testimonial' });
  }
});

export default router;