const mongoose = require('mongoose');

const animeCharacterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  characterId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnimeCategory',
    required: true
  },
  animeId: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  animeName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male',
    required: true
  },
  svg: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#F97316'
  },
  themeGradient: {
    type: String,
    default: 'from-orange-400/20 to-amber-600/30'
  },
  borderColor: {
    type: String,
    default: 'border-orange-500/30'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  collection: 'anime_characters'
});

module.exports = mongoose.model('AnimeCharacter', animeCharacterSchema);
