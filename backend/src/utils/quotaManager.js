// API Quota Management System
class APIQuotaManager {
  constructor() {
    this.quotaExceeded = false;
    this.lastQuotaCheck = null;
    this.quotaResetTime = null;
    console.log('🔄 Quota Manager initialized - Ready for new API');
  }

  // Check if quota is exceeded
  isQuotaExceeded() {
    return this.quotaExceeded;
  }

  // Set quota exceeded status
  setQuotaExceeded(resetTimeSeconds = null) {
    this.quotaExceeded = true;
    this.lastQuotaCheck = new Date();
    
    if (resetTimeSeconds) {
      this.quotaResetTime = new Date(Date.now() + (resetTimeSeconds * 1000));
    }
  }

  // Reset quota status
  resetQuota() {
    this.quotaExceeded = false;
    this.lastQuotaCheck = null;
    this.quotaResetTime = null;
  }

  // Get quota status message
  getQuotaStatusMessage() {
    if (!this.quotaExceeded) {
      return null;
    }

    let message = '⚠️ API quota exceeded. Using fallback features.';
    
    if (this.quotaResetTime) {
      const now = new Date();
      const timeUntilReset = this.quotaResetTime - now;
      
      if (timeUntilReset > 0) {
        const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          message += ` Quota resets in ${hours}h ${minutes}m.`;
        } else {
          message += ` Quota resets in ${minutes}m.`;
        }
      } else {
        message += ' Quota should be reset soon.';
      }
    }

    return message;
  }

  // Get upgrade recommendation
  getUpgradeRecommendation() {
    return {
      title: 'Upgrade Your API Plan',
      message: 'Get unlimited AI features with a paid plan',
      benefits: [
        'Unlimited question generation',
        'Enhanced AI summaries',
        'Advanced explanations',
        'Priority support',
        'Higher rate limits'
      ],
      actionText: 'Learn More',
      actionUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits'
    };
  }
}

// Global quota manager instance
const quotaManager = new APIQuotaManager();

module.exports = quotaManager;
