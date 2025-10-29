const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  questions: [{
    type: {
      type: String,
      enum: ['mcq', 'short', 'essay', 'structured_essay'],
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [String], // For MCQ questions
    correctAnswer: {
      type: String,
      required: true
    },
    explanation: {
      type: String,
      required: true
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
