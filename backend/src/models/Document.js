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
