const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  documentTitle: { type: String, required: true },
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'short', 'essay', 'structured_essay'], default: 'mcq' },
  options: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

favoriteSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);


