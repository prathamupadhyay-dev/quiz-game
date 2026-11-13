const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  action: {
    type: String,
    enum: ['mute', 'unmute', 'kick', 'ban', 'remove_comment', 'edit_question'],
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'moderationLogs'
});

module.exports = mongoose.models.ModerationLog || mongoose.model('ModerationLog', moderationLogSchema);
