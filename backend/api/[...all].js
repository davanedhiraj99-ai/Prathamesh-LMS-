import app from '../app.js';

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Server crashed',
        message: error?.message || String(error)
      })
    );
  }
}
