const mongoose = require('mongoose');

const PresentationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  pdfUrl: { 
    type: String, 
    required: true 
  },
  totalSlides: { 
    type: Number, 
    required: true,
    min: 1 
  }
}, { timestamps: true });

module.exports = mongoose.model('Presentation', PresentationSchema);
