const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false, // Make email optional
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.isGuest; // Password required only for non-guest users
    },
    minlength: 6
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  guestSessionId: {
    type: String,
    required: function() {
      return this.isGuest; // Required only for guest users
    },
    unique: function() {
      return this.isGuest; // Unique only for guest users
    },
    sparse: true // Allow multiple null values
  },
  maxDocuments: {
    type: Number,
    default: function() {
      if (this.isGuest) return 3;
      if (this.isPro || this.subscriptionType === 'pro' || this.subscriptionType === 'premium') return 100;
      return 10; // Free users
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Subscription fields
  isPro: {
    type: Boolean,
    default: false
  },
  subscriptionType: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  subscriptionStartDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    default: null
  },
  // Additional user details
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  // Usage tracking
  totalQuizzesTaken: {
    type: Number,
    default: 0
  },
  totalDocumentsUploaded: {
    type: Number,
    default: 0
  },
  lastLoginDate: {
    type: Date,
    default: Date.now
  },
  // Token usage tracking
  tokenUsage: {
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    totalInputTokens: {
      type: Number,
      default: 0
    },
    totalOutputTokens: {
      type: Number,
      default: 0
    },
    monthlyTokensUsed: {
      type: Number,
      default: 0
    },
    monthlyInputTokens: {
      type: Number,
      default: 0
    },
    monthlyOutputTokens: {
      type: Number,
      default: 0
    },
    dailyTokensUsed: {
      type: Number,
      default: 0
    },
    dailyInputTokens: {
      type: Number,
      default: 0
    },
    dailyOutputTokens: {
      type: Number,
      default: 0
    },
    lastTokenResetDate: {
      type: Date,
      default: Date.now
    },
    lastDailyResetDate: {
      type: Date,
      default: Date.now
    }
  },
  // Token limits (will be populated dynamically)
  tokenLimits: {
    monthlyLimit: {
      type: Number,
      default: 5000 // Default fallback
    },
    dailyLimit: {
      type: Number,
      default: 200 // Default fallback
    }
  }
}, {
  timestamps: true
});

// Hash password before saving and ensure token limits are initialized
userSchema.pre('save', async function(next) {
  // Hash password if modified and not a guest
  if (this.isModified('password') && !this.isGuest) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Initialize token limits if not already set (for new users)
  if (!this.tokenLimits.dailyLimit || !this.tokenLimits.monthlyLimit) {
    try {
      const TokenLimits = require('./TokenLimits');
      const subscriptionType = this.getSubscriptionStatus();
      const limits = await TokenLimits.getLimitsForSubscription(subscriptionType);
      this.tokenLimits.dailyLimit = limits.dailyLimit;
      this.tokenLimits.monthlyLimit = limits.monthlyLimit;
    } catch (error) {
      console.error('Error loading token limits in pre-save hook:', error);
      // Use default fallback limits
      this.tokenLimits.dailyLimit = this.tokenLimits.dailyLimit || 200;
      this.tokenLimits.monthlyLimit = this.tokenLimits.monthlyLimit || 5000;
    }
  }
  
  // Ensure token usage dates are initialized
  if (!this.tokenUsage.lastDailyResetDate) {
    this.tokenUsage.lastDailyResetDate = new Date();
  }
  if (!this.tokenUsage.lastTokenResetDate) {
    this.tokenUsage.lastTokenResetDate = new Date();
  }
  
  next();
});


// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isGuest) return false; // Guests don't have passwords
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last activity
userSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.lastLoginDate = new Date();
  return this.save();
};

// Check if subscription is active
userSchema.methods.isSubscriptionActive = function() {
  if (!this.subscriptionExpiry) return false;
  return new Date() < this.subscriptionExpiry;
};

// Get subscription status
userSchema.methods.getSubscriptionStatus = function() {
  if (this.isGuest) return 'guest';
  if (this.isPro && this.isSubscriptionActive()) return 'pro';
  if (this.subscriptionType === 'premium' && this.isSubscriptionActive()) return 'premium';
  return 'free';
};

// Load dynamic token limits
userSchema.methods.loadTokenLimits = async function() {
  const TokenLimits = require('./TokenLimits');
  const subscriptionType = this.getSubscriptionStatus();
  
  try {
    const limits = await TokenLimits.getLimitsForSubscription(subscriptionType);
    this.tokenLimits.dailyLimit = limits.dailyLimit;
    this.tokenLimits.monthlyLimit = limits.monthlyLimit;
    await this.save();
    return limits;
  } catch (error) {
    console.error('Error loading token limits:', error);
    // Keep existing limits if loading fails
    return {
      dailyLimit: this.tokenLimits.dailyLimit,
      monthlyLimit: this.tokenLimits.monthlyLimit
    };
  }
};

// Get full name
userSchema.methods.getFullName = function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  if (this.firstName) return this.firstName;
  if (this.lastName) return this.lastName;
  return this.email ? this.email.split('@')[0] : 'Guest User';
};

// Token management methods
userSchema.methods.canUseTokens = function(tokensNeeded = 0) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDailyReset = new Date(this.tokenUsage.lastDailyResetDate);
  const lastMonthlyReset = new Date(this.tokenUsage.lastTokenResetDate);
  
  // Reset daily tokens if it's a new day
  if (today > lastDailyReset) {
    this.tokenUsage.dailyTokensUsed = 0;
    this.tokenUsage.lastDailyResetDate = now;
  }
  
  // Reset monthly tokens if it's a new month
  if (now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear()) {
    this.tokenUsage.monthlyTokensUsed = 0;
    this.tokenUsage.lastTokenResetDate = now;
  }
  
  const dailyRemaining = this.tokenLimits.dailyLimit - this.tokenUsage.dailyTokensUsed;
  const monthlyRemaining = this.tokenLimits.monthlyLimit - this.tokenUsage.monthlyTokensUsed;
  
  return {
    canUse: dailyRemaining >= tokensNeeded && monthlyRemaining >= tokensNeeded,
    dailyRemaining,
    monthlyRemaining,
    dailyLimit: this.tokenLimits.dailyLimit,
    monthlyLimit: this.tokenLimits.monthlyLimit,
    dailyUsed: this.tokenUsage.dailyTokensUsed,
    monthlyUsed: this.tokenUsage.monthlyTokensUsed
  };
};

userSchema.methods.consumeTokens = async function(tokensUsed, inputTokens = 0, outputTokens = 0) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDailyReset = new Date(this.tokenUsage.lastDailyResetDate);
  const lastMonthlyReset = new Date(this.tokenUsage.lastTokenResetDate);
  
  // If input/output not provided, split total evenly (fallback)
  if (inputTokens === 0 && outputTokens === 0 && tokensUsed > 0) {
    inputTokens = Math.ceil(tokensUsed * 0.3); // Estimate 30% input
    outputTokens = Math.ceil(tokensUsed * 0.7); // Estimate 70% output
  }
  
  // Reset daily tokens if it's a new day
  if (today > lastDailyReset) {
    this.tokenUsage.dailyTokensUsed = 0;
    this.tokenUsage.dailyInputTokens = 0;
    this.tokenUsage.dailyOutputTokens = 0;
    this.tokenUsage.lastDailyResetDate = now;
  }
  
  // Reset monthly tokens if it's a new month
  if (now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear()) {
    this.tokenUsage.monthlyTokensUsed = 0;
    this.tokenUsage.monthlyInputTokens = 0;
    this.tokenUsage.monthlyOutputTokens = 0;
    this.tokenUsage.lastTokenResetDate = now;
  }
  
  // Update token usage
  this.tokenUsage.totalTokensUsed += tokensUsed;
  this.tokenUsage.totalInputTokens += inputTokens;
  this.tokenUsage.totalOutputTokens += outputTokens;
  
  this.tokenUsage.dailyTokensUsed += tokensUsed;
  this.tokenUsage.dailyInputTokens += inputTokens;
  this.tokenUsage.dailyOutputTokens += outputTokens;
  
  this.tokenUsage.monthlyTokensUsed += tokensUsed;
  this.tokenUsage.monthlyInputTokens += inputTokens;
  this.tokenUsage.monthlyOutputTokens += outputTokens;
  
  await this.save();
  
  return {
    totalUsed: this.tokenUsage.totalTokensUsed,
    totalInputTokens: this.tokenUsage.totalInputTokens,
    totalOutputTokens: this.tokenUsage.totalOutputTokens,
    dailyUsed: this.tokenUsage.dailyTokensUsed,
    dailyInputTokens: this.tokenUsage.dailyInputTokens,
    dailyOutputTokens: this.tokenUsage.dailyOutputTokens,
    monthlyUsed: this.tokenUsage.monthlyTokensUsed,
    monthlyInputTokens: this.tokenUsage.monthlyInputTokens,
    monthlyOutputTokens: this.tokenUsage.monthlyOutputTokens,
    dailyRemaining: this.tokenLimits.dailyLimit - this.tokenUsage.dailyTokensUsed,
    monthlyRemaining: this.tokenLimits.monthlyLimit - this.tokenUsage.monthlyTokensUsed
  };
};

userSchema.methods.getTokenUsage = async function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDailyReset = new Date(this.tokenUsage.lastDailyResetDate);
  const lastMonthlyReset = new Date(this.tokenUsage.lastTokenResetDate);
  
  let needsSave = false;
  
  // Reset daily tokens if it's a new day
  if (today > lastDailyReset) {
    this.tokenUsage.dailyTokensUsed = 0;
    this.tokenUsage.dailyInputTokens = 0;
    this.tokenUsage.dailyOutputTokens = 0;
    this.tokenUsage.lastDailyResetDate = now;
    needsSave = true;
  }
  
  // Reset monthly tokens if it's a new month
  if (now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear()) {
    this.tokenUsage.monthlyTokensUsed = 0;
    this.tokenUsage.monthlyInputTokens = 0;
    this.tokenUsage.monthlyOutputTokens = 0;
    this.tokenUsage.lastTokenResetDate = now;
    needsSave = true;
  }
  
  // Save if any resets occurred
  if (needsSave) {
    try {
      await this.save();
    } catch (error) {
      console.error('Error saving token usage reset:', error);
    }
  }
  
  return {
    totalUsed: this.tokenUsage.totalTokensUsed,
    totalInputTokens: this.tokenUsage.totalInputTokens,
    totalOutputTokens: this.tokenUsage.totalOutputTokens,
    dailyUsed: this.tokenUsage.dailyTokensUsed,
    dailyInputTokens: this.tokenUsage.dailyInputTokens,
    dailyOutputTokens: this.tokenUsage.dailyOutputTokens,
    monthlyUsed: this.tokenUsage.monthlyTokensUsed,
    monthlyInputTokens: this.tokenUsage.monthlyInputTokens,
    monthlyOutputTokens: this.tokenUsage.monthlyOutputTokens,
    dailyRemaining: this.tokenLimits.dailyLimit - this.tokenUsage.dailyTokensUsed,
    monthlyRemaining: this.tokenLimits.monthlyLimit - this.tokenUsage.monthlyTokensUsed,
    dailyLimit: this.tokenLimits.dailyLimit,
    monthlyLimit: this.tokenLimits.monthlyLimit,
    dailyPercentage: Math.round((this.tokenUsage.dailyTokensUsed / this.tokenLimits.dailyLimit) * 100),
    monthlyPercentage: Math.round((this.tokenUsage.monthlyTokensUsed / this.tokenLimits.monthlyLimit) * 100)
  };
};

module.exports = mongoose.model('User', userSchema);
