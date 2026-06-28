import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 45);

export function issueAccessToken(user, deviceId) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      deviceId,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function buildFingerprintHash(fingerprint) {
  if (!fingerprint) return null;
  return crypto.createHash('sha256').update(String(fingerprint)).digest('hex');
}

export function getRefreshExpiryDate() {
  return new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
}

export function setRefreshTokenCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
}

export function getMaxActiveDevices() {
  return Number(process.env.MAX_ACTIVE_DEVICES || 2);
}
