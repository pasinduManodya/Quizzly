const AIConfig = require('../models/AIConfig');

/**
 * API Rotation Manager - Handles automatic fallback to next API key when credits are exhausted
 */
class APIRotationManager {
  /**
   * Get the next available API configuration
   * Priority: active & not exhausted > not exhausted > any available
   */
  static async getNextAvailableConfig() {
    try {
      // First, try to find an active config that hasn't exhausted credits
      let config = await AIConfig.findOne({
        isActive: true,
        creditsExhausted: false
      })
        .select('+apiKey')
        .sort({ priority: 1 });

      if (config) {
        console.log(`✅ Using active API: ${config.provider} - ${config.model} (Priority: ${config.priority})`);
        return config;
      }

      // If no active config, find the first non-exhausted config by priority
      config = await AIConfig.findOne({
        creditsExhausted: false
      })
        .select('+apiKey')
        .sort({ priority: 1, createdAt: 1 });

      if (config) {
        console.log(`⚠️  Switching to next available API: ${config.provider} - ${config.model} (Priority: ${config.priority})`);
        // Activate this config
        await AIConfig.updateMany({}, { isActive: false });
        config.isActive = true;
        await config.save();
        return config;
      }

      // If all configs are exhausted, return the one with lowest priority (most recent attempt)
      config = await AIConfig.findOne()
        .select('+apiKey')
        .sort({ priority: 1, createdAt: -1 });

      if (config) {
        console.log(`⚠️  All APIs exhausted. Using: ${config.provider} - ${config.model}`);
        return config;
      }

      throw new Error('No AI configuration found. Please add at least one API key in the admin panel.');
    } catch (error) {
      console.error('❌ Error getting next available config:', error.message);
      throw error;
    }
  }

  /**
   * Mark API as exhausted (credits over)
   */
  static async markAsExhausted(configId, reason = 'Credits exhausted') {
    try {
      const config = await AIConfig.findByIdAndUpdate(
        configId,
        {
          creditsExhausted: true,
          creditsExhaustedAt: new Date(),
          testStatus: 'exhausted',
          testError: reason
        },
        { new: true }
      );

      console.log(`🚫 Marked API as exhausted: ${config.provider} - ${config.model}`);
      return config;
    } catch (error) {
      console.error('❌ Error marking config as exhausted:', error.message);
      throw error;
    }
  }

  /**
   * Record successful API call
   */
  static async recordSuccess(configId) {
    try {
      await AIConfig.findByIdAndUpdate(
        configId,
        {
          $inc: { successCount: 1 },
          lastSuccessAt: new Date(),
          failureCount: 0, // Reset failure count on success
          testStatus: 'success'
        }
      );
    } catch (error) {
      console.error('❌ Error recording success:', error.message);
    }
  }

  /**
   * Record failed API call
   */
  static async recordFailure(configId, errorMessage) {
    try {
      const config = await AIConfig.findByIdAndUpdate(
        configId,
        {
          $inc: { failureCount: 1 },
          lastFailureAt: new Date(),
          testStatus: 'failed',
          testError: errorMessage
        },
        { new: true }
      );

      // If too many failures, mark as exhausted
      if (config.failureCount >= 5) {
        await this.markAsExhausted(configId, `Too many failures: ${errorMessage}`);
      }

      return config;
    } catch (error) {
      console.error('❌ Error recording failure:', error.message);
    }
  }

  /**
   * Get all API configurations with their status
   */
  static async getAllConfigs() {
    try {
      const configs = await AIConfig.find({})
        .sort({ priority: 1, createdAt: 1 })
        .select('-apiKey'); // Don't return API keys

      return configs.map(config => ({
        id: config._id,
        provider: config.provider,
        model: config.model,
        isActive: config.isActive,
        priority: config.priority,
        creditsExhausted: config.creditsExhausted,
        creditsExhaustedAt: config.creditsExhaustedAt,
        testStatus: config.testStatus,
        testError: config.testError,
        failureCount: config.failureCount,
        successCount: config.successCount,
        lastSuccessAt: config.lastSuccessAt,
        lastFailureAt: config.lastFailureAt,
        lastTested: config.lastTested,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }));
    } catch (error) {
      console.error('❌ Error getting all configs:', error.message);
      throw error;
    }
  }

  /**
   * Restore an exhausted API (admin action)
   */
  static async restoreConfig(configId) {
    try {
      const config = await AIConfig.findByIdAndUpdate(
        configId,
        {
          creditsExhausted: false,
          creditsExhaustedAt: null,
          failureCount: 0,
          testStatus: 'not_tested',
          testError: null
        },
        { new: true }
      );

      console.log(`✅ Restored API: ${config.provider} - ${config.model}`);
      return config;
    } catch (error) {
      console.error('❌ Error restoring config:', error.message);
      throw error;
    }
  }

  /**
   * Update API priority
   */
  static async updatePriority(configId, priority) {
    try {
      const config = await AIConfig.findByIdAndUpdate(
        configId,
        { priority },
        { new: true }
      );

      console.log(`✅ Updated priority for ${config.provider}: ${priority}`);
      return config;
    } catch (error) {
      console.error('❌ Error updating priority:', error.message);
      throw error;
    }
  }

  /**
   * Check if error indicates credits exhausted
   */
  static isCreditsExhaustedError(error) {
    const message = error.message || error.toString();
    const exhaustedPatterns = [
      'quota',
      'rate limit',
      'credits',
      'insufficient',
      'exceeded',
      'limit exceeded',
      '429',
      '403',
      'forbidden',
      'unauthorized',
      'invalid_request_error'
    ];

    return exhaustedPatterns.some(pattern => 
      message.toLowerCase().includes(pattern)
    );
  }
}

module.exports = APIRotationManager;
