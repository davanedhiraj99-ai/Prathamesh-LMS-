// Backwards-compatible entrypoint:
// - Vercel should use `api/[...all].js`
// - Local dev should use `dev.js`
export { default } from '../app.js';
