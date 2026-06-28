import jwt from 'jsonwebtoken';
import pool from '../utils/db-client.js';

export default function checkAuth(handler, requiredRole = null) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const requestDeviceId = String(req.headers['x-device-id'] || '').trim();

      if (!requestDeviceId || decoded.deviceId !== requestDeviceId) {
        return res.status(401).json({ error: 'Invalid device session.' });
      }

      const deviceResult = await pool.query(
        `SELECT id FROM user_devices
         WHERE user_id = $1 AND device_id = $2 AND is_active = true AND revoked_at IS NULL`,
        [decoded.id, requestDeviceId]
      );

      if (deviceResult.rows.length === 0) {
        return res.status(401).json({ error: 'Device session revoked.' });
      }

      req.user = decoded;

      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
      }

      return handler(req, res);
    } catch {
      return res.status(401).json({ error: 'Invalid token.' });
    }
  };
}
