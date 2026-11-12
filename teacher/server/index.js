require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, getDbStatus } = require('./db');

const path = require('path');
const fs = require('fs');
const multer = require('multer');

const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Category = require('./models/Category');
const Game = require('./models/Game');
const Player = require('./models/Player');
const Answer = require('./models/Answer');
const Avatar = require('./models/Avatar');
const AnimeCategory = require('./models/AnimeCategory');
const AnimeCharacter = require('./models/AnimeCharacter');
const Presentation = require('./models/Presentation');
const Comment = require('./models/Comment');
const Confused = require('./models/Confused');
const Repeat = require('./models/Repeat');
const Doubt = require('./models/Doubt');
const ModerationLog = require('./models/ModerationLog');

const app = express();
const PORT = process.env.PORT || 5003;

// Configure disk storage for uploaded presentation materials
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads', 'presentations');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 } // 250MB maximum
});

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database readiness
function requireDb(req, res, next) {
  if (!getDbStatus()) {
    return res.status(503).json({ error: 'Database not configured yet' });
  }
  next();
}

// Staff authentication
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

// Role restriction (Presenter portal accepts presentor, teacher, admin, creator, principal)
function requireTeacherRole(req, res, next) {
  const allowed = ['presentor', 'teacher', 'admin', 'creator', 'principal'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Access denied: Presenter role required',
      role: req.user?.role
    });
  }
  next();
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
    app: 'zync-teacher',
    role: 'teacher',
    port: PORT,
    dbConnected: getDbStatus()
  });
});

// Dynamic Anime Characters & Categories (Shared from MongoDB)
app.get('/api/characters', requireDb, async (req, res) => {
  try {
    const [characters, categories] = await Promise.all([
      AnimeCharacter.find({ active: true }),
      AnimeCategory.find()
    ]);
    res.json({ characters, categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load characters' });
  }
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

    // Role verification
    const allowedRoles = ['presentor', 'teacher', 'admin', 'creator', 'principal'];
    if (!allowedRoles.includes(user.role)) {
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
        email: user.email,
        access: user.access
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process login request' });
  }
});

// Get user session
app.get('/api/auth/me', requireDb, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user || user.disabled) {
      return res.status(403).json({ error: 'User unavailable or disabled' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// Categories list
app.get('/api/categories', requireDb, requireAuth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// Quizzes list
app.get('/api/quizzes', requireDb, requireAuth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' || req.user.role === 'principal' 
      ? {} 
      : { ownerId: req.user.userId };

    const quizzes = await Quiz.find(query)
      .populate('categoryId', 'name')
      .populate('ownerId', 'name')
      .sort({ updatedAt: -1 });

    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Create Quiz
app.post('/api/quizzes', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const { title, categoryId, questions, lobbyCountdown } = req.body;

    if (!title || !categoryId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Title, category, and questions are required' });
    }

    const quiz = await Quiz.create({
      title: title.trim(),
      categoryId,
      ownerId: req.user.userId,
      questions,
      lobbyCountdown: lobbyCountdown !== undefined ? Number(lobbyCountdown) : 5,
      lastEditedBy: req.user.userId
    });

    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update / Edit Quiz Settings & Questions
app.put('/api/quizzes/:id', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const { title, categoryId, questions, lobbyCountdown } = req.body;
    const update = { lastEditedBy: req.user.userId, updatedAt: new Date() };

    if (title) update.title = title.trim();
    if (categoryId) update.categoryId = categoryId;
    if (Array.isArray(questions)) update.questions = questions;
    if (lobbyCountdown !== undefined) update.lobbyCountdown = Number(lobbyCountdown);

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete Quiz
app.delete('/api/quizzes/:id', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Create / Host Game Session
app.post('/api/games/create', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const { quizId } = req.body;
    if (!quizId) {
      return res.status(400).json({ error: 'Quiz ID is required to host a session' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Generate unique 6-digit PIN among non-ended games
    let pin;
    let exists = true;
    while (exists) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await Game.findOne({ pin, status: { $ne: 'ended' } });
      if (!existing) exists = false;
    }

    const game = await Game.create({
      type: 'quiz',
      pin,
      hostId: req.user.userId,
      refId: quiz._id,
      status: 'lobby',
      countdownDuration: quiz.lobbyCountdown !== undefined ? quiz.lobbyCountdown : 5,
      currentIndex: -1
    });

    res.json({ game, quiz });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create game session' });
  }
});

// Host Polling State (Polled every 1000ms by the Host Projector Screen)
app.get('/api/games/:id/host-state', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.type === 'presentation') {
      const presentation = await Presentation.findById(game.refId);
      const players = await Player.find({ gameId: game._id }).sort({ joinedAt: 1 }).populate('avatarId');

      const comments = await Comment.find({ gameId: game._id, removed: { $ne: true } })
        .populate('playerId', 'nickname avatarConfig')
        .sort({ createdAt: -1 })
        .limit(40);

      const confusedCount = await Confused.countDocuments({
        gameId: game._id,
        slideIndex: game.currentIndex
      });

      const repeatCount = await Repeat.countDocuments({
        gameId: game._id,
        slideIndex: game.currentIndex
      });

      const doubts = await Doubt.find({ gameId: game._id })
        .populate('playerId', 'nickname avatarConfig')
        .sort({ createdAt: -1 })
        .limit(30);

      return res.json({
        game,
        presentation,
        players: players.map((p, idx) => ({
          _id: p._id,
          joinOrder: idx + 1,
          nickname: p.nickname,
          score: p.score,
          status: p.status,
          canComment: p.canComment !== false,
          warningCount: p.warningCount || 0,
          avatar: p.avatarId,
          avatarConfig: p.avatarConfig,
          joinedAt: p.joinedAt
        })),
        totalPlayers: players.length,
        comments: comments.map(c => ({
          _id: c._id,
          text: c.text,
          slideIndex: c.slideIndex,
          playerId: c.playerId?._id,
          author: c.playerId?.nickname || 'Student',
          avatarConfig: c.playerId?.avatarConfig,
          createdAt: c.createdAt
        })),
        confusedCount,
        repeatCount,
        doubts: doubts.map(d => ({
          _id: d._id,
          text: d.text,
          slideIndex: d.slideIndex,
          status: d.status,
          author: d.playerId?.nickname || 'Student',
          createdAt: d.createdAt
        }))
      });
    }

    const quiz = await Quiz.findById(game.refId);
    
    // Fetch all players for this game
    const allGamePlayers = await Player.find({ gameId: game._id }).sort({ joinedAt: 1 }).populate('avatarId');
    const waitingPlayers = allGamePlayers.filter((p) => p.status === 'waiting_approval');
    const activePlayers = allGamePlayers.filter((p) => p.status === 'active' || p.status === 'muted');

    // Handle Countdown State Auto-Advance
    let countdownRemaining = null;
    if (game.status === 'countdown' && game.countdownStartedAt) {
      const elapsed = (Date.now() - new Date(game.countdownStartedAt).getTime()) / 1000;
      countdownRemaining = Math.max(0, Math.ceil((game.countdownDuration || 5) - elapsed));
      if (countdownRemaining <= 0) {
        game.status = 'question';
        game.currentIndex = 0;
        game.questionStartedAt = new Date();
        await game.save();
      }
    }

    let currentQuestion = null;
    let optionCounts = [0, 0, 0, 0];
    let topLeaderboard = [];
    let answeredCount = 0;

    if (game.currentIndex >= 0 && quiz && quiz.questions[game.currentIndex]) {
      currentQuestion = quiz.questions[game.currentIndex];

      const answers = await Answer.find({
        gameId: game._id,
        questionIndex: game.currentIndex
      });

      answeredCount = answers.length;
      answers.forEach(a => {
        if (a.choice >= 0 && a.choice <= 3) {
          optionCounts[a.choice]++;
        }
      });
    }

    // Top Leaderboard
    topLeaderboard = [...activePlayers]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(p => ({
        _id: p._id,
        nickname: p.nickname,
        score: p.score,
        avatar: p.avatarId,
        avatarConfig: p.avatarConfig
      }));

    res.json({
      game,
      quiz: {
        _id: quiz?._id,
        title: quiz?.title,
        totalQuestions: quiz?.questions?.length || 0,
        lobbyCountdown: quiz?.lobbyCountdown || 5
      },
      countdownRemaining,
      countdownDuration: game.countdownDuration || 5,
      currentQuestion,
      optionCounts,
      answeredCount,
      totalPlayers: activePlayers.length,
      waitingPlayers: waitingPlayers.map((p, idx) => ({
        _id: p._id,
        joinOrder: idx + 1,
        nickname: p.nickname,
        avatar: p.avatarId,
        avatarConfig: p.avatarConfig,
        joinedAt: p.joinedAt
      })),
      players: activePlayers.map((p, idx) => ({
        _id: p._id,
        joinOrder: idx + 1,
        nickname: p.nickname,
        score: p.score,
        status: p.status,
        avatar: p.avatarId,
        avatarConfig: p.avatarConfig,
        joinedAt: p.joinedAt
      })),
      topLeaderboard
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve host state' });
  }
});

// Admit single or all waiting players
app.post('/api/games/:id/admit', requireDb, requireAuth, async (req, res) => {
  try {
    const { playerId, all } = req.body || {};
    if (all) {
      await Player.updateMany(
        { gameId: req.params.id, status: 'waiting_approval' },
        { status: 'active' }
      );
    } else if (playerId) {
      await Player.findByIdAndUpdate(playerId, { status: 'active' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to admit player' });
  }
});

// Decline waiting player
app.post('/api/games/:id/decline', requireDb, requireAuth, async (req, res) => {
  try {
    const { playerId } = req.body || {};
    if (playerId) {
      await Player.findByIdAndUpdate(playerId, { status: 'declined' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline player' });
  }
});

// Kick player from live game
app.post('/api/games/:id/kick', requireDb, requireAuth, async (req, res) => {
  try {
    const { playerId } = req.body || {};
    if (playerId) {
      await Player.findByIdAndUpdate(playerId, { status: 'kicked' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to kick player' });
  }
});

// Ban player
app.post('/api/games/:id/ban', requireDb, requireAuth, async (req, res) => {
  try {
    const { playerId } = req.body || {};
    if (playerId) {
      const p = await Player.findByIdAndUpdate(playerId, { status: 'banned' });
      if (p && p.userId) {
        await User.findByIdAndUpdate(p.userId, { disabled: true });
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban player' });
  }
});

// Pause / Resume Quiz Game
app.post('/api/games/:id/pause', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.status !== 'paused') {
      game.pausedFromStatus = game.status;
      game.status = 'paused';
      await game.save();
    }
    res.json({ success: true, game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pause game' });
  }
});

app.post('/api/games/:id/resume', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.status === 'paused') {
      game.status = game.pausedFromStatus || 'question';
      game.pausedFromStatus = null;
      await game.save();
    }
    res.json({ success: true, game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resume game' });
  }
});

// Start Game (initiates countdown or direct start)
app.post('/api/games/:id/start', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const quiz = await Quiz.findById(game.refId);

    const { bypass } = req.body || {};
    const countdownSec = quiz?.lobbyCountdown !== undefined ? quiz.lobbyCountdown : (game.countdownDuration || 5);

    if (bypass || countdownSec <= 0) {
      game.status = 'question';
      game.currentIndex = 0;
      game.questionStartedAt = new Date();
    } else {
      game.status = 'countdown';
      game.countdownDuration = countdownSec;
      game.countdownStartedAt = new Date();
    }
    await game.save();

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Bypass Waiting Time / Quick-Start Directly
app.post('/api/games/:id/bypass', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.status = 'question';
    game.currentIndex = 0;
    game.questionStartedAt = new Date();
    await game.save();

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bypass countdown' });
  }
});

// Reveal Results
app.post('/api/games/:id/reveal', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.status = 'results';
    await game.save();

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reveal results' });
  }
});

// Next Question
app.post('/api/games/:id/next', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const quiz = await Quiz.findById(game.refId);
    const nextIndex = game.currentIndex + 1;

    if (nextIndex >= quiz.questions.length) {
      game.status = 'ended';
      game.endedAt = new Date();
    } else {
      game.status = 'question';
      game.currentIndex = nextIndex;
      game.questionStartedAt = new Date();
    }

    await game.save();
    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to advance game' });
  }
});

// End Game
app.post('/api/games/:id/end', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.status = 'ended';
    game.endedAt = new Date();
    await game.save();

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// ---------------------------------------------------------------------------
// PRESENTATION & CLASSROOM INTERACTION ENDPOINTS
// ---------------------------------------------------------------------------

// List Presentations
app.get('/api/presentations', requireDb, requireAuth, async (req, res) => {
  try {
    const presentations = await Presentation.find().sort({ createdAt: -1 });
    res.json(presentations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch presentations' });
  }
});

// Upload Presentation (PDF, MP4, WebM, etc.)
app.post('/api/presentations/upload', requireDb, requireAuth, requireTeacherRole, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { title, totalSlides } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let type = 'pdf';
    if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) {
      type = 'video';
    } else if (['.ppt', '.pptx'].includes(ext)) {
      type = 'slides';
    }

    const fileUrl = `http://localhost:${PORT}/uploads/presentations/${req.file.filename}`;
    const presentation = await Presentation.create({
      title: (title || req.file.originalname.replace(/\.[^/.]+$/, '')).trim(),
      type,
      fileUrl,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      totalSlides: parseInt(totalSlides, 10) || (type === 'video' ? 1 : 10),
      teacherId: req.user.userId
    });

    res.status(201).json(presentation);
  } catch (err) {
    console.error('Presentation upload error:', err);
    res.status(500).json({ error: 'Failed to upload presentation' });
  }
});

// Create YouTube Presentation
app.post('/api/presentations/youtube', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const { title, youtubeUrl } = req.body;
    if (!youtubeUrl) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const ytMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
    const videoId = ytMatch ? ytMatch[1] : null;

    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a standard YouTube video link.' });
    }

    const presentation = await Presentation.create({
      title: (title || 'YouTube Presentation').trim(),
      type: 'youtube',
      externalUrl: youtubeUrl,
      youtubeVideoId: videoId,
      totalSlides: 1,
      teacherId: req.user.userId
    });

    res.status(201).json(presentation);
  } catch (err) {
    console.error('Save YouTube presentation error:', err);
    res.status(500).json({ error: 'Failed to save YouTube presentation' });
  }
});

// Delete Presentation
app.delete('/api/presentations/:id', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) return res.status(404).json({ error: 'Presentation not found' });

    if (presentation.filePath && fs.existsSync(presentation.filePath)) {
      try { fs.unlinkSync(presentation.filePath); } catch (e) { /* ignore cleanup error */ }
    }
    await Presentation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete presentation' });
  }
});

// Host Presentation
app.post('/api/presentations/:id/host', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) return res.status(404).json({ error: 'Presentation not found' });

    // End previous active games hosted by this teacher
    await Game.updateMany({ hostId: req.user.userId, status: { $nin: ['ended'] } }, { status: 'ended' });

    let pin = '';
    let isUnique = false;
    while (!isUnique) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await Game.findOne({ pin, status: { $nin: ['ended'] } });
      if (!existing) isUnique = true;
    }

    const game = await Game.create({
      type: 'presentation',
      pin,
      hostId: req.user.userId,
      refId: presentation._id,
      status: 'lobby',
      currentIndex: 0
    });

    res.status(201).json({ game, presentation });
  } catch (err) {
    console.error('Host presentation error:', err);
    res.status(500).json({ error: 'Failed to host presentation' });
  }
});

// Start Live Presentation from Lobby
app.post('/api/presentations/:id/start', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.status = 'live';
    game.currentIndex = 0;
    await game.save();

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start presentation' });
  }
});

// Change Slide
app.post('/api/presentations/:id/slide', requireDb, requireAuth, requireTeacherRole, async (req, res) => {
  try {
    const { slideIndex } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.currentIndex = typeof slideIndex === 'number' ? Math.max(0, slideIndex) : game.currentIndex;
    await game.save();

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change slide' });
  }
});

// Live State Polling for Presentation
app.get('/api/presentations/:id/live-state', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Presentation game not found' });

    const presentation = await Presentation.findById(game.refId);
    const players = await Player.find({ gameId: game._id }).sort({ joinedAt: 1 }).populate('avatarId');

    // Floating Danmaku comments
    const comments = await Comment.find({ gameId: game._id, removed: { $ne: true } })
      .populate('playerId', 'nickname avatarConfig')
      .sort({ createdAt: -1 })
      .limit(40);

    // Confusion count on current slide
    const confusedCount = await Confused.countDocuments({
      gameId: game._id,
      slideIndex: game.currentIndex
    });

    // Repeat count on current slide
    const repeatCount = await Repeat.countDocuments({
      gameId: game._id,
      slideIndex: game.currentIndex
    });

    // Doubts submitted
    const doubts = await Doubt.find({ gameId: game._id })
      .populate('playerId', 'nickname avatarConfig')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      game,
      presentation,
      players: players.map((p, idx) => ({
        _id: p._id,
        joinOrder: idx + 1,
        nickname: p.nickname,
        score: p.score,
        status: p.status,
        canComment: p.canComment !== false,
        warningCount: p.warningCount || 0,
        avatar: p.avatarId,
        avatarConfig: p.avatarConfig,
        joinedAt: p.joinedAt
      })),
      totalPlayers: players.length,
      comments: comments.map(c => ({
        _id: c._id,
        text: c.text,
        slideIndex: c.slideIndex,
        playerId: c.playerId?._id,
        author: c.playerId?.nickname || 'Student',
        avatarConfig: c.playerId?.avatarConfig,
        createdAt: c.createdAt
      })),
      confusedCount,
      repeatCount,
      doubts: doubts.map(d => ({
        _id: d._id,
        text: d.text,
        slideIndex: d.slideIndex,
        status: d.status,
        author: d.playerId?.nickname || 'Student',
        createdAt: d.createdAt
      }))
    });
  } catch (err) {
    console.error('Presentation live-state error:', err);
    res.status(500).json({ error: 'Failed to fetch presentation state' });
  }
});

// Resolve Doubt
app.post('/api/presentations/:id/resolve-doubt', requireDb, requireAuth, async (req, res) => {
  try {
    const { doubtId, status } = req.body;
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) return res.status(404).json({ error: 'Doubt not found' });

    doubt.status = status || 'answered';
    await doubt.save();

    res.json({ success: true, doubt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve doubt' });
  }
});

// Server listen
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`ZYNC Teacher server running on port ${PORT}`);
    await connectDB();
  });
}

module.exports = app;

