function isAllowedOrigin(origin) {
  if (!origin) return true;

  const explicitOrigins = new Set(
    [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ].filter(Boolean)
  );

  if (explicitOrigins.has(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'prathamesh-lms-frontend.vercel.app' ||
      (hostname.endsWith('.vercel.app') && hostname.includes('prathamesh-lms-frontend'))
    );
  } catch {
    return false;
  }
}

export default function cors(req, res, next) {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-device-id, x-device-name, x-device-fingerprint'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return next();
}
