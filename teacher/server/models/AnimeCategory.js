const mongoose = require('mongoose');

const animeCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  color: {
    type: String,
    default: '#F97316'
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'anime_categories'
});

module.exports = mongoose.model('AnimeCategory', animeCategorySchema);
