import jwt from 'jsonwebtoken';
import { getClientIp } from '../utils/client-ip.js';

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
      req.user = decoded;

      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
      }

      if (decoded?.ip) {
        const requestIp = getClientIp(req);
        if (requestIp && decoded.ip !== requestIp) {
          return res.status(401).json({ error: 'Invalid token.' });
        }
      }

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
  };
}
