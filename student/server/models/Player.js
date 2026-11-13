const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  nickname: {
    type: String,
    required: true,
    trim: true
  },
  avatarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Avatar',
    required: false
  },
  avatarConfig: {
    type: Object,
    default: null
  },
  sessionToken: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'waiting_approval', 'declined', 'muted', 'kicked', 'banned', 'left'],
    default: 'waiting_approval'
  },
  canComment: {
    type: Boolean,
    default: true
  },
  warningCount: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  previousRank: {
    type: Number,
    default: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'players'
});

playerSchema.index({ gameId: 1 });
playerSchema.index({ status: 1 });
playerSchema.index({ sessionToken: 1 });

module.exports = mongoose.models.Player || mongoose.model('Player', playerSchema);
