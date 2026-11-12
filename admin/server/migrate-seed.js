const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.shared') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Setting = require('./models/Setting');
const Student = require('./models/Student');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: 'zync' });
  console.log('Connected to MongoDB for user & role migration');

  const salt = await bcrypt.genSalt(10);
  const demoHash = await bcrypt.hash('Demo@123', salt);

  // 1. Seed or Update super admin Pratham
  const pratham = await User.findOneAndUpdate(
    { $or: [{ username: 'pratham' }, { email: 'pratham@zync.local' }, { email: 'admin@zync.local' }] },
    {
      name: 'Pratham',
      username: 'pratham',
      email: 'pratham@zync.local',
      passwordHash: demoHash,
      role: 'admin',
      access: {
        canCreateQuiz: true,
        canPresentSlides: true,
        canModerate: true
      },
      disabled: false,
      lastOnline: new Date()
    },
    { upsert: true, new: true }
  );
  console.log('Seeded super admin: pratham (role: admin, full permissions)');

  // 2. Creator (Nihal)
  await User.findOneAndUpdate(
    { $or: [{ username: 'nihal' }, { email: 'principal@zync.local' }] },
    {
      name: 'Nihal Creator',
      username: 'nihal',
      email: 'principal@zync.local',
      passwordHash: demoHash,
      role: 'creator',
      access: { canCreateQuiz: true, canPresentSlides: true },
      disabled: false,
      createdBy: pratham._id
    },
    { upsert: true, new: true }
  );
  console.log('Seeded creator: nihal (role: creator)');

  // 3. Presentor (Ramya)
  await User.findOneAndUpdate(
    { $or: [{ username: 'ramya' }, { email: 'teacher@zync.local' }] },
    {
      name: 'Ramya Presentor',
      username: 'ramya',
      email: 'teacher@zync.local',
      passwordHash: demoHash,
      role: 'presentor',
      access: { canCreateQuiz: true, canPresentSlides: true },
      disabled: false,
      createdBy: pratham._id
    },
    { upsert: true, new: true }
  );
  console.log('Seeded presentor: ramya (role: presentor)');

  // 4. Moderator (Utkarsh)
  await User.findOneAndUpdate(
    { $or: [{ username: 'utkarsh' }, { email: 'moderator@zync.local' }] },
    {
      name: 'Utkarsh Moderator',
      username: 'utkarsh',
      email: 'moderator@zync.local',
      passwordHash: demoHash,
      role: 'moderator',
      access: { canCreateQuiz: true, canPresentSlides: true, canModerate: true },
      disabled: false,
      createdBy: pratham._id
    },
    { upsert: true, new: true }
  );
  console.log('Seeded moderator: utkarsh (role: moderator)');

  // 5. Migrate students collection to users collection with role: 'user'
  try {
    const students = await Student.find();
    for (const s of students) {
      const uName = (s.username || s.name || 'user_' + s._id.toString().slice(-4)).toLowerCase().replace(/[^a-z0-9_]/g, '');
      const existingUser = await User.findOne({
        $or: [{ username: uName }, { email: s.email }]
      });
      if (!existingUser) {
        await User.create({
          name: s.name || uName,
          username: uName,
          email: s.email,
          passwordHash: demoHash,
          role: 'user',
          avatarConfig: s.avatarConfig || undefined,
          lastOnline: s.createdAt || new Date(),
          createdAt: s.createdAt || new Date()
        });
        console.log(`Migrated student ${s.name} (${uName}) to role 'user'`);
      }
    }
  } catch (err) {
    console.warn('Student migration note:', err.message);
  }

  // 6. Seed platform guardrails in Settings
  const guardrails = [
    { key: 'maxQuestionDuration', value: 120 },
    { key: 'maxQuestionsCount', value: 50 },
    { key: 'maxPlayersPerGame', value: 100 },
    { key: 'joinEnabled', value: true }
  ];

  for (const g of guardrails) {
    await Setting.findOneAndUpdate(
      { key: g.key },
      { key: g.key, value: g.value },
      { upsert: true, new: true }
    );
  }
  console.log('Seeded platform guardrails in Settings');

  const allUsers = await User.find().select('username email role name');
  console.log('Total users now in DB:', allUsers.length);
  console.log(allUsers);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
