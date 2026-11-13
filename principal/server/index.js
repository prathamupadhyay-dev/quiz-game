require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, getDbStatus } = require('./db');

const User = require('./models/User');
const Quiz = require('./models/Quiz');
const SlideDeck = require('./models/SlideDeck');
const Game = require('./models/Game');
const Player = require('./models/Player');
const Answer = require('./models/Answer');
const Category = require('./models/Category');
const ModerationLog = require('./models/ModerationLog');

const app = express();
const PORT = process.env.PORT || 5005;

const allowedOrigins = [
  'http://localhost:5171',
  'http://localhost:5172',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

if (process.env.CLIENT_ORIGIN && !allowedOrigins.includes(process.env.CLIENT_ORIGIN)) {
  allowedOrigins.push(process.env.CLIENT_ORIGIN);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

async function requireDb(req, res, next) {
  if (!getDbStatus()) {
    await connectDB().catch(() => {});
  }
  if (!getDbStatus()) {
    return res.status(503).json({ error: 'Database not configured yet' });
  }
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'zync_shared_jwt_secret_key_2026';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const PORTAL_MAP = {
  admin: { name: 'Admin', url: 'http://localhost:5171' },
  student: { name: 'Student', url: 'http://localhost:5172' },
  teacher: { name: 'Teacher', url: 'http://localhost:5173' },
  moderator: { name: 'Moderator', url: 'http://localhost:5174' },
  principal: { name: 'Principal', url: 'http://localhost:5175' }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'zync-principal',
    role: 'principal',
    port: PORT,
    dbConnected: getDbStatus()
  });
});

// Login
app.post('/api/auth/login', requireDb, async (req, res) => {
  try {
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

    // Role check: Creator portal accepts creator, principal and admin
    const allowed = ['creator', 'principal', 'admin'];
    if (!allowed.includes(user.role)) {
      const portal = PORTAL_MAP[user.role] || { name: user.role, url: '#' };
      return res.status(403).json({
        error: `Use the ${portal.name} portal`,
        portalName: portal.name,
        portalUrl: portal.url,
        role: user.role
      });
    }

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
    res.status(500).json({ error: 'Failed to process login request' });
  }
});

// Me profile
app.get('/api/auth/me', requireDb, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user || user.disabled) {
      return res.status(403).json({ error: 'User unavailable or disabled' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Institutional Analytics Overview (polled every 1000ms by principal screen)
app.get('/api/principal/overview', requireDb, requireAuth, async (req, res) => {
  try {
    const [
      totalTeachers,
      totalStudents,
      totalQuizzes,
      totalSlideDecks,
      totalGames,
      activeGames,
      totalAnswers,
      correctAnswers
    ] = await Promise.all([
      User.countDocuments({ role: 'teacher' }),
      Player.countDocuments(),
      Quiz.countDocuments(),
      SlideDeck.countDocuments(),
      Game.countDocuments(),
      Game.countDocuments({ status: { $ne: 'ended' } }),
      Answer.countDocuments(),
      Answer.countDocuments({ correct: true })
    ]);

    const accuracyRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    res.json({
      metrics: {
        totalTeachers,
        totalStudents,
        totalQuizzes,
        totalSlideDecks,
        totalSessions: totalGames,
        activeSessions: activeGames,
        totalAnswers,
        accuracyRate
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch executive overview' });
  }
});

// Teacher Performance & Activity Breakdown
app.get('/api/principal/teachers', requireDb, requireAuth, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('name email disabled createdAt');

    const teacherStats = await Promise.all(
      teachers.map(async (t) => {
        const [quizCount, gameCount] = await Promise.all([
          Quiz.countDocuments({ ownerId: t._id }),
          Game.countDocuments({ hostId: t._id })
        ]);

        return {
          _id: t._id,
          name: t.name,
          email: t.email,
          disabled: t.disabled,
          createdAt: t.createdAt,
          quizCount,
          gameCount
        };
      })
    );

    res.json(teacherStats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teacher statistics' });
  }
});

// Institutional Audit Logs
app.get('/api/principal/audit-logs', requireDb, requireAuth, async (req, res) => {
  try {
    const logs = await ModerationLog.find()
      .populate('moderatorId', 'name')
      .populate('playerId', 'nickname')
      .populate('gameId', 'pin type')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// =============================================================
// CREATOR PORTAL ENDPOINTS (QUIZZES & AVATARS)
// =============================================================

const AnimeCategory = require('./models/AnimeCategory');
const AnimeCharacter = require('./models/AnimeCharacter');
const Setting = require('./models/Setting');

// Get guardrails set by Admin
app.get('/api/creator/guardrails', requireDb, requireAuth, async (req, res) => {
  try {
    const allSettings = await Setting.find().lean();
    const guardrails = {
      maxQuestionDuration: 120,
      maxQuestionsCount: 50,
      maxPlayersPerGame: 100
    };
    allSettings.forEach((s) => {
      if (guardrails[s.key] !== undefined) {
        guardrails[s.key] = s.value;
      }
    });
    res.json(guardrails);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load guardrails' });
  }
});

// List Quizzes for Creator
app.get('/api/creator/quizzes', requireDb, requireAuth, async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('categoryId', 'name')
      .populate('ownerId', 'name email username')
      .sort({ updatedAt: -1 })
      .lean();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Create Quiz (enforcing guardrails)
app.post('/api/creator/quizzes', requireDb, requireAuth, async (req, res) => {
  try {
    const { title, categoryId, questions, lobbyCountdown } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Quiz title is required' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }

    // Check Admin Guardrails
    const allSettings = await Setting.find().lean();
    const settingsMap = { maxQuestionDuration: 120, maxQuestionsCount: 50 };
    allSettings.forEach((s) => { settingsMap[s.key] = s.value; });

    if (questions.length > settingsMap.maxQuestionsCount) {
      return res.status(400).json({
        error: `Exceeds max allowed questions (${settingsMap.maxQuestionsCount})`
      });
    }

    for (const q of questions) {
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ error: 'Each question must have text and at least 2 options' });
      }
      if (q.timeLimit && q.timeLimit > settingsMap.maxQuestionDuration) {
        return res.status(400).json({
          error: `Question duration cannot exceed ${settingsMap.maxQuestionDuration}s`
        });
      }
    }

    let catId = categoryId;
    if (!catId) {
      const defaultCat = await Category.findOne();
      catId = defaultCat ? defaultCat._id : null;
    }

    const quiz = await Quiz.create({
      title: title.trim(),
      categoryId: catId,
      ownerId: req.user.userId,
      lobbyCountdown: lobbyCountdown !== undefined ? lobbyCountdown : 5,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex || 0,
        timeLimit: Math.min(q.timeLimit || 30, settingsMap.maxQuestionDuration)
      })),
      lastEditedBy: req.user.userId
    });

    res.json(quiz);
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update Quiz
app.put('/api/creator/quizzes/:id', requireDb, requireAuth, async (req, res) => {
  try {
    const { title, categoryId, questions, lobbyCountdown } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    if (title) quiz.title = title.trim();
    if (categoryId) quiz.categoryId = categoryId;
    if (lobbyCountdown !== undefined) quiz.lobbyCountdown = lobbyCountdown;
    if (Array.isArray(questions)) {
      quiz.questions = questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex || 0,
        timeLimit: q.timeLimit || 30
      }));
    }
    quiz.lastEditedBy = req.user.userId;
    quiz.updatedAt = new Date();
    await quiz.save();

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete Quiz
app.delete('/api/creator/quizzes/:id', requireDb, requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// List Characters for Creator
app.get('/api/creator/characters', requireDb, requireAuth, async (req, res) => {
  try {
    const characters = await AnimeCharacter.find()
      .populate('categoryId', 'name color')
      .sort({ createdAt: -1 })
      .lean();
    res.json(characters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load characters' });
  }
});

// Create Character (Auto Pedestal / Palette, SVG or PNG)
app.post('/api/creator/characters', requireDb, requireAuth, async (req, res) => {
  try {
    const { name, categoryId, gender, svg, color, animeName } = req.body;
    if (!name || !svg) {
      return res.status(400).json({ error: 'Character name and graphic file are required' });
    }

    let catDoc = null;
    if (categoryId) {
      catDoc = await AnimeCategory.findById(categoryId);
    }
    if (!catDoc && animeName) {
      const slug = animeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      catDoc = await AnimeCategory.findOneAndUpdate(
        { animeId: slug },
        { name: animeName, animeId: slug, color: color || '#8B5CF6' },
        { upsert: true, new: true }
      );
    }
    if (!catDoc) {
      catDoc = await AnimeCategory.findOne();
    }

    // Auto-generate character ID
    const charId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const autoColor = color || (catDoc ? catDoc.color : '#8B5CF6');

    const character = await AnimeCharacter.findOneAndUpdate(
      { characterId: charId },
      {
        name: name.trim(),
        characterId: charId,
        categoryId: catDoc._id,
        animeId: catDoc.animeId,
        animeName: catDoc.name,
        gender: gender || 'male',
        svg,
        color: autoColor,
        themeGradient: `from-[${autoColor}]/20 to-black`,
        borderColor: `border-[${autoColor}]/30`,
        active: true,
        createdBy: req.user.userId
      },
      { upsert: true, new: true }
    );

    res.json(character);
  } catch (err) {
    console.error('Create character error:', err);
    res.status(500).json({ error: 'Failed to confirm character' });
  }
});

// Delete Character
app.delete('/api/creator/characters/:id', requireDb, requireAuth, async (req, res) => {
  try {
    const char = await AnimeCharacter.findByIdAndDelete(req.params.id);
    if (!char) return res.status(404).json({ error: 'Character not found' });
    res.json({ success: true, message: 'Character deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

// List Anime Categories
app.get('/api/creator/anime-categories', requireDb, requireAuth, async (req, res) => {
  try {
    const cats = await AnimeCategory.find().sort({ name: 1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Server listen
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`ZYNC Creator server running on port ${PORT}`);
    await connectDB();
  });
}

module.exports = app;

