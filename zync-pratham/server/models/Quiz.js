const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: { 
    type: String, 
    required: true 
  },
  options: {
    type: [String],
    validate: {
      validator: function(val) {
        return Array.isArray(val) && val.length === 4;
      },
      message: 'A question must have exactly 4 options'
    },
    required: true
  },
  correctIndex: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 3 
  },
  timeLimit: { 
    type: Number 
  }
});

const QuizSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  questions: {
    type: [QuestionSchema],
    validate: {
      validator: function(val) {
        return Array.isArray(val) && val.length > 0;
      },
      message: 'A quiz must contain at least one question'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
