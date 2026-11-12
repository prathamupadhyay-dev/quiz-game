const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../models/User');
const Avatar = require('../models/Avatar');
const AnimeCategory = require('../models/AnimeCategory');
const AnimeCharacter = require('../models/AnimeCharacter');
const { seedDefaultCharacters } = require('../seedCharacters');
const {
  generateCharacterVector,
  getEffectiveApiKey,
  CANONICAL_PRESETS
} = require('../aiCharacterGenerator');
const Category = require('../models/Category');
const Setting = require('../models/Setting');
const Quiz = require('../models/Quiz');
const SlideDeck = require('../models/SlideDeck');
const Game = require('../models/Game');
const Player = require('../models/Player');
const Answer = require('../models/Answer');
const Comment = require('../models/Comment');
const Confused = require('../models/Confused');
const ModerationLog = require('../models/ModerationLog');

const { requireDb, requireAuth, requireAdmin } = require('../middleware/auth');

// Apply middleware to all admin routes
router.use(requireDb);
router.use(requireAuth);
router.use(requireAdmin);

// ==========================================
// 1. DASHBOARD
// ==========================================
router.get('/dashboard', async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [
      adminCount,
      creatorCount,
      presentorCount,
      moderatorCount,
      userCount,
      currentlyOnline,
      quizzesCount,
      gamesCount,
      playersCount,
      activeGames,
      latestGamesRaw
    ] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: { $in: ['creator', 'principal'] } }),
      User.countDocuments({ role: { $in: ['presentor', 'teacher'] } }),
      User.countDocuments({ role: 'moderator' }),
      User.countDocuments({ role: { $in: ['user', 'student'] } }),
      User.countDocuments({ lastOnline: { $gte: fiveMinutesAgo } }),
      Quiz.countDocuments(),
      Game.countDocuments(),
      Player.countDocuments(),
      Game.find({ status: { $in: ['lobby', 'countdown', 'question', 'results'] } }).select('_id'),
      Game.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('hostId', 'name email')
        .lean()
    ]);

    const activeGameIds = activeGames.map((g) => g._id);
    const currentlyInQuiz = await Player.countDocuments({
      gameId: { $in: activeGameIds },
      status: 'active'
    });

    // Count players for the latest 5 games
    const gameIds = latestGamesRaw.map((g) => g._id);
    const playerCounts = await Player.aggregate([
      { $match: { gameId: { $in: gameIds } } },
      { $group: { _id: '$gameId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    playerCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const latestGames = latestGamesRaw.map((game) => ({
      _id: game._id,
      type: game.type,
      pin: game.pin,
      status: game.status,
      hostName: game.hostId ? game.hostId.name : 'Unknown',
      hostEmail: game.hostId ? game.hostId.email : '',
      playerCount: countMap[game._id.toString()] || 0,
      createdAt: game.createdAt,
      endedAt: game.endedAt
    }));

    res.json({
      counts: {
        usersByRole: {
          admin: adminCount,
          creator: creatorCount,
          presentor: presentorCount,
          moderator: moderatorCount,
          user: userCount
        },
        totalUsers: adminCount + creatorCount + presentorCount + moderatorCount + userCount,
        currentlyOnline: Math.max(currentlyOnline, 1),
        currentlyInQuiz,
        quizzes: quizzesCount,
        games: gamesCount,
        players: playersCount
      },
      latestGames
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard statistics' });
  }
});

// ==========================================
// 2. USERS
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const { search, role, sort = 'recently_joined' } = req.query;
    const query = {};

    if (role && role !== 'all') {
      if (role === 'creator') query.role = { $in: ['creator', 'principal'] };
      else if (role === 'presentor') query.role = { $in: ['presentor', 'teacher'] };
      else if (role === 'user') query.role = { $in: ['user', 'student'] };
      else query.role = role;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'username_asc') sortObj = { username: 1, name: 1 };
    else if (sort === 'role') sortObj = { role: 1 };
    else if (sort === 'last_online') sortObj = { lastOnline: -1 };

    const users = await User.find(query)
      .select('-passwordHash')
      .populate('createdBy', 'name email')
      .populate('assignedTeacherIds', 'name email')
      .sort(sortObj)
      .lean();

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const playerRecords = await Player.find({
          $or: [
            { userId: u._id },
            { nickname: u.username || '___none___' }
          ]
        }).populate('gameId', 'pin createdAt').lean();

        const totalScore = playerRecords.reduce((sum, p) => sum + (p.score || 0), 0);
        const matchesPlayed = playerRecords.length;

        return {
          ...u,
          matchesPlayed,
          totalScore,
          history: playerRecords.slice(0, 5).map((p) => ({
            gamePin: p.gameId?.pin,
            score: p.score,
            rank: p.rank,
            joinedAt: p.joinedAt
          }))
        };
      })
    );

    res.json(enrichedUsers);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      access,
      assignedTeacherIds,
      disabled
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Name, email, password, and role are required'
      });
    }

    const validRoles = ['admin', 'principal', 'teacher', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role specified'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        error: 'A user with this email already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      createdBy: req.user.userId,
      access: {
        canCreateQuiz: access?.canCreateQuiz !== undefined ? access.canCreateQuiz : true,
        canPresentSlides: access?.canPresentSlides !== undefined ? access.canPresentSlides : true
      },
      assignedTeacherIds: Array.isArray(assignedTeacherIds) ? assignedTeacherIds : [],
      disabled: Boolean(disabled)
    });

    await newUser.save();

    const created = await User.findById(newUser._id)
      .select('-passwordHash')
      .populate('createdBy', 'name email')
      .populate('assignedTeacherIds', 'name email')
      .lean();

    res.status(201).json(created);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      access,
      assignedTeacherIds,
      disabled
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const emailTaken = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id }
      });
      if (emailTaken) {
        return res.status(400).json({ error: 'Email is already in use by another account' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (role) {
      const validRoles = ['admin', 'principal', 'teacher', 'moderator'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }
      user.role = role;
    }

    if (access) {
      user.access = {
        canCreateQuiz: access.canCreateQuiz !== undefined ? access.canCreateQuiz : user.access.canCreateQuiz,
        canPresentSlides: access.canPresentSlides !== undefined ? access.canPresentSlides : user.access.canPresentSlides
      };
    }

    if (Array.isArray(assignedTeacherIds)) {
      user.assignedTeacherIds = assignedTeacherIds;
    }

    if (disabled !== undefined) {
      // Prevent self-disable
      if (id === req.user.userId && disabled) {
        return res.status(400).json({ error: 'You cannot disable your own admin account' });
      }
      user.disabled = Boolean(disabled);
    }

    await user.save();

    const updated = await User.findById(id)
      .select('-passwordHash')
      .populate('createdBy', 'name email')
      .populate('assignedTeacherIds', 'name email')
      .lean();

    res.json(updated);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { disabled } = req.body;

    if (id === req.user.userId && disabled) {
      return res.status(400).json({ error: 'You cannot disable your own admin account' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { disabled: Boolean(disabled) },
      { new: true }
    )
      .select('-passwordHash')
      .populate('createdBy', 'name email')
      .populate('assignedTeacherIds', 'name email')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const passwordToSet = newPassword && newPassword.trim() ? newPassword.trim() : 'Demo@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordToSet, salt);

    const user = await User.findByIdAndUpdate(id, { passwordHash }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password reset successfully', defaultUsed: !newPassword });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==========================================
// 3. QUIZZES
// ==========================================
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('ownerId', 'name email')
      .populate('categoryId', 'name')
      .populate('lastEditedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      categoryName: q.categoryId ? q.categoryId.name : 'Uncategorized',
      categoryId: q.categoryId ? q.categoryId._id : null,
      ownerName: q.ownerId ? q.ownerId.name : 'Unknown',
      ownerEmail: q.ownerId ? q.ownerId.email : '',
      questionCount: q.questions ? q.questions.length : 0,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List quizzes error:', err);
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
});

router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('ownerId', 'name email')
      .populate('categoryId', 'name')
      .populate('lastEditedBy', 'name email')
      .lean();

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz details' });
  }
});

router.delete('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// ==========================================
// 4. SLIDE DECKS
// ==========================================
router.get('/slides', async (req, res) => {
  try {
    const decks = await SlideDeck.find()
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = decks.map((d) => ({
      _id: d._id,
      title: d.title,
      ownerName: d.ownerId ? d.ownerId.name : 'Unknown',
      ownerEmail: d.ownerId ? d.ownerId.email : '',
      slideCount: d.slides ? d.slides.length : 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List slide decks error:', err);
    res.status(500).json({ error: 'Failed to load slide decks' });
  }
});

router.get('/slides/:id', async (req, res) => {
  try {
    const deck = await SlideDeck.findById(req.params.id)
      .populate('ownerId', 'name email')
      .lean();

    if (!deck) {
      return res.status(404).json({ error: 'Slide deck not found' });
    }

    res.json(deck);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slide deck details' });
  }
});

router.delete('/slides/:id', async (req, res) => {
  try {
    const deck = await SlideDeck.findByIdAndDelete(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Slide deck not found' });
    }
    res.json({ message: 'Slide deck deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slide deck' });
  }
});

// ==========================================
// 5. GAMES
// ==========================================
router.get('/games', async (req, res) => {
  try {
    const games = await Game.find()
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const gameIds = games.map((g) => g._id);
    const playerCounts = await Player.aggregate([
      { $match: { gameId: { $in: gameIds } } },
      { $group: { _id: '$gameId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    playerCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const formatted = games.map((g) => ({
      _id: g._id,
      type: g.type,
      pin: g.pin,
      status: g.status,
      hostName: g.hostId ? g.hostId.name : 'Unknown',
      hostEmail: g.hostId ? g.hostId.email : '',
      currentIndex: g.currentIndex,
      playerCount: countMap[g._id.toString()] || 0,
      createdAt: g.createdAt,
      endedAt: g.endedAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List games error:', err);
    res.status(500).json({ error: 'Failed to load games' });
  }
});

router.get('/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('hostId', 'name email')
      .lean();

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Try finding ref item title
    let refTitle = '';
    if (game.type === 'quiz') {
      const q = await Quiz.findById(game.refId).select('title').lean();
      if (q) refTitle = q.title;
    } else if (game.type === 'slides') {
      const s = await SlideDeck.findById(game.refId).select('title').lean();
      if (s) refTitle = s.title;
    }

    const players = await Player.find({ gameId: game._id })
      .populate('avatarId', 'name shape color accentColor')
      .sort({ score: -1, joinedAt: 1 })
      .lean();

    res.json({
      game: {
        ...game,
        refTitle,
        hostName: game.hostId ? game.hostId.name : 'Unknown',
        hostEmail: game.hostId ? game.hostId.email : ''
      },
      players
    });
  } catch (err) {
    console.error('Game detail error:', err);
    res.status(500).json({ error: 'Failed to load game details' });
  }
});

// ==========================================
// 6. ANIME CATEGORIES & ANIME CHARACTERS
// ==========================================

// --- ANIME CATEGORIES ---
router.get('/anime-categories', async (req, res) => {
  try {
    const categories = await AnimeCategory.find()
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load anime categories' });
  }
});

router.post('/anime-categories', async (req, res) => {
  try {
    const { name, color, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Anime category name is required' });
    }

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await AnimeCategory.findOne({
      $or: [{ name: cleanName }, { slug }]
    });
    if (existing) {
      return res.status(409).json({ error: 'An anime category with this name already exists' });
    }

    const category = new AnimeCategory({
      name: cleanName,
      slug,
      color: color && color.trim() ? color.trim() : '#F97316',
      description: description ? description.trim() : '',
      createdBy: req.user.userId
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error('Create anime category error:', err);
    res.status(500).json({ error: 'Failed to create anime category' });
  }
});

router.put('/anime-categories/:id', async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const category = await AnimeCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Anime category not found' });
    }

    if (name && name.trim()) {
      const cleanName = name.trim();
      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const duplicate = await AnimeCategory.findOne({
        _id: { $ne: category._id },
        $or: [{ name: cleanName }, { slug }]
      });
      if (duplicate) {
        return res.status(409).json({ error: 'An anime category with this name already exists' });
      }
      category.name = cleanName;
      category.slug = slug;

      // Also cascade update characters referencing this category's name & slug
      await AnimeCharacter.updateMany(
        { categoryId: category._id },
        { animeName: cleanName, animeId: slug }
      );
    }

    if (color && color.trim()) category.color = color.trim();
    if (description !== undefined) category.description = description.trim();

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update anime category' });
  }
});

router.delete('/anime-categories/:id', async (req, res) => {
  try {
    const category = await AnimeCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Anime category not found' });
    }

    // Check if characters belong to this category
    const characterCount = await AnimeCharacter.countDocuments({ categoryId: category._id });
    if (characterCount > 0) {
      return res.status(400).json({
        error: `Cannot delete: ${characterCount} characters belong to this category. Delete or reassign those characters first.`
      });
    }

    await AnimeCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Anime category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete anime category' });
  }
});

// --- ANIME CHARACTERS ---
router.get('/characters', async (req, res) => {
  try {
    const characters = await AnimeCharacter.find()
      .populate('categoryId', 'name slug color')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(characters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load characters' });
  }
});

// Backward-compatible alias for /avatars
router.get('/avatars', async (req, res) => {
  try {
    const characters = await AnimeCharacter.find()
      .populate('categoryId', 'name slug color')
      .sort({ createdAt: -1 })
      .lean();
    res.json(characters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load characters' });
  }
});

router.post('/characters', async (req, res) => {
  try {
    const { name, categoryId, gender, svg, color, characterId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Character name is required' });
    }
    if (!categoryId) {
      return res.status(400).json({ error: 'Please select an anime universe category' });
    }
    if (!svg || !svg.trim()) {
      return res.status(400).json({ error: 'SVG design code or upload is required' });
    }

    const category = await AnimeCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Selected anime universe category not found' });
    }

    const cleanName = name.trim();
    const cleanId = (characterId && characterId.trim())
      ? characterId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await AnimeCharacter.findOne({ characterId: cleanId });
    if (existing) {
      return res.status(409).json({ error: `A character with identifier "${cleanId}" already exists` });
    }

    const character = new AnimeCharacter({
      name: cleanName,
      characterId: cleanId,
      categoryId: category._id,
      animeId: category.slug,
      animeName: category.name,
      gender: ['male', 'female', 'other'].includes(gender) ? gender : 'male',
      svg: svg.trim(),
      color: color && color.trim() ? color.trim() : category.color || '#F97316',
      active: true,
      createdBy: req.user.userId
    });

    await character.save();
    res.status(201).json(character);
  } catch (err) {
    console.error('Create character error:', err);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

// Backward-compatible alias for /avatars
router.post('/avatars', async (req, res) => {
  return router.handle({ ...req, url: '/characters' }, res);
});

router.put('/characters/:id', async (req, res) => {
  try {
    const { name, categoryId, gender, svg, color, active } = req.body;
    const character = await AnimeCharacter.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (name && name.trim()) character.name = name.trim();
    if (gender && ['male', 'female', 'other'].includes(gender)) character.gender = gender;
    if (svg && svg.trim()) character.svg = svg.trim();
    if (color && color.trim()) character.color = color.trim();
    if (active !== undefined) character.active = Boolean(active);

    if (categoryId && categoryId.toString() !== character.categoryId.toString()) {
      const category = await AnimeCategory.findById(categoryId);
      if (category) {
        character.categoryId = category._id;
        character.animeId = category.slug;
        character.animeName = category.name;
      }
    }

    await character.save();
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update character' });
  }
});

router.patch('/characters/:id/toggle', async (req, res) => {
  try {
    const character = await AnimeCharacter.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    character.active = !character.active;
    await character.save();
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle character active state' });
  }
});

router.delete('/characters/:id', async (req, res) => {
  try {
    const character = await AnimeCharacter.findByIdAndDelete(req.params.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json({ message: 'Character deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

// Backward-compatible alias for delete avatar
router.delete('/avatars/:id', async (req, res) => {
  try {
    const character = await AnimeCharacter.findByIdAndDelete(req.params.id);
    if (character) {
      return res.json({ message: 'Character deleted successfully' });
    }
    await Avatar.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

// Seed default Naruto characters
router.post('/characters/seed', async (req, res) => {
  try {
    const result = await seedDefaultCharacters(req.user.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed default characters' });
  }
});

// ==========================================
// 6B. AI CHARACTER STUDIO (GEMINI & VECTOR PRESETS)
// ==========================================

// Check if Gemini API key is configured
router.get('/characters/ai-config', async (req, res) => {
  try {
    const key = await getEffectiveApiKey();
    res.json({
      configured: Boolean(key),
      keyPreview: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
      presetsAvailable: Object.keys(CANONICAL_PRESETS)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check AI config' });
  }
});

// Save Gemini API key
router.post('/characters/ai-config', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: 'API key is required' });
    }
    await Setting.findOneAndUpdate(
      { key: 'gemini_api_key' },
      { value: apiKey.trim() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Google Gemini API key saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// Generate character vector design using Gemini or Canonical Library
router.post('/characters/generate-ai', async (req, res) => {
  try {
    const { animeName, characterName, formVariation, gender, color, apiKey, saveApiKey } = req.body;

    if (!animeName || !animeName.trim()) {
      return res.status(400).json({ error: 'Anime universe / verse name is required' });
    }
    if (!characterName || !characterName.trim()) {
      return res.status(400).json({ error: 'Character name is required' });
    }

    // If user passed a key and wants to save it permanently
    if (apiKey && apiKey.trim() && saveApiKey) {
      await Setting.findOneAndUpdate(
        { key: 'gemini_api_key' },
        { value: apiKey.trim() },
        { upsert: true, new: true }
      );
    }

    const result = await generateCharacterVector({
      animeName: animeName.trim(),
      characterName: characterName.trim(),
      formVariation: formVariation ? formVariation.trim() : '',
      gender: gender || 'male',
      color: color || '#F97316',
      apiKey: apiKey && apiKey.trim() ? apiKey.trim() : null
    });

    res.json(result);
  } catch (err) {
    console.error('AI character generation error:', err);
    res.status(400).json({ error: err.message || 'Character generation failed' });
  }
});

// Confirm and save AI generated character into MongoDB
router.post('/characters/confirm-ai', async (req, res) => {
  try {
    const { name, animeName, gender, svg, color, characterId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Character name is required' });
    }
    if (!animeName || !animeName.trim()) {
      return res.status(400).json({ error: 'Anime Universe / Verse name is required' });
    }
    if (!svg || !svg.trim()) {
      return res.status(400).json({ error: 'SVG design is required' });
    }

    const cleanName = name.trim();
    const cleanAnime = animeName.trim();
    const animeSlug = cleanAnime.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // 1. Find or auto-create the AnimeCategory
    let category = await AnimeCategory.findOne({
      $or: [{ name: new RegExp(`^${cleanAnime}$`, 'i') }, { slug: animeSlug }]
    });

    if (!category) {
      category = new AnimeCategory({
        name: cleanAnime,
        slug: animeSlug || 'verse',
        color: color || '#F97316',
        description: `The ${cleanAnime} universe`,
        createdBy: req.user.userId
      });
      await category.save();
    }

    // 2. Generate a unique characterId
    let baseId = (characterId && characterId.trim())
      ? characterId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    if (!baseId) baseId = 'character';

    let cleanId = baseId;
    let counter = 1;
    while (await AnimeCharacter.findOne({ characterId: cleanId })) {
      counter++;
      cleanId = `${baseId}-${counter}`;
    }

    // 3. Create the character
    const character = new AnimeCharacter({
      name: cleanName,
      characterId: cleanId,
      categoryId: category._id,
      animeId: category.slug,
      animeName: category.name,
      gender: ['male', 'female', 'other'].includes(gender) ? gender : 'male',
      svg: svg.trim(),
      color: color && color.trim() ? color.trim() : category.color || '#F97316',
      active: true,
      createdBy: req.user.userId
    });

    await character.save();
    res.status(201).json({ success: true, character });
  } catch (err) {
    console.error('Confirm character error:', err);
    res.status(500).json({ error: err.message || 'Failed to save character to MongoDB' });
  }
});

// ==========================================
// 7. CATEGORIES
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .lean();

    const categoryIds = categories.map((c) => c._id);
    const quizCounts = await Quiz.aggregate([
      { $match: { categoryId: { $in: categoryIds } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    quizCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const result = categories.map((c) => ({
      _id: c._id,
      name: c.name,
      quizCount: countMap[c._id.toString()] || 0,
      createdBy: c.createdBy
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmed = name.trim();
    const existing = await Category.findOne({ name: new RegExp(`^${trimmed}$`, 'i') });
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = new Category({
      name: trimmed,
      createdBy: req.user.userId
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmed = name.trim();
    const existing = await Category.findOne({
      name: new RegExp(`^${trimmed}$`, 'i'),
      _id: { $ne: req.params.id }
    });
    if (existing) {
      return res.status(400).json({ error: 'Another category with this name already exists' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: trimmed },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ==========================================
// 8. SETTINGS
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    const allSettings = await Setting.find().lean();
    const settingsMap = {
      maxQuestionDuration: 120,
      maxQuestionsCount: 50,
      maxPlayersPerGame: 100,
      joinEnabled: true
    };

    allSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { maxQuestionDuration, maxQuestionsCount, maxPlayersPerGame, joinEnabled } = req.body;

    const updates = [];

    if (maxQuestionDuration !== undefined) {
      const parsed = Number(maxQuestionDuration);
      if (isNaN(parsed) || parsed < 5 || parsed > 600) {
        return res.status(400).json({ error: 'maxQuestionDuration must be between 5 and 600 seconds' });
      }
      updates.push(
        Setting.findOneAndUpdate(
          { key: 'maxQuestionDuration' },
          { value: parsed },
          { upsert: true, new: true }
        )
      );
    }

    if (maxQuestionsCount !== undefined) {
      const parsed = Number(maxQuestionsCount);
      if (isNaN(parsed) || parsed < 1 || parsed > 200) {
        return res.status(400).json({ error: 'maxQuestionsCount must be between 1 and 200' });
      }
      updates.push(
        Setting.findOneAndUpdate(
          { key: 'maxQuestionsCount' },
          { value: parsed },
          { upsert: true, new: true }
        )
      );
    }

    if (maxPlayersPerGame !== undefined) {
      const parsedMax = Number(maxPlayersPerGame);
      if (isNaN(parsedMax) || parsedMax < 1 || parsedMax > 500) {
        return res.status(400).json({ error: 'maxPlayersPerGame must be between 1 and 500' });
      }
      updates.push(
        Setting.findOneAndUpdate(
          { key: 'maxPlayersPerGame' },
          { value: parsedMax },
          { upsert: true, new: true }
        )
      );
    }

    if (joinEnabled !== undefined) {
      updates.push(
        Setting.findOneAndUpdate(
          { key: 'joinEnabled' },
          { value: Boolean(joinEnabled) },
          { upsert: true, new: true }
        )
      );
    }

    await Promise.all(updates);

    const allSettings = await Setting.find().lean();
    const settingsMap = {
      maxQuestionDuration: 120,
      maxQuestionsCount: 50,
      maxPlayersPerGame: 100,
      joinEnabled: true
    };
    allSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json(settingsMap);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
