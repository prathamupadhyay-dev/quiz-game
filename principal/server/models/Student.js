const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
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
    presetOutfit: { type: String, default: 'none' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'students'
});

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
