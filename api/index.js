/**
 * Vercel Serverless Entry Point
 * Routes all /api/* requests to the consolidated Express app.
 */
const app = require('../server');

module.exports = app;
