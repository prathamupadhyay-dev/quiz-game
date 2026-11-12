const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  questionIndex: {
    type: Number,
    required: true
  },
  choice: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  timeMs: {
    type: Number,
    required: true
  },
  correct: {
    type: Boolean,
    required: true
  },
  points: {
    type: Number,
    required: true
  }
}, {
  collection: 'answers'
});

module.exports = mongoose.model('Answer', answerSchema);
