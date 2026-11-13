const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  shape: {
    type: String,
    enum: ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star'],
    required: true
  },
  color: {
    type: String,
    required: true
  },
  accentColor: {
    type: String,
    required: true
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
  collection: 'avatars'
});

module.exports = mongoose.models.Avatar || mongoose.model('Avatar', avatarSchema);
