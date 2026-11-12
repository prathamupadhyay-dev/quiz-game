const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireDb, requireAuth } = require('../middleware/auth');

const PORTAL_MAP = {
  admin: { name: 'Admin', url: 'http://localhost:5171' },
  user: { name: 'Student', url: 'http://localhost:5172' },
  student: { name: 'Student', url: 'http://localhost:5172' },
  presentor: { name: 'Presenter', url: 'http://localhost:5173' },
  teacher: { name: 'Presenter', url: 'http://localhost:5173' },
  moderator: { name: 'Moderator', url: 'http://localhost:5174' },
  creator: { name: 'Creator', url: 'http://localhost:5175' },
  principal: { name: 'Creator', url: 'http://localhost:5175' }
};

router.post('/login', requireDb, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Username/Email and password are required'
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    if (user.disabled) {
      return res.status(403).json({
        error: 'Account has been disabled'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Role check for Admin portal
    if (user.role !== 'admin') {
      const portal = PORTAL_MAP[user.role] || { name: user.role, url: '#' };
      return res.status(403).json({
        error: `Use the ${portal.name} portal`,
        portalName: portal.name,
        portalUrl: portal.url,
        role: user.role
      });
    }

    user.lastOnline = new Date();
    await user.save();

    const secret = process.env.JWT_SECRET || 'zync_shared_jwt_secret_key_2026';
    const payload = {
      userId: user._id,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(payload, secret, {
      expiresIn: '8h',
      algorithm: 'HS256'
    });

    res.json({
      token,
      user: {
        userId: user._id,
        role: user.role,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Failed to process login request'
    });
  }
});

router.get('/me', requireDb, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    if (user.disabled) {
      return res.status(403).json({
        error: 'Account has been disabled'
      });
    }
    res.json({
      user: {
        userId: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        access: user.access,
        assignedTeacherIds: user.assignedTeacherIds
      }
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to retrieve user session'
    });
  }
});

module.exports = router;
