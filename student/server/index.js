require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { connectDB, getDbStatus } = require('./db');

const bcrypt = require('bcryptjs');
const Student = require('./models/Student');
const User = require('./models/User');
const AnimeCategory = require('./models/AnimeCategory');
const AnimeCharacter = require('./models/AnimeCharacter');
const Game = require('./models/Game');
const Player = require('./models/Player');
const Quiz = require('./models/Quiz');
const SlideDeck = require('./models/SlideDeck');
const Presentation = require('./models/Presentation');
const Answer = require('./models/Answer');
const Comment = require('./models/Comment');
const Confused = require('./models/Confused');
const Repeat = require('./models/Repeat');
const Doubt = require('./models/Doubt');
const Setting = require('./models/Setting');

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'zync_shared_jwt_secret_key_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token']
}));

app.use(express.json());

// Database readiness
async function requireDb(req, res, next) {
  if (!getDbStatus()) {
    await connectDB().catch(() => {});
  }
  if (!getDbStatus()) {
    return res.status(503).json({ error: 'Database not configured yet' });
  }
  next();
}

// Student JWT Auth Middleware
function requireStudentAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Student authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.studentUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired student session' });
  }
}

// Student session authentication for in-game requests
async function requirePlayer(req, res, next) {
  let token = req.headers['x-session-token'];
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Session token required' });
  }

  try {
    const player = await Player.findOne({ sessionToken: token });
    if (!player) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    if (player.status === 'waiting_approval') {
      return res.json({
        waiting: true,
        status: 'waiting_approval',
        nickname: player.nickname,
        message: 'Waiting for presenter or moderator to admit you into the lobby...'
      });
    }

    if (player.status === 'declined') {
      return res.status(403).json({
        error: 'Admission request was declined by host',
        status: 'declined'
      });
    }

    if (player.status === 'kicked' || player.status === 'banned') {
      return res.status(403).json({
        error: 'You were removed from this game',
        status: player.status
      });
    }

    req.player = player;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to authenticate player session' });
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'zync-student',
    role: 'student',
    port: PORT,
    dbConnected: getDbStatus()
  });
});

// Helper: Generate playful random username
function generateFunUsername() {
  const prefixes = [
    'Cosmic', 'Pixel', 'Neon', 'Turbo', 'Cyber', 'Quantum', 'Star',
    'Sonic', 'Flash', 'Alpha', 'Shadow', 'Solar', 'Lunar', 'Thunder', 'Apex'
  ];
  const nouns = [
    'Fox', 'Knight', 'Falcon', 'Panda', 'Tiger', 'Eagle', 'Dragon',
    'Wizard', 'Cheetah', 'Wolf', 'Ranger', 'Striker', 'Phoenix', 'Ninja', 'Rider'
  ];
  const num = Math.floor(10 + Math.random() * 90);
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${p}${n}${num}`;
}

// Helper: Generate randomized unique avatar outfit on first login
function generateRandomAvatarConfig() {
  const skins = ['#FFDFD3', '#F5C7A9', '#D4A373', '#A9714B', '#7B4B28', '#462B17', '#67E8F9', '#D8B4FE'];
  const hairStyles = ['curly', 'buzz', 'ponytail', 'undercut', 'spiky', 'afro', 'wavy'];
  const hairColors = ['#24252D', '#4A2E1B', '#E6BE68', '#A03522', '#FF85A1', '#00E5FF', '#8B5CF6', '#CBD5E1'];
  const expressions = ['smile', 'winking', 'cool', 'cheerful', 'focused', 'surprised'];
  const topTypes = ['hoodie', 'tshirt', 'jacket', 'jersey', 'formal'];
  const topColors = ['#5E5CE6', '#0A84FF', '#06B6D4', '#30D158', '#FF9F0A', '#FF453A', '#EC4899', '#18181B'];
  const bottomTypes = ['jeans', 'joggers', 'shorts', 'skirt'];
  const bottomColors = ['#1E293B', '#2563EB', '#0F172A', '#64748B', '#78716C'];
  const shoesTypes = ['sneakers', 'highTops', 'boots', 'slides'];
  const accessories = ['none', 'none', 'glasses', 'sunglasses', 'headphones', 'cap', 'beanie', 'crown', 'halo'];

  const animePresets = ['naruto', 'sasuke', 'sakura', 'obito', 'itachi', 'kakashi'];

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  return {
    skinColor: rand(skins),
    hairStyle: rand(hairStyles),
    hairColor: rand(hairColors),
    faceExpression: rand(expressions),
    topType: rand(topTypes),
    topColor: rand(topColors),
    bottomType: rand(bottomTypes),
    bottomColor: rand(bottomColors),
    shoesType: rand(shoesTypes),
    shoesColor: '#F8FAFC',
    accessory: rand(accessories),
    presetOutfit: rand(animePresets)
  };
}

// -------------------------------------------------------------
// GOOGLE AUTH & STUDENT PROFILE
// -------------------------------------------------------------

// Dynamic Characters & Anime Universes from MongoDB
app.get(['/api/student/characters', '/student/characters'], requireDb, async (req, res) => {
  try {
    const [categories, characters] = await Promise.all([
      AnimeCategory.find().sort({ name: 1 }).lean(),
      AnimeCharacter.find({ active: true }).sort({ createdAt: 1 }).lean()
    ]);
    res.json({ categories: categories || [], characters: characters || [] });
  } catch (err) {
    console.error('Fetch student characters error:', err);
    res.status(500).json({ error: 'Failed to retrieve characters' });
  }
});

// Generate new unique random username
app.get(['/api/student/generate-username', '/student/generate-username'], (req, res) => {
  res.json({ username: generateFunUsername() });
});

// Generate new random avatar configuration (uses MongoDB dynamic characters if present)
app.get(['/api/student/generate-avatar', '/student/generate-avatar'], async (req, res) => {
  try {
    const chars = await AnimeCharacter.find({ active: true }).select('characterId').lean();
    const presetOutfit = chars.length > 0
      ? chars[Math.floor(Math.random() * chars.length)].characterId
      : 'naruto';
    const config = generateRandomAvatarConfig();
    config.presetOutfit = presetOutfit;
    res.json({ avatarConfig: config });
  } catch (err) {
    res.json({ avatarConfig: generateRandomAvatarConfig() });
  }
});

// Register new student account
app.post('/api/auth/register', requireDb, async (req, res) => {
  try {
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
      avatarConfig: generateRandomAvatarConfig(),
      lastOnline: new Date()
    });

    const token = jwt.sign(
      {
        userId: newUser._id,
        studentId: newUser._id,
        username: newUser.username,
        role: newUser.role,
        name: newUser.name
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      student: {
        _id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        avatarConfig: newUser.avatarConfig,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login student account
app.post('/api/auth/login', requireDb, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.disabled) {
      return res.status(403).json({ error: 'Account has been disabled / banned' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    user.lastOnline = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        studentId: user._id,
        username: user.username || user.name,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      student: {
        _id: user._id,
        username: user.username || user.name,
        name: user.name,
        avatarConfig: user.avatarConfig || generateRandomAvatarConfig(),
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Google OAuth Login / Signup Fallback
app.post('/api/auth/google', requireDb, async (req, res) => {
  try {
    const { credential, demoUser } = req.body;
    let email = '';
    let name = '';

    if (credential && googleClient) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email.toLowerCase().trim();
        name = payload.name;
      } catch (verifyErr) {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          email = decoded.email.toLowerCase().trim();
          name = decoded.name || 'User';
        } else {
          return res.status(400).json({ error: 'Invalid Google credential token' });
        }
      }
    } else if (demoUser && demoUser.email) {
      email = demoUser.email.toLowerCase().trim();
      name = demoUser.name || 'Demo User';
    } else {
      return res.status(400).json({ error: 'Google credential or demo user profile required' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      let baseUName = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (baseUName.length < 3) baseUName = 'user_' + Date.now().toString().slice(-4);
      let username = baseUName;
      let exists = await User.findOne({ username });
      while (exists) {
        username = `${baseUName}_${Math.floor(10 + Math.random() * 90)}`;
        exists = await User.findOne({ username });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Demo@123', salt);

      user = await User.create({
        username,
        email,
        name,
        passwordHash,
        role: 'user',
        avatarConfig: generateRandomAvatarConfig(),
        lastOnline: new Date()
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        studentId: user._id,
        email: user.email,
        name: user.name,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      student: {
        _id: user._id,
        username: user.username,
        name: user.name,
        avatarConfig: user.avatarConfig,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Failed to authenticate via Google' });
  }
});

// Get Student Me
app.get(['/api/student/me', '/student/me'], requireDb, requireStudentAuth, async (req, res) => {
  try {
    const id = req.studentUser.userId || req.studentUser.studentId;
    let user = await User.findById(id).select('-passwordHash');
    if (!user) {
      user = await Student.findById(id);
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.lastOnline = new Date();
    await user.save();

    res.json({
      student: {
        _id: user._id,
        username: user.username || user.name,
        name: user.name,
        avatarConfig: user.avatarConfig || generateRandomAvatarConfig(),
        role: user.role || 'user'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Update Student Profile (Username and/or Wardrobe Avatar Config)
app.put(['/api/student/profile', '/student/profile'], requireDb, requireStudentAuth, async (req, res) => {
  try {
    const id = req.studentUser.userId || req.studentUser.studentId;
    const { username, avatarConfig } = req.body;
    let user = await User.findById(id);
    if (!user) {
      user = await Student.findById(id);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username && username.toLowerCase().trim() !== (user.username || '')) {
      const cleanUsername = username.toLowerCase().trim();
      if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
        return res.status(400).json({
          error: 'Username must be 3-24 characters and only contain lowercase letters, numbers, and underscores (_)'
        });
      }
      const duplicate = await User.findOne({
        username: cleanUsername,
        _id: { $ne: user._id }
      });
      if (duplicate) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      user.username = cleanUsername;
      user.name = cleanUsername;
    }

    if (avatarConfig && typeof avatarConfig === 'object') {
      user.avatarConfig = {
        ...(user.avatarConfig || {}),
        ...avatarConfig
      };
    }

    await user.save();
    res.json({
      student: {
        _id: user._id,
        username: user.username || user.name,
        name: user.name,
        avatarConfig: user.avatarConfig,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// -------------------------------------------------------------
// GAME JOIN & REAL-TIME CONTROLLER
// -------------------------------------------------------------

// Join Game Room
app.post('/api/join', requireDb, async (req, res) => {
  try {
    const { pin, nickname, avatarConfig, studentId } = req.body;

    if (!pin || !nickname) {
      return res.status(400).json({ error: 'PIN and nickname are required' });
    }

    const joinSetting = await Setting.findOne({ key: 'joinEnabled' });
    if (joinSetting && joinSetting.value === false) {
      return res.status(403).json({ error: 'Game joining is currently disabled by administrator' });
    }

    const cleanPin = pin.toString().trim();
    const cleanNickname = nickname.trim();

    const game = await Game.findOne({ pin: cleanPin });
    if (!game) {
      return res.status(404).json({ error: 'Game not found with this PIN' });
    }

    if (game.status === 'ended') {
      return res.status(400).json({ error: 'This game has already ended' });
    }

    // Check duplicate nicknames
    const existingPlayers = await Player.find({ gameId: game._id });
    const duplicate = existingPlayers.find(
      (p) => p.nickname.toLowerCase() === cleanNickname.toLowerCase()
    );

    if (duplicate) {
      if (duplicate.status === 'banned') {
        return res.status(403).json({ error: 'You are banned from this game' });
      }
      if (duplicate.status === 'kicked') {
        return res.status(403).json({ error: 'You were removed from this game' });
      }
      if (duplicate.status === 'left') {
        await Player.findByIdAndDelete(duplicate._id);
      } else if (game.status === 'lobby' || duplicate.status === 'waiting_approval') {
        const newSessionToken = crypto.randomUUID();
        duplicate.sessionToken = newSessionToken;
        if (studentId) duplicate.userId = studentId;
        if (avatarConfig) duplicate.avatarConfig = avatarConfig;
        duplicate.status = 'waiting_approval';
        duplicate.joinedAt = new Date();
        await duplicate.save();

        return res.json({
          waiting: true,
          player: {
            _id: duplicate._id,
            nickname: duplicate.nickname,
            avatarConfig: duplicate.avatarConfig,
            sessionToken: duplicate.sessionToken,
            status: duplicate.status,
            score: duplicate.score
          },
          game: {
            _id: game._id,
            pin: game.pin,
            type: game.type,
            status: game.status
          }
        });
      } else {
        // In live game, if it's the same student reconnecting
        if (studentId && duplicate.userId && duplicate.userId.toString() === studentId.toString()) {
          const newSessionToken = crypto.randomUUID();
          duplicate.sessionToken = newSessionToken;
          duplicate.status = 'active';
          await duplicate.save();

          return res.json({
            player: {
              _id: duplicate._id,
              nickname: duplicate.nickname,
              avatarConfig: duplicate.avatarConfig,
              sessionToken: duplicate.sessionToken,
              score: duplicate.score
            },
            game: {
              _id: game._id,
              pin: game.pin,
              type: game.type,
              status: game.status
            }
          });
        }
        return res.status(409).json({ error: 'Nickname is already taken in this game' });
      }
    }

    const sessionToken = crypto.randomUUID();
    const player = await Player.create({
      gameId: game._id,
      userId: studentId || null,
      studentId: studentId || null,
      nickname: cleanNickname,
      avatarConfig: avatarConfig || null,
      sessionToken,
      status: 'waiting_approval',
      score: 0,
      rank: existingPlayers.length + 1,
      previousRank: existingPlayers.length + 1,
      joinedAt: new Date()
    });

    res.json({
      waiting: true,
      player: {
        _id: player._id,
        nickname: player.nickname,
        avatarConfig: player.avatarConfig,
        sessionToken: player.sessionToken,
        status: player.status,
        score: player.score
      },
      game: {
        _id: game._id,
        pin: game.pin,
        type: game.type,
        status: game.status
      }
    });
  } catch (err) {
    console.error('Join error:', err);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Real-Time Polling Endpoint (polled every 1000ms by student screen)
app.get('/api/game/state', requireDb, requirePlayer, async (req, res) => {
  try {
    const player = req.player;
    const game = await Game.findById(player.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Fetch all players in this game for lobby & leaderboard
    const allPlayers = await Player.find({ gameId: game._id, status: { $ne: 'banned' } }).sort({ joinedAt: 1 });
    const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);

    // Compute live rank
    const currentRank = sortedPlayers.findIndex(p => p._id.toString() === player._id.toString()) + 1;
    const rankDelta = (player.previousRank || currentRank) - currentRank;

    if (game.status === 'ended') {
      const top3 = sortedPlayers.slice(0, 3).map((p, idx) => ({
        rank: idx + 1,
        nickname: p.nickname,
        score: p.score,
        avatarConfig: p.avatarConfig
      }));

      return res.json({
        status: 'ended',
        type: game.type,
        finalScore: player.score,
        finalRank: currentRank,
        podium: top3,
        allParticipants: sortedPlayers.map(p => ({
          _id: p._id,
          nickname: p.nickname,
          score: p.score,
          avatarConfig: p.avatarConfig
        }))
      });
    }

    if (game.type === 'quiz') {
      if (game.status === 'lobby') {
        return res.json({
          status: 'lobby',
          type: 'quiz',
          pin: game.pin,
          countdownDuration: game.countdownDuration || 5,
          joinedPlayers: allPlayers.map((p, idx) => ({
            _id: p._id,
            joinOrder: idx + 1,
            nickname: p.nickname,
            avatarConfig: p.avatarConfig
          })),
          player: {
            nickname: player.nickname,
            score: player.score,
            status: player.status,
            avatarConfig: player.avatarConfig
          }
        });
      }

      if (game.status === 'countdown') {
        const duration = game.countdownDuration || 5;
        let countdownRemaining = duration;
        if (game.countdownStartedAt) {
          const elapsed = (Date.now() - new Date(game.countdownStartedAt).getTime()) / 1000;
          countdownRemaining = Math.max(0, Math.ceil(duration - elapsed));
        }

        if (countdownRemaining <= 0) {
          game.status = 'question';
          game.currentIndex = 0;
          game.questionStartedAt = new Date();
          await game.save();
        } else {
          return res.json({
            status: 'countdown',
            type: 'quiz',
            pin: game.pin,
            countdownDuration: duration,
            countdownRemaining,
            joinedPlayers: allPlayers.map((p, idx) => ({
              _id: p._id,
              joinOrder: idx + 1,
              nickname: p.nickname,
              avatarConfig: p.avatarConfig
            })),
            player: {
              nickname: player.nickname,
              score: player.score,
              status: player.status,
              avatarConfig: player.avatarConfig
            }
          });
        }
      }

      if (game.status === 'question') {
        const quiz = await Quiz.findById(game.refId);
        if (!quiz || !quiz.questions[game.currentIndex]) {
          return res.status(500).json({ error: 'Question data unavailable' });
        }

        const q = quiz.questions[game.currentIndex];
        const timeElapsed = (Date.now() - new Date(game.questionStartedAt).getTime()) / 1000;
        const timeRemaining = Math.max(0, q.timeLimit - timeElapsed);

        const existingAnswer = await Answer.findOne({
          gameId: game._id,
          playerId: player._id,
          questionIndex: game.currentIndex
        });

        // Anti-Cheat: NO question text, NO option text, NO correctIndex sent to phones
        return res.json({
          status: 'question',
          type: 'quiz',
          currentIndex: game.currentIndex,
          totalQuestions: quiz.questions.length,
          timeLimit: q.timeLimit,
          timeRemaining: Math.round(timeRemaining),
          questionStartedAt: game.questionStartedAt,
          hasAnswered: !!existingAnswer,
          answerChoice: existingAnswer ? existingAnswer.choice : null,
          player: {
            nickname: player.nickname,
            score: player.score,
            status: player.status
          }
        });
      }

      if (game.status === 'results') {
        const quiz = await Quiz.findById(game.refId);
        const currentQ = quiz ? quiz.questions[game.currentIndex] : null;

        const myAnswer = await Answer.findOne({
          gameId: game._id,
          playerId: player._id,
          questionIndex: game.currentIndex
        });

        // Answer stats matrix: counts of options picked
        const allAnswers = await Answer.find({
          gameId: game._id,
          questionIndex: game.currentIndex
        });

        const optionCounts = [0, 0, 0, 0];
        allAnswers.forEach(a => {
          if (a.choice >= 0 && a.choice <= 3) optionCounts[a.choice]++;
        });

        // Top leaderboard for screen 6
        const leaderboard = sortedPlayers.slice(0, 5).map((p, idx) => ({
          rank: idx + 1,
          _id: p._id,
          nickname: p.nickname,
          score: p.score,
          avatarConfig: p.avatarConfig,
          delta: (p.previousRank || (idx + 1)) - (idx + 1)
        }));

        return res.json({
          status: 'results',
          type: 'quiz',
          currentIndex: game.currentIndex,
          totalQuestions: quiz?.questions?.length || 10,
          hasAnswered: !!myAnswer,
          correct: myAnswer ? myAnswer.correct : false,
          pointsEarned: myAnswer ? myAnswer.points : 0,
          score: player.score,
          correctIndex: currentQ ? currentQ.correctIndex : 0,
          optionCounts,
          totalAnswers: allAnswers.length,
          leaderboard,
          playerRank: currentRank,
          rankDelta
        });
      }
    }

    if (game.type === 'presentation') {
      const presentation = await Presentation.findById(game.refId);
      const comments = await Comment.find({ gameId: game._id, removed: { $ne: true } })
        .populate('playerId', 'nickname')
        .sort({ createdAt: -1 })
        .limit(30);

      const confusedCount = await Confused.countDocuments({
        gameId: game._id,
        slideIndex: game.currentIndex
      });

      const repeatCount = await Repeat.countDocuments({
        gameId: game._id,
        slideIndex: game.currentIndex
      });

      return res.json({
        status: game.status,
        type: 'presentation',
        currentIndex: game.currentIndex,
        presentation: {
          _id: presentation?._id,
          title: presentation?.title,
          type: presentation?.type,
          fileUrl: presentation?.fileUrl,
          externalUrl: presentation?.externalUrl,
          youtubeVideoId: presentation?.youtubeVideoId,
          totalSlides: presentation?.totalSlides || 1
        },
        player: {
          _id: player._id,
          nickname: player.nickname,
          status: player.status,
          canComment: player.canComment !== false,
          warningCount: player.warningCount || 0
        },
        comments: comments.map(c => ({
          _id: c._id,
          text: c.text,
          author: c.playerId?.nickname || 'Student',
          slideIndex: c.slideIndex,
          createdAt: c.createdAt
        })),
        confusedCount,
        repeatCount
      });
    }

    if (game.type === 'slides') {
      const slideDeck = await SlideDeck.findById(game.refId);
      const totalSlides = slideDeck ? slideDeck.slides.length : 0;
      const currentSlide = slideDeck && slideDeck.slides[game.currentIndex] ? slideDeck.slides[game.currentIndex] : null;

      return res.json({
        status: 'live',
        type: 'slides',
        currentIndex: game.currentIndex,
        totalSlides,
        slide: currentSlide ? { title: currentSlide.title, body: currentSlide.body } : null,
        player: {
          nickname: player.nickname,
          status: player.status
        }
      });
    }

    res.json({
      status: game.status,
      type: game.type,
      player: {
        nickname: player.nickname,
        score: player.score,
        status: player.status
      }
    });
  } catch (err) {
    console.error('State polling error:', err);
    res.status(500).json({ error: 'Failed to retrieve game state' });
  }
});

// Submit Answer
app.post('/api/answer', requireDb, requirePlayer, async (req, res) => {
  try {
    const { questionIndex, choice } = req.body;
    const player = req.player;

    if (choice === undefined || choice < 0 || choice > 3) {
      return res.status(400).json({ error: 'Invalid answer choice (0..3)' });
    }

    const game = await Game.findById(player.gameId);
    if (!game || game.status !== 'question') {
      return res.status(400).json({ error: 'Question is not currently active' });
    }

    if (game.currentIndex !== questionIndex) {
      return res.status(400).json({ error: 'Question index mismatch' });
    }

    const existing = await Answer.findOne({
      gameId: game._id,
      playerId: player._id,
      questionIndex
    });

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted an answer for this question' });
    }

    const quiz = await Quiz.findById(game.refId);
    const q = quiz.questions[questionIndex];
    if (!q) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const now = Date.now();
    const startedAt = new Date(game.questionStartedAt).getTime();
    const timeMs = Math.max(0, now - startedAt);
    const maxMs = q.timeLimit * 1000;

    const isCorrect = choice === q.correctIndex;
    const isLate = timeMs > maxMs;

    let points = 0;
    if (isCorrect && !isLate) {
      // Speed decay formula
      points = Math.round(1000 * (1 - (timeMs / maxMs) / 2));
      if (points < 500) points = 500;
    }

    const answer = await Answer.create({
      gameId: game._id,
      playerId: player._id,
      questionIndex,
      choice,
      timeMs,
      correct: isCorrect && !isLate,
      points
    });

    // Update player score & track previous rank
    player.previousRank = player.rank || 1;
    player.score += points;
    await player.save();

    // Recalculate ranks across players
    const allPlayers = await Player.find({ gameId: game._id, status: { $ne: 'banned' } }).sort({ score: -1 });
    for (let i = 0; i < allPlayers.length; i++) {
      allPlayers[i].rank = i + 1;
      await allPlayers[i].save();
    }

    res.json({
      success: true,
      correct: answer.correct,
      points: answer.points,
      totalScore: player.score
    });
  } catch (err) {
    console.error('Answer submit error:', err);
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

// Post Comment (Slide / Video presentation)
const handlePostComment = async (req, res) => {
  try {
    const { slideIndex, text } = req.body;
    const player = req.player;

    if (player.status === 'muted' || player.canComment === false) {
      return res.status(403).json({ error: 'Live commenting disabled by Class Monitor' });
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const cleanText = text.trim().slice(0, 100);
    const comment = await Comment.create({
      gameId: player.gameId,
      playerId: player._id,
      slideIndex: slideIndex || 0,
      text: cleanText,
      removed: false
    });

    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
};

app.post('/api/comments', requireDb, requirePlayer, handlePostComment);
app.post('/api/presentations/comment', requireDb, requirePlayer, handlePostComment);

app.get('/api/comments', requireDb, requirePlayer, async (req, res) => {
  try {
    const comments = await Comment.find({ gameId: req.player.gameId, removed: { $ne: true } })
      .populate('playerId', 'nickname avatarConfig')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({
      comments: comments.map((c) => ({
        _id: c._id,
        text: c.text,
        author: c.playerId?.nickname || 'Player',
        avatarConfig: c.playerId?.avatarConfig,
        createdAt: c.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// Mark Confused (Slide / Video presentation)
const handlePostConfused = async (req, res) => {
  try {
    const { slideIndex } = req.body;
    const player = req.player;

    await Confused.create({
      gameId: player.gameId,
      playerId: player._id,
      slideIndex: slideIndex || 0
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark confused' });
  }
};

app.post('/api/confused', requireDb, requirePlayer, handlePostConfused);
app.post('/api/presentations/confused', requireDb, requirePlayer, handlePostConfused);

// Request Repeat (Presentation)
app.post('/api/presentations/repeat', requireDb, requirePlayer, async (req, res) => {
  try {
    const { slideIndex } = req.body;
    const player = req.player;

    await Repeat.create({
      gameId: player.gameId,
      playerId: player._id,
      slideIndex: slideIndex || 0
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to signal repeat' });
  }
});

// Submit Doubt / Question
app.post('/api/presentations/doubt', requireDb, requirePlayer, async (req, res) => {
  try {
    const { slideIndex, text } = req.body;
    const player = req.player;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Question text cannot be empty' });
    }

    const cleanText = text.trim().slice(0, 200);
    const doubt = await Doubt.create({
      gameId: player.gameId,
      playerId: player._id,
      slideIndex: slideIndex || 0,
      text: cleanText,
      status: 'pending'
    });

    res.json({ success: true, doubt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit question' });
  }
});

// Robust Leave Game Endpoint
app.post('/api/game/leave', requireDb, async (req, res) => {
  try {
    let token = req.headers['x-session-token'];
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    const { sessionToken, playerId, nickname, pin, studentId } = req.body || {};
    const effectiveToken = token || sessionToken;

    let deleted = false;

    // 1. Delete by session token
    if (effectiveToken) {
      const resDel = await Player.deleteMany({ sessionToken: effectiveToken });
      if (resDel.deletedCount > 0) deleted = true;
    }

    // 2. Delete by playerId
    if (playerId) {
      const resDel = await Player.findByIdAndDelete(playerId);
      if (resDel) deleted = true;
    }

    // 3. Delete by nickname and pin
    if (nickname && pin) {
      const game = await Game.findOne({ pin: pin.toString().trim() });
      if (game) {
        const resDel = await Player.deleteMany({
          gameId: game._id,
          nickname: { $regex: new RegExp(`^${nickname.trim()}$`, 'i') }
        });
        if (resDel.deletedCount > 0) deleted = true;
      }
    }

    // 4. Delete by studentId and pin
    if (studentId && pin) {
      const game = await Game.findOne({ pin: pin.toString().trim() });
      if (game) {
        const resDel = await Player.deleteMany({ gameId: game._id, studentId });
        if (resDel.deletedCount > 0) deleted = true;
      }
    }

    res.json({ success: true, deleted, message: 'Successfully left the lobby' });
  } catch (err) {
    console.error('Leave game error:', err);
    res.status(500).json({ error: 'Failed to leave game' });
  }
});

// Start Server
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`ZYNC Student server running on port ${PORT}`);
    await connectDB();
  });
}

module.exports = app;

