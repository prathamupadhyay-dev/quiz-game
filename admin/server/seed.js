const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
const path = require('path');
require('dotenv').config();
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env.shared'), override: true });
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Avatar = require('./models/Avatar');
const Category = require('./models/Category');
const Setting = require('./models/Setting');
const Quiz = require('./models/Quiz');
const SlideDeck = require('./models/SlideDeck');
const Game = require('./models/Game');
const Player = require('./models/Player');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    console.log('Database not configured yet. Cannot run seed without MONGODB_URI.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { dbName: 'zync' });
    console.log('Connected to MongoDB for seeding');

    const demoPassword = 'Demo@123';
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash(demoPassword, salt);

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@zync.local').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || demoPassword;
    const adminPasswordHash = adminPassword === demoPassword
      ? demoPasswordHash
      : await bcrypt.hash(adminPassword, salt);

    // 1. Seed Admin User
    const adminUser = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'Pratham Admin',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin',
        createdBy: null,
        access: { canCreateQuiz: true, canPresentSlides: true },
        assignedTeacherIds: [],
        disabled: false
      },
      { upsert: true, new: true }
    );
    console.log(`Admin user seeded: ${adminEmail}`);

    // 2. Seed Demo Staff Users for testing & management
    const demoStaff = [
      {
        name: 'Nihal Principal',
        email: 'principal@zync.local',
        role: 'principal',
        access: { canCreateQuiz: true, canPresentSlides: true },
        assignedTeacherIds: []
      },
      {
        name: 'Ramya Teacher',
        email: 'teacher@zync.local',
        role: 'teacher',
        access: { canCreateQuiz: true, canPresentSlides: false },
        assignedTeacherIds: []
      },
      {
        name: 'Utkarsh Moderator',
        email: 'moderator@zync.local',
        role: 'moderator',
        access: { canCreateQuiz: false, canPresentSlides: true },
        assignedTeacherIds: []
      }
    ];

    const seededUsers = {};
    for (const u of demoStaff) {
      const doc = await User.findOneAndUpdate(
        { email: u.email },
        {
          name: u.name,
          email: u.email,
          passwordHash: demoPasswordHash,
          role: u.role,
          createdBy: adminUser._id,
          access: u.access,
          assignedTeacherIds: u.assignedTeacherIds,
          disabled: false
        },
        { upsert: true, new: true }
      );
      seededUsers[u.role] = doc;
      console.log(`Staff user seeded: ${u.email} (${u.role})`);
    }

    // Link teacher to moderator
    if (seededUsers.moderator && seededUsers.teacher) {
      await User.findByIdAndUpdate(seededUsers.moderator._id, {
        assignedTeacherIds: [seededUsers.teacher._id]
      });
    }

    // 3. Seed Starter Avatars (One per shape: circle, square, triangle, diamond, hexagon, star)
    const starterAvatars = [
      {
        name: 'Cobalt Orb',
        shape: 'circle',
        color: '#0A84FF',
        accentColor: '#5E5CE6',
        active: true
      },
      {
        name: 'Emerald Block',
        shape: 'square',
        color: '#30D158',
        accentColor: '#FFD60A',
        active: true
      },
      {
        name: 'Amber Delta',
        shape: 'triangle',
        color: '#FF9F0A',
        accentColor: '#FF453A',
        active: true
      },
      {
        name: 'Indigo Rhombus',
        shape: 'diamond',
        color: '#5E5CE6',
        accentColor: '#0A84FF',
        active: true
      },
      {
        name: 'Crimson Hive',
        shape: 'hexagon',
        color: '#FF453A',
        accentColor: '#FF9F0A',
        active: true
      },
      {
        name: 'Solar Astral',
        shape: 'star',
        color: '#FFD60A',
        accentColor: '#30D158',
        active: true
      }
    ];

    const avatarDocs = [];
    for (const a of starterAvatars) {
      const doc = await Avatar.findOneAndUpdate(
        { name: a.name },
        {
          ...a,
          createdBy: adminUser._id
        },
        { upsert: true, new: true }
      );
      avatarDocs.push(doc);
    }
    console.log(`Seeded ${avatarDocs.length} avatars`);

    // 4. Seed Categories
    const categories = ['General Knowledge', 'Computer Science', 'Mathematics'];
    const categoryDocs = [];
    for (const catName of categories) {
      const doc = await Category.findOneAndUpdate(
        { name: catName },
        { name: catName, createdBy: adminUser._id },
        { upsert: true, new: true }
      );
      categoryDocs.push(doc);
    }
    console.log(`Seeded ${categoryDocs.length} categories`);

    // 5. Seed Default Settings
    const defaultSettings = [
      { key: 'defaultTimeLimit', value: 30 },
      { key: 'maxPlayersPerGame', value: 50 },
      { key: 'joinEnabled', value: true }
    ];

    for (const s of defaultSettings) {
      await Setting.findOneAndUpdate(
        { key: s.key },
        { key: s.key, value: s.value },
        { upsert: true, new: true }
      );
    }
    console.log('Seeded default settings (defaultTimeLimit, maxPlayersPerGame, joinEnabled)');

    // 6. Seed Sample Quiz for testing
    const teacherUser = seededUsers.teacher || adminUser;
    const csCategory = categoryDocs.find((c) => c.name === 'Computer Science') || categoryDocs[0];

    const sampleQuiz = await Quiz.findOneAndUpdate(
      { title: 'Web Architecture Fundamentals' },
      {
        title: 'Web Architecture Fundamentals',
        categoryId: csCategory._id,
        ownerId: teacherUser._id,
        questions: [
          {
            text: 'Which protocol is used for encrypted web traffic?',
            options: ['HTTP', 'HTTPS', 'FTP', 'SSH'],
            correctIndex: 1,
            timeLimit: 30
          },
          {
            text: 'What does CSS stand for?',
            options: [
              'Cascading Style Sheets',
              'Computer System Styles',
              'Creative Sheet Syntax',
              'Code Structure System'
            ],
            correctIndex: 0,
            timeLimit: 20
          },
          {
            text: 'Which database model stores documents in BSON format?',
            options: ['PostgreSQL', 'Redis', 'MongoDB', 'Neo4j'],
            correctIndex: 2,
            timeLimit: 30
          }
        ],
        lastEditedBy: teacherUser._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`Sample quiz seeded: ${sampleQuiz.title}`);

    // 7. Seed Sample Slide Deck
    const sampleDeck = await SlideDeck.findOneAndUpdate(
      { title: 'Introduction to Modern MERN Stack' },
      {
        title: 'Introduction to Modern MERN Stack',
        ownerId: teacherUser._id,
        slides: [
          {
            title: 'Welcome to ZYNC',
            body: 'An interactive classroom presentation and quiz system designed for real-time engagement.'
          },
          {
            title: 'MERN Architecture Overview',
            body: 'MongoDB shared datastore, Express REST APIs, React dynamic interface, and Node.js execution.'
          },
          {
            title: 'Live Slides and Moderation',
            body: 'Audience reactions and comments stream continuously through lightweight database polling.'
          }
        ],
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`Sample slide deck seeded: ${sampleDeck.title}`);

    // 8. Seed Sample Demo Game
    const demoPin = '739201';
    const sampleGame = await Game.findOneAndUpdate(
      { pin: demoPin },
      {
        type: 'quiz',
        pin: demoPin,
        hostId: teacherUser._id,
        refId: sampleQuiz._id,
        status: 'ended',
        currentIndex: 2,
        questionStartedAt: new Date(),
        endedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`Sample game seeded: PIN ${sampleGame.pin}`);

    // Seed sample players for this game
    const samplePlayers = [
      { nickname: 'Alex', score: 2850, avatarId: avatarDocs[0]._id, status: 'active' },
      { nickname: 'Sam', score: 2420, avatarId: avatarDocs[1]._id, status: 'active' },
      { nickname: 'Jordan', score: 1980, avatarId: avatarDocs[2]._id, status: 'active' },
      { nickname: 'Taylor', score: 1540, avatarId: avatarDocs[3]._id, status: 'active' }
    ];

    for (const p of samplePlayers) {
      await Player.findOneAndUpdate(
        { gameId: sampleGame._id, nickname: p.nickname },
        {
          gameId: sampleGame._id,
          nickname: p.nickname,
          avatarId: p.avatarId,
          sessionToken: `token-${p.nickname.toLowerCase()}-sample`,
          status: p.status,
          score: p.score
        },
        { upsert: true, new: true }
      );
    }
    console.log('Sample game players seeded');

    console.log('Seeding completed successfully without duplicate entries');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
