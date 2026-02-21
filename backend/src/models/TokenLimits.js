const mongoose = require('mongoose');

const tokenLimitsSchema = new mongoose.Schema({
  subscriptionType: {
    type: String,
    enum: ['guest', 'free', 'pro', 'premium'],
    required: true,
    unique: true
  },
  dailyLimit: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyLimit: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Static method to get limits for a subscription type
tokenLimitsSchema.statics.getLimitsForSubscription = async function(subscriptionType) {
  const limits = await this.findOne({ 
    subscriptionType: subscriptionType,
    isActive: true 
  });
  
  if (!limits) {
    // Return default limits if not found
    const defaultLimits = {
      guest: { dailyLimit: 100, monthlyLimit: 1000 },
      free: { dailyLimit: 200, monthlyLimit: 5000 },
      pro: { dailyLimit: 2000, monthlyLimit: 50000 },
      premium: { dailyLimit: 10000, monthlyLimit: 200000 }
    };
    
    return defaultLimits[subscriptionType] || { dailyLimit: 200, monthlyLimit: 5000 };
  }
  
  return {
    dailyLimit: limits.dailyLimit,
    monthlyLimit: limits.monthlyLimit
  };
};

// Static method to get all active limits
tokenLimitsSchema.statics.getAllActiveLimits = async function() {
  return await this.find({ isActive: true }).sort({ subscriptionType: 1 });
};

// Static method to update limits
tokenLimitsSchema.statics.updateLimits = async function(subscriptionType, limits, modifiedBy) {
  const existing = await this.findOne({ subscriptionType });
  
  if (existing) {
    existing.dailyLimit = limits.dailyLimit;
    existing.monthlyLimit = limits.monthlyLimit;
    existing.description = limits.description || existing.description;
    existing.lastModifiedBy = modifiedBy;
    return await existing.save();
  } else {
    return await this.create({
      subscriptionType,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
      description: limits.description || '',
      createdBy: modifiedBy,
      lastModifiedBy: modifiedBy
    });
  }
};

module.exports = mongoose.model('TokenLimits', tokenLimitsSchema);
