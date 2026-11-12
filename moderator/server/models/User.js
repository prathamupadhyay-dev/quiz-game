const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'creator', 'presentor', 'moderator', 'user', 'principal', 'teacher', 'student'],
    default: 'user'
  },
  avatarConfig: {
    skinColor: { type: String, default: '#F5C7A9' },
    hairStyle: { type: String, default: 'curly' },
    hairColor: { type: String, default: '#1C1C1E' },
    faceExpression: { type: String, default: 'smile' },
    topType: { type: String, default: 'hoodie' },
    topColor: { type: String, default: '#5E5CE6' },
    bottomType: { type: String, default: 'jeans' },
    bottomColor: { type: String, default: '#1E293B' },
    shoesType: { type: String, default: 'sneakers' },
    accessory: { type: String, default: 'none' },
    presetOutfit: { type: String, default: 'naruto' }
  },
  matchHistory: [{
    gameId: { type: String },
    quizTitle: { type: String },
    score: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    playedAt: { type: Date, default: Date.now }
  }],
  lastOnline: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  access: {
    canCreateQuiz: {
      type: Boolean,
      default: true
    },
    canPresentSlides: {
      type: Boolean,
      default: true
    },
    canModerate: {
      type: Boolean,
      default: true
    }
  },
  assignedTeacherIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  disabled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users'
});

userSchema.index({ role: 1 });
userSchema.index({ lastOnline: -1 });

module.exports = mongoose.model('User', userSchema);
