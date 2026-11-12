const mongoose = require('mongoose');

const presentationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'youtube', 'slides'],
    required: true
  },
  fileUrl: {
    type: String,
    default: null
  },
  filePath: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: ''
  },
  externalUrl: {
    type: String,
    default: null
  },
  youtubeVideoId: {
    type: String,
    default: null
  },
  totalSlides: {
    type: Number,
    default: 1
  },
  duration: {
    type: Number,
    default: 0
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'presentations'
});

module.exports = mongoose.model('Presentation', presentationSchema);
