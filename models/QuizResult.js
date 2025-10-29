const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    userAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    question: String,
    correctAnswer: String,
    explanation: String,
    options: [String],
    type: String,
    essayGrading: {
      totalPoints: Number,
      pointsCovered: Number,
      score: Number,
      grade: String,
      allCorrectPoints: [{
        pointNumber: Number,
        point: String,
        covered: Boolean,
        studentMention: String
      }],
      missedPoints: [String],
      feedback: String,
      strengths: String,
      improvements: String
    },
    questionScore: Number,
    maxQuestionScore: Number
  }],
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  totalScore: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  savedForRevision: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuizResult', quizResultSchema);
