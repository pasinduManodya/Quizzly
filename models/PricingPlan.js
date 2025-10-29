const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    enum: ['free', 'pro', 'premium']
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: '$'
  },
  period: {
    type: String,
    required: true,
    enum: ['forever', 'month', 'year']
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
  features: [{
    type: String,
    required: true
  }],
  popular: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    required: true,
    enum: ['teal', 'violet', 'yellow']
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
pricingPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get all active pricing plans
pricingPlanSchema.statics.getActivePlans = function() {
  return this.find({ active: true }).sort({ price: 1 });
};

// Static method to get a specific plan by ID
pricingPlanSchema.statics.getPlanById = function(planId) {
  return this.findOne({ id: planId, active: true });
};

// Static method to initialize default plans
pricingPlanSchema.statics.initializeDefaultPlans = async function() {
  const defaultPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: '$',
      period: 'forever',
      dailyLimit: 3,
      monthlyLimit: 10,
      features: [
        '3 PDF uploads per day',
        '10 PDF uploads per month',
        'Basic MCQ quizzes',
        'AI-powered feedback',
        'Save favorites',
        'Guest access'
      ],
      color: 'teal',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      currency: '$',
      period: 'month',
      dailyLimit: 20,
      monthlyLimit: 100,
      features: [
        '20 PDF uploads per day',
        '100 PDF uploads per month',
        'MCQ + Essay quizzes',
        'Advanced AI feedback',
        'Unlimited favorites',
        'Priority support',
        'Export quiz results'
      ],
      color: 'violet',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      currency: '$',
      period: 'month',
      dailyLimit: 50,
      monthlyLimit: 500,
      features: [
        '50 PDF uploads per day',
        '500 PDF uploads per month',
        'All quiz types (MCQ, Essay, Mixed)',
        'Premium AI feedback',
        'Unlimited favorites',
        '24/7 priority support',
        'Export & analytics',
        'Custom quiz templates',
        'API access'
      ],
      color: 'yellow',
      popular: false
    }
  ];

  for (const planData of defaultPlans) {
    const existingPlan = await this.findOne({ id: planData.id });
    if (!existingPlan) {
      await this.create(planData);
      console.log(`Created default pricing plan: ${planData.name}`);
    }
  }
};

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);
