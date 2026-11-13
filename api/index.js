/**
 * Vercel Serverless Entry Point
 * Routes all /api/* requests to the consolidated Express app.
 */
const app = require('../server');

module.exports = (req, res) => {
  // If Vercel rewrote URL or passed x-matched-path, restore the original endpoint:
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-vercel-matched-path'];
  if (matchedPath && !matchedPath.endsWith('.js') && matchedPath !== '/api' && matchedPath !== '/api/') {
    req.url = matchedPath;
  }
  return app(req, res);
};
