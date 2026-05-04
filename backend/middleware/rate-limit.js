const buckets = new Map();

function nowMs() {
  return Date.now();
}

function getKey(req, keyPrefix) {
  const ip = req.ip || req.socket?.remoteAddress || '';
  return `${keyPrefix}:${ip}`;
}

export default function rateLimit({ windowMs, max, keyPrefix }) {
  return (req, res, next) => {
    const key = getKey(req, keyPrefix);
    const now = nowMs();

    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    return next();
  };
}

