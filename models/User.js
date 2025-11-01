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
    monthlyTokensUsed: {
      type: Number,
      default: 0
    },
    dailyTokensUsed: {
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isGuest) return next();
  this.password = await bcrypt.hash(this.password, 12);
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

userSchema.methods.consumeTokens = async function(tokensUsed) {
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
  
  // Update token usage
  this.tokenUsage.totalTokensUsed += tokensUsed;
  this.tokenUsage.dailyTokensUsed += tokensUsed;
  this.tokenUsage.monthlyTokensUsed += tokensUsed;
  
  await this.save();
  
  return {
    totalUsed: this.tokenUsage.totalTokensUsed,
    dailyUsed: this.tokenUsage.dailyTokensUsed,
    monthlyUsed: this.tokenUsage.monthlyTokensUsed,
    dailyRemaining: this.tokenLimits.dailyLimit - this.tokenUsage.dailyTokensUsed,
    monthlyRemaining: this.tokenLimits.monthlyLimit - this.tokenUsage.monthlyTokensUsed
  };
};

userSchema.methods.getTokenUsage = function() {
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
  
  return {
    totalUsed: this.tokenUsage.totalTokensUsed,
    dailyUsed: this.tokenUsage.dailyTokensUsed,
    monthlyUsed: this.tokenUsage.monthlyTokensUsed,
    dailyRemaining: this.tokenLimits.dailyLimit - this.tokenUsage.dailyTokensUsed,
    monthlyRemaining: this.tokenLimits.monthlyLimit - this.tokenUsage.monthlyTokensUsed,
    dailyLimit: this.tokenLimits.dailyLimit,
    monthlyLimit: this.tokenLimits.monthlyLimit,
    dailyPercentage: Math.round((this.tokenUsage.dailyTokensUsed / this.tokenLimits.dailyLimit) * 100),
    monthlyPercentage: Math.round((this.tokenUsage.monthlyTokensUsed / this.tokenLimits.monthlyLimit) * 100)
  };
};

module.exports = mongoose.model('User', userSchema);
