/**
 * Vercel Serverless Entry Point
 * Routes all /api/* requests to the consolidated Express app.
 */
const app = require('../server');

module.exports = (req, res) => {
  // Normalize req.url if Vercel stripped /api prefix or rewrote it
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
