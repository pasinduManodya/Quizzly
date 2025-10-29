const User = require('../models/User');
const { logger } = require('./errorHandler');

// Middleware to check and track token usage
const tokenUsageMiddleware = (tokensNeeded = 0) => {
  return async (req, res, next) => {
    try {
      // Skip token checking for admin users
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Get fresh user data with token usage
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Load dynamic token limits
      await user.loadTokenLimits();

      // Check if user can use the required tokens
      const tokenStatus = user.canUseTokens(tokensNeeded);
      
      if (!tokenStatus.canUse) {
        logger.warn(`Token limit exceeded for user ${user.email}`, {
          userId: user._id,
          tokensNeeded,
          dailyRemaining: tokenStatus.dailyRemaining,
          monthlyRemaining: tokenStatus.monthlyRemaining,
          dailyLimit: tokenStatus.dailyLimit,
          monthlyLimit: tokenStatus.monthlyLimit
        });

        return res.status(429).json({
          success: false,
          message: 'Token limit exceeded',
          error: 'TOKEN_LIMIT_EXCEEDED',
          limits: {
            daily: {
              used: tokenStatus.dailyUsed,
              limit: tokenStatus.dailyLimit,
              remaining: tokenStatus.dailyRemaining
            },
            monthly: {
              used: tokenStatus.monthlyUsed,
              limit: tokenStatus.monthlyLimit,
              remaining: tokenStatus.monthlyRemaining
            }
          },
          subscription: {
            type: user.subscriptionType,
            status: user.getSubscriptionStatus()
          }
        });
      }

      // Add token status to request for use in the route handler
      req.tokenStatus = tokenStatus;
      req.userWithTokens = user;
      
      next();
    } catch (error) {
      logger.error('Token usage middleware error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Token usage check failed' 
      });
    }
  };
};

// Middleware to consume tokens after successful operation
const consumeTokensMiddleware = (tokensUsed) => {
  return async (req, res, next) => {
    try {
      // Skip token consumption for admin users
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      if (!req.userWithTokens) {
        return res.status(500).json({ 
          success: false, 
          message: 'Token tracking not initialized' 
        });
      }

      // Consume the tokens
      const updatedUsage = await req.userWithTokens.consumeTokens(tokensUsed);
      
      logger.info(`Tokens consumed for user ${req.userWithTokens.email}`, {
        userId: req.userWithTokens._id,
        tokensUsed,
        totalUsed: updatedUsage.totalUsed,
        dailyUsed: updatedUsage.dailyUsed,
        monthlyUsed: updatedUsage.monthlyUsed,
        dailyRemaining: updatedUsage.dailyRemaining,
        monthlyRemaining: updatedUsage.monthlyRemaining
      });

      // Add updated usage info to response
      req.tokenUsage = updatedUsage;
      
      next();
    } catch (error) {
      logger.error('Token consumption middleware error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?._id,
        tokensUsed
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Token consumption failed' 
      });
    }
  };
};

// Utility function to estimate tokens for text
const estimateTokens = (text) => {
  if (!text) return 0;
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is a conservative estimate
  return Math.ceil(text.length / 4);
};

// Utility function to estimate tokens for AI requests
const estimateAIRequestTokens = (prompt, response = '') => {
  const promptTokens = estimateTokens(prompt);
  const responseTokens = estimateTokens(response);
  // Add some overhead for AI processing
  return promptTokens + responseTokens + 50; // 50 tokens overhead
};

module.exports = {
  tokenUsageMiddleware,
  consumeTokensMiddleware,
  estimateTokens,
  estimateAIRequestTokens
};
