const express = require('express');
const Favorite = require('../models/Favorite');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all favorites for the user
router.get('/', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add or toggle favorite
router.post('/', auth, async (req, res) => {
  try {
    const { question, correctAnswer, explanation, type, options, documentId, documentTitle } = req.body;
    if (!question || !correctAnswer || !explanation) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Favorite.findOne({ user: req.user._id, question });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ message: 'Removed from favorites', favorited: false });
    }

    const favorite = new Favorite({
      user: req.user._id,
      document: documentId || null,
      documentTitle: documentTitle || 'Unknown Document',
      question,
      correctAnswer,
      explanation,
      type: type || 'mcq',
      options: options || []
    });
    await favorite.save();
    res.json({ message: 'Added to favorites', favorited: true, favorite });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove favorite by id
router.delete('/:id', auth, async (req, res) => {
  try {
    const fav = await Favorite.findOne({ _id: req.params.id, user: req.user._id });
    if (!fav) return res.status(404).json({ message: 'Favorite not found' });
    await Favorite.deleteOne({ _id: fav._id });
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


