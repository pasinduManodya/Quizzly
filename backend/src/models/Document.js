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
  condensedText: {
    type: String,
    default: null
  },
  condensedTextLength: {
    type: Number,
    default: 0
  },
  questions: [{
    type: {
      type: String,
      enum: ['mcq', 'short', 'essay', 'structured_essay', 'true_false'],
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [String], // For MCQ questions
    statements: [{
      text: String,
      correctAnswer: String,
      explanation: String
    }], // For True/False questions - 5 statements per question
    correctAnswer: {
      type: String,
      required: true
    },
    explanation: {
      type: String,
      required: true
    },
    coversPoints: [Number] // Track which important points this question covers
  }],
  importantPoints: [{
    id: Number,
    point: String,
    category: String,
    topic: String,
    details: String,
    covered: {
      type: Boolean,
      default: false
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  summary: {
    type: String,
    default: null
  },
  simplifiedSummary: {
    type: String,
    default: null
  },
  shorterSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
