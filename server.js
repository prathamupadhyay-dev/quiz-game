/**
 * ZYNC Master Production Server
 * Consolidated MERN platform server running all 5 portal backends and serving the unified SPA distribution.
 *
 * Routes:
 *   /           -> Student Pad (User Portal)
 *   /admin      -> Admin Control Center
 *   /creator    -> Creator Studio
 *   /presentor  -> Presentor Arena
 *   /presenter  -> Presentor Alias
 *   /moderator  -> Moderator Deck
 *   /api/*      -> Unified API services (Auth, Quizzes, Games, Moderation, Admin)
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
  require('dotenv').config({ path: path.resolve(__dirname, '.env.shared'), override: true });
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'zync_shared_jwt_secret_key_2026';

// Enable CORS for all origins
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Universal API URL Normalizer for Vercel Serverless
app.use((req, res, next) => {
  const matched = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-vercel-matched-path'];
  if (matched && !matched.endsWith('.js') && !matched.endsWith('.html') && matched.startsWith('/api')) {
    req.url = matched;
  }
  next();
});

// Database connection
const { connectDB, getDbStatus } = require('./admin/server/db');
connectDB();

// Import shared User model
const User = require('./admin/server/models/User');

// Universal Health check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'zync-unified-platform',
    version: '1.0.0',
    time: new Date(),
    db: getDbStatus()
  });
});

// Universal Auth - Login
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  try {
    await connectDB();
    const { email, username, password } = req.body;
    const identifier = (email || username || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.disabled) {
      return res.status(403).json({ error: 'Account has been disabled' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastOnline = new Date();
    await user.save().catch(() => {});

    const token = jwt.sign(
      {
        userId: user._id,
        id: user._id,
        role: user.role,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarConfig: user.avatarConfig,
        access: user.access
      }
    });
  } catch (err) {
    console.error('Universal login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Universal Auth - Register
app.post(['/api/auth/register', '/auth/register'], async (req, res) => {
  try {
    await connectDB();
    const { username, password, confirmPassword } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      return res.status(400).json({
        error: 'Username must be 3-24 characters and only contain lowercase letters, numbers, and underscores (_)'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: cleanUsername,
      name: cleanUsername,
      email: `${cleanUsername}@zync.local`,
      passwordHash,
      role: 'user',
      avatarConfig: {
        skinColor: '#F5C7A9',
        hairStyle: 'curly',
        hairColor: '#1C1C1E',
        faceExpression: 'smile',
        topType: 'hoodie',
        topColor: '#5E5CE6',
        bottomType: 'jeans',
        bottomColor: '#1E293B',
        shoesType: 'sneakers',
        accessory: 'none',
        presetOutfit: 'naruto'
      },
      lastOnline: new Date()
    });

    const token = jwt.sign(
      {
        userId: newUser._id,
        id: newUser._id,
        role: newUser.role,
        username: newUser.username,
        email: newUser.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        _id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatarConfig: newUser.avatarConfig,
        access: newUser.access
      }
    });
  } catch (err) {
    console.error('Universal register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Universal Auth - Me
app.get(['/api/auth/me', '/auth/me'], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.userId || decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Direct Student Characters endpoint
const AnimeCategory = require('./student/server/models/AnimeCategory');
const AnimeCharacter = require('./student/server/models/AnimeCharacter');
app.get(['/api/student/characters', '/student/characters'], async (req, res) => {
  try {
    await connectDB();
    const [categories, characters] = await Promise.all([
      AnimeCategory.find().sort({ name: 1 }).lean().catch(() => []),
      AnimeCharacter.find({ active: true }).sort({ createdAt: 1 }).lean().catch(() => [])
    ]);
    res.json({ categories: categories || [], characters: characters || [] });
  } catch (err) {
    console.error('Fetch student characters error in server.js:', err);
    res.status(500).json({ error: 'Failed to retrieve characters' });
  }
});

// Mount Sub-Apps
try {
  const studentApp = require('./student/server/index');
  app.use(studentApp);
} catch (e) {
  console.warn('⚠️ [SERVER] Could not mount studentApp:', e.message);
}

try {
  const teacherApp = require('./teacher/server/index');
  app.use(teacherApp);
} catch (e) {
  console.warn('⚠️ [SERVER] Could not mount teacherApp:', e.message);
}

try {
  const principalApp = require('./principal/server/index');
  app.use(principalApp);
} catch (e) {
  console.warn('⚠️ [SERVER] Could not mount principalApp:', e.message);
}

try {
  const moderatorApp = require('./moderator/server/index');
  app.use(moderatorApp);
} catch (e) {
  console.warn('⚠️ [SERVER] Could not mount moderatorApp:', e.message);
}

try {
  const adminRoutes = require('./admin/server/routes/admin');
  app.use(['/api/admin', '/admin'], adminRoutes);
  const adminApp = require('./admin/server/index');
  app.use(adminApp);
} catch (e) {
  console.warn('⚠️ [SERVER] Could not mount adminApp:', e.message);
}

// Serve Static Distribution Files (Unified Single-Domain Multi-Portal)
const DIST_PATH = path.resolve(__dirname, 'dist');

// Serve root static assets (Student app and shared assets)
app.use(express.static(DIST_PATH));

// Multi-Portal Static Routing:
// /admin -> Admin Portal SPA
app.use('/admin', express.static(path.join(DIST_PATH, 'admin')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'admin', 'index.html'));
});

// /creator -> Creator (Principal) Portal SPA
app.use('/creator', express.static(path.join(DIST_PATH, 'creator')));
app.get('/creator/*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'creator', 'index.html'));
});

// /presentor -> Presentor (Teacher) Arena SPA
app.use('/presentor', express.static(path.join(DIST_PATH, 'presentor')));
app.get('/presentor/*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'presentor', 'index.html'));
});

// /presenter -> Presentor Alias SPA
app.use('/presenter', express.static(path.join(DIST_PATH, 'presenter')));
app.get('/presenter/*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'presenter', 'index.html'));
});

// /moderator -> Moderator Deck SPA
app.use('/moderator', express.static(path.join(DIST_PATH, 'moderator')));
app.get('/moderator/*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'moderator', 'index.html'));
});

// Default root SPA -> Student / User Portal
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`\n🚀 [ZYNC] Consolidated production server listening on port ${PORT}`);
    console.log(`• Student (User):   http://localhost:${PORT}/`);
    console.log(`• Admin Portal:     http://localhost:${PORT}/admin`);
    console.log(`• Creator Portal:   http://localhost:${PORT}/creator`);
    console.log(`• Presentor Arena:  http://localhost:${PORT}/presentor`);
    console.log(`• Moderator Deck:   http://localhost:${PORT}/moderator`);
    console.log(`• API Health:       http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
