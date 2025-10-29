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
    enum: ['success', 'failed', 'not_tested'],
    default: 'not_tested'
  },
  testError: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Ensure only one active configuration
aiConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.model('AIConfig', aiConfigSchema);
