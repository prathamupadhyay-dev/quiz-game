const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['quiz', 'slides', 'presentation'],
    required: true
  },
  pin: {
    type: String,
    required: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['lobby', 'countdown', 'question', 'results', 'paused', 'live', 'ended'],
    default: 'lobby'
  },
  pausedFromStatus: {
    type: String,
    default: null
  },
  countdownDuration: {
    type: Number,
    default: 5
  },
  countdownStartedAt: {
    type: Date,
    default: null
  },
  currentIndex: {
    type: Number,
    default: -1
  },
  questionStartedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  collection: 'games'
});

gameSchema.index({ pin: 1 });
gameSchema.index({ status: 1 });

module.exports = mongoose.models.Game || mongoose.model('Game', gameSchema);
