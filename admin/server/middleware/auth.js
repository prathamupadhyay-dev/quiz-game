const jwt = require('jsonwebtoken');
const { getDbStatus } = require('../db');

function requireDb(req, res, next) {
  if (!getDbStatus()) {
    return res.status(503).json({
      error: 'Database not configured yet'
    });
  }
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authorization token required'
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'zync_shared_jwt_secret_key_2026';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied: Admin role required'
    });
  }
  next();
}

module.exports = {
  requireDb,
  requireAuth,
  requireAdmin
};
