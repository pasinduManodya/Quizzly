const mongoose = require('mongoose');

const aiConfigSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['gemini', 'openai', 'claude', 'custom'],
    required: true,
    default: 'gemini'
  },
  apiKey: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true,
    default: 'gemini-pro'
  },
  baseUrl: {
    type: String,
    default: ''
  },
  temperature: {
    type: Number,
    default: 0.5, // Optimized for study apps - focused with good examples
    min: 0,
    max: 2
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Priority for rotation (lower number = higher priority)
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  // Provider-specific settings
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Test results
  lastTested: {
    type: Date,
    default: null
  },
  testStatus: {
    type: String,
    enum: ['success', 'failed', 'not_tested', 'exhausted'],
    default: 'not_tested'
  },
  testError: {
    type: String,
    default: null
  },
  // Credit tracking
  creditsExhausted: {
    type: Boolean,
    default: false
  },
  creditsExhaustedAt: {
    type: Date,
    default: null
  },
  // Rotation tracking
  failureCount: {
    type: Number,
    default: 0
  },
  lastFailureAt: {
    type: Date,
    default: null
  },
  successCount: {
    type: Number,
    default: 0
  },
  lastSuccessAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for finding active configs sorted by priority
aiConfigSchema.index({ isActive: 1, priority: 1 });
aiConfigSchema.index({ creditsExhausted: 1, priority: 1 });

module.exports = mongoose.model('AIConfig', aiConfigSchema);
