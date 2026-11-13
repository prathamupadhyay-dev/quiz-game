/**
 * Vercel Serverless Catch-All Entry Point
 * Handles /api/* nested routes cleanly.
 */
const app = require('../server');

module.exports = (req, res) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
