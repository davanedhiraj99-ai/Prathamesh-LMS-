import pool from '../utils/db-client.js';

export default async function handler(req, res) {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      serverTime: dbResult.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error?.message || String(error)
    });
  }
}

