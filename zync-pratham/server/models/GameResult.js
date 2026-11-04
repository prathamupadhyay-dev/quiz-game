const mongoose = require('mongoose');

const LeaderboardEntrySchema = new mongoose.Schema({
  playerName: { 
    type: String, 
    required: true 
  },
  avatarSeed: { 
    type: String, 
    default: '' 
  },
  avatarStyle: { 
    type: String, 
    default: 'adventurer' 
  },
  score: { 
    type: Number, 
    default: 0 
  }
}, { _id: false });

const GameResultSchema = new mongoose.Schema({
  roomPin: { 
    type: String, 
    required: true 
  },
  mode: { 
    type: String, 
    enum: ['quiz', 'presenter'], 
    default: 'quiz' 
  },
  leaderboard: [LeaderboardEntrySchema]
}, { timestamps: true });

module.exports = mongoose.model('GameResult', GameResultSchema);
