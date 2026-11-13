require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, getDbStatus } = require('./db');

const User = require('./models/User');
const Game = require('./models/Game');
const Player = require('./models/Player');
const Quiz = require('./models/Quiz');
const SlideDeck = require('./models/SlideDeck');
const Presentation = require('./models/Presentation');
const Comment = require('./models/Comment');
const Confused = require('./models/Confused');
const Repeat = require('./models/Repeat');
const Doubt = require('./models/Doubt');
const ModerationLog = require('./models/ModerationLog');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token']
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
    app: 'zync-moderator',
    role: 'moderator',
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

    const allowed = ['moderator', 'admin', 'creator', 'principal', 'presentor', 'teacher'];
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
        email: user.email,
        access: user.access
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

// -------------------------------------------------------------
// MODERATION ENDPOINTS
// -------------------------------------------------------------

// Active games list
app.get('/api/games/active', requireDb, requireAuth, async (req, res) => {
  try {
    const games = await Game.find({ status: { $ne: 'ended' } })
      .populate('hostId', 'name')
      .sort({ createdAt: -1 });

    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active games' });
  }
});

// Moderation state for a game (polled every 1000ms by moderator view)
app.get('/api/games/:id/moderation-state', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    let presentation = null;
    let quiz = null;
    let confusedCount = 0;
    let repeatCount = 0;
    let doubts = [];

    if (game.type === 'quiz') {
      quiz = await Quiz.findById(game.refId);
    } else if (game.type === 'presentation') {
      presentation = await Presentation.findById(game.refId);
      confusedCount = await Confused.countDocuments({
        gameId: game._id,
        slideIndex: game.currentIndex
      });
      repeatCount = await Repeat.countDocuments({
        gameId: game._id,
        slideIndex: game.currentIndex
      });
      doubts = await Doubt.find({ gameId: game._id })
        .populate('playerId', 'nickname avatarConfig')
        .sort({ createdAt: -1 })
        .limit(30);
    }

    const allGamePlayers = await Player.find({ gameId: game._id }).sort({ joinedAt: 1 }).populate('avatarId');
    const waitingPlayers = allGamePlayers.filter((p) => p.status === 'waiting_approval');
    const activePlayers = allGamePlayers.filter((p) => p.status !== 'waiting_approval' && p.status !== 'declined');

    const comments = await Comment.find({ gameId: game._id })
      .populate('playerId', 'nickname avatarConfig')
      .sort({ createdAt: -1 })
      .limit(60);
    const logs = await ModerationLog.find({ gameId: game._id })
      .populate('moderatorId', 'name')
      .populate('playerId', 'nickname')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      game,
      quiz: quiz ? {
        _id: quiz._id,
        title: quiz.title,
        totalQuestions: quiz.questions?.length || 0
      } : null,
      presentation,
      waitingPlayers: waitingPlayers.map((p, idx) => ({
        _id: p._id,
        joinOrder: idx + 1,
        nickname: p.nickname,
        avatar: p.avatarId,
        avatarConfig: p.avatarConfig,
        joinedAt: p.joinedAt
      })),
      players: activePlayers.map((p) => ({
        _id: p._id,
        nickname: p.nickname,
        score: p.score,
        status: p.status,
        canComment: p.canComment !== false,
        warningCount: p.warningCount || 0,
        avatar: p.avatarId,
        avatarConfig: p.avatarConfig,
        joinedAt: p.joinedAt
      })),
      comments: comments.map((c) => ({
        _id: c._id,
        text: c.text,
        slideIndex: c.slideIndex,
        author: c.playerId?.nickname || 'Player',
        playerId: c.playerId?._id,
        removed: !!c.removed,
        createdAt: c.createdAt
      })),
      confusedCount,
      repeatCount,
      doubts,
      logs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load moderation state' });
  }
});

// Toggle student commenting access (Class Monitor role)
app.post('/api/moderation/toggle-commenting', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId, playerId, canComment } = req.body;
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    player.canComment = !!canComment;
    await player.save();

    const action = canComment ? 'unmute_commenting' : 'mute_commenting';
    await ModerationLog.create({
      gameId,
      moderatorId: req.user.userId,
      playerId,
      action,
      note: canComment ? 'Restored live commenting access' : 'Revoked live commenting access (Class Monitor)'
    });

    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle commenting access' });
  }
});

// Warn student
app.post('/api/moderation/warn-student', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId, playerId, note } = req.body;
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    player.warningCount = (player.warningCount || 0) + 1;
    if (player.warningCount >= 3) {
      player.canComment = false;
    }
    await player.save();

    await ModerationLog.create({
      gameId,
      moderatorId: req.user.userId,
      playerId,
      action: 'warn',
      note: note || `Issued warning #${player.warningCount}`
    });

    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: 'Failed to issue warning' });
  }
});

// Moderate player (mute, unmute, kick, ban)
app.post('/api/moderation/player-action', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId, playerId, action, note } = req.body;
    const validActions = ['mute', 'unmute', 'kick', 'ban'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid moderation action' });
    }

    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    // Set new player status
    if (action === 'mute') player.status = 'muted';
    else if (action === 'unmute') player.status = 'active';
    else if (action === 'kick') player.status = 'kicked';
    else if (action === 'ban') player.status = 'banned';

    await player.save();

    // Log moderation action
    await ModerationLog.create({
      gameId,
      moderatorId: req.user.userId,
      playerId,
      action,
      note: note || '',
      createdAt: new Date()
    });

    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute moderation action' });
  }
});

// Remove inappropriate comment
app.post('/api/moderation/remove-comment', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId, commentId, note } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    comment.removed = true;
    await comment.save();

    await ModerationLog.create({
      gameId,
      moderatorId: req.user.userId,
      playerId: comment.playerId,
      action: 'remove_comment',
      note: note || 'Removed inappropriate comment'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove comment' });
  }
});

// Supervisor: Admit waiting player
app.post('/api/moderation/admit', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId, playerId, all } = req.body;
    if (all) {
      await Player.updateMany(
        { gameId, status: 'waiting_approval' },
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

// Supervisor: Decline waiting player
app.post('/api/moderation/decline', requireDb, requireAuth, async (req, res) => {
  try {
    const { playerId } = req.body;
    if (playerId) {
      await Player.findByIdAndUpdate(playerId, { status: 'declined' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline player' });
  }
});

// Supervisor: Pause quiz
app.post('/api/moderation/pause', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Game.findById(gameId);
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

// Supervisor: Resume quiz
app.post('/api/moderation/resume', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Game.findById(gameId);
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

// Supervisor: Advance to next question
app.post('/api/moderation/next', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const quiz = await Quiz.findById(game.refId);
    const nextIndex = game.currentIndex + 1;
    if (quiz && nextIndex >= quiz.questions.length) {
      game.status = 'ended';
      game.endedAt = new Date();
    } else {
      game.status = 'question';
      game.currentIndex = nextIndex;
      game.questionStartedAt = new Date();
    }
    await game.save();
    res.json({ success: true, game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to advance game' });
  }
});

// Supervisor: End quiz
app.post('/api/moderation/end', requireDb, requireAuth, async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    game.status = 'ended';
    game.endedAt = new Date();
    await game.save();
    res.json({ success: true, game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// Slide decks list
app.get('/api/slides', requireDb, requireAuth, async (req, res) => {
  try {
    const decks = await SlideDeck.find().populate('ownerId', 'name').sort({ updatedAt: -1 });
    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load slide decks' });
  }
});

// Create slide deck
app.post('/api/slides', requireDb, requireAuth, async (req, res) => {
  try {
    const { title, slides } = req.body;
    if (!title || !Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ error: 'Title and slides are required' });
    }

    const deck = await SlideDeck.create({
      title: title.trim(),
      ownerId: req.user.userId,
      slides
    });

    res.status(201).json(deck);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create slide deck' });
  }
});

// Start slide presentation session
app.post('/api/slides/start', requireDb, requireAuth, async (req, res) => {
  try {
    const { deckId } = req.body;
    const deck = await SlideDeck.findById(deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    let pin;
    let exists = true;
    while (exists) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await Game.findOne({ pin, status: { $ne: 'ended' } });
      if (!existing) exists = false;
    }

    const game = await Game.create({
      type: 'slides',
      pin,
      hostId: req.user.userId,
      refId: deck._id,
      status: 'live',
      currentIndex: 0
    });

    res.json({ game, deck });
  } catch (err) {
    res.status(500).json({ error: 'Failed to launch presentation' });
  }
});

// Polling live slide presentation state (polled every 1000ms by projector)
app.get('/api/slides/:id/live-state', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Presentation game not found' });

    const deck = await SlideDeck.findById(game.refId);
    const confusedCount = await Confused.countDocuments({
      gameId: game._id,
      slideIndex: game.currentIndex
    });

    const comments = await Comment.find({
      gameId: game._id,
      slideIndex: game.currentIndex,
      removed: false
    })
      .populate('playerId', 'nickname')
      .sort({ createdAt: -1 })
      .limit(20);

    const playersCount = await Player.countDocuments({ gameId: game._id, status: { $ne: 'banned' } });

    res.json({
      game,
      deck,
      currentSlide: deck?.slides[game.currentIndex] || null,
      currentIndex: game.currentIndex,
      totalSlides: deck?.slides?.length || 0,
      confusedCount,
      comments: comments.map(c => ({
        _id: c._id,
        text: c.text,
        nickname: c.playerId?.nickname || 'Student',
        createdAt: c.createdAt
      })),
      playersCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve presentation state' });
  }
});

// Change active slide
app.post('/api/slides/:id/change-slide', requireDb, requireAuth, async (req, res) => {
  try {
    const { slideIndex } = req.body;
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.currentIndex = slideIndex;
    await game.save();

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change slide' });
  }
});

// End presentation
app.post('/api/slides/:id/end', requireDb, requireAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game.status = 'ended';
    game.endedAt = new Date();
    await game.save();

    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end presentation' });
  }
});

// Server listen
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`ZYNC Moderator and Slides server running on port ${PORT}`);
    await connectDB();
  });
}

module.exports = app;

