// Example: How to integrate token usage tracking into your routes

const express = require('express');
const { tokenUsageMiddleware, consumeTokensMiddleware, estimateTokens } = require('../middleware/tokenUsage');
const { createAIService } = require('../services/aiService');

const router = express.Router();

// Example 1: Document processing with token tracking
router.post('/process-document', 
  auth, // Your existing auth middleware
  tokenUsageMiddleware(1000), // Check if user can use 1000 tokens
  async (req, res) => {
    try {
      const { documentText } = req.body;
      
      // Estimate tokens needed for AI processing
      const estimatedTokens = estimateTokens(documentText) + 500; // Add overhead
      
      // Check if user can use the estimated tokens
      const canUse = req.userWithTokens.canUseTokens(estimatedTokens);
      if (!canUse.canUse) {
        return res.status(429).json({
          success: false,
          message: 'Token limit exceeded',
          limits: canUse
        });
      }
      
      // Process with AI
      const aiService = await createAIService();
      const result = await aiService.generateQuizWithTokens(documentText);
      
      // Consume the actual tokens used
      await req.userWithTokens.consumeTokens(result.tokenUsage.totalTokens);
      
      res.json({
        success: true,
        data: result.response,
        tokenUsage: result.tokenUsage
      });
      
    } catch (error) {
      res.status(500).json({ message: 'Processing failed' });
    }
  }
);

// Example 2: Simple AI explanation with token tracking
router.post('/explain', 
  auth,
  tokenUsageMiddleware(500), // Check for 500 tokens
  async (req, res) => {
    try {
      const { question, answer, context } = req.body;
      
      const aiService = await createAIService();
      const result = await aiService.generateExplanationWithTokens(question, answer, context);
      
      // Consume tokens
      await req.userWithTokens.consumeTokens(result.tokenUsage.totalTokens);
      
      res.json({
        success: true,
        explanation: result.response,
        tokenUsage: result.tokenUsage
      });
      
    } catch (error) {
      res.status(500).json({ message: 'Explanation failed' });
    }
  }
);

// Example 3: Get user's token usage
router.get('/my-token-usage', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const tokenUsage = user.getTokenUsage();
    
    res.json({
      success: true,
      data: {
        tokenUsage,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.getSubscriptionStatus()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get token usage' });
  }
});

module.exports = router;
