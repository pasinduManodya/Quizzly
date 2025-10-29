const express = require('express');
const router = express.Router();
const PricingPlan = require('../models/PricingPlan');
const adminAuth = require('../middleware/adminAuth');
const asyncHandler = require('express-async-handler');

// GET /api/admin/pricing-plans - Get all pricing plans
router.get('/pricing-plans', adminAuth, asyncHandler(async (req, res) => {
  const plans = await PricingPlan.find().sort({ price: 1 });
  
  res.json({
    success: true,
    data: plans
  });
}));

// GET /api/admin/pricing-plans/:id - Get specific pricing plan
router.get('/pricing-plans/:id', adminAuth, asyncHandler(async (req, res) => {
  const plan = await PricingPlan.findOne({ id: req.params.id });
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Pricing plan not found'
    });
  }
  
  res.json({
    success: true,
    data: plan
  });
}));

// PUT /api/admin/pricing-plans/:id - Update pricing plan
router.put('/pricing-plans/:id', adminAuth, asyncHandler(async (req, res) => {
  const { name, price, currency, period, dailyLimit, monthlyLimit, features, popular, color, active } = req.body;
  
  // Validate required fields
  if (price < 0) {
    return res.status(400).json({
      success: false,
      message: 'Price must be non-negative'
    });
  }
  
  if (dailyLimit < 0 || monthlyLimit < 0) {
    return res.status(400).json({
      success: false,
      message: 'Limits must be non-negative'
    });
  }
  
  if (!features || !Array.isArray(features) || features.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Features must be a non-empty array'
    });
  }
  
  const plan = await PricingPlan.findOne({ id: req.params.id });
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Pricing plan not found'
    });
  }
  
  // Update plan
  plan.name = name || plan.name;
  plan.price = price !== undefined ? price : plan.price;
  plan.currency = currency || plan.currency;
  plan.period = period || plan.period;
  plan.dailyLimit = dailyLimit !== undefined ? dailyLimit : plan.dailyLimit;
  plan.monthlyLimit = monthlyLimit !== undefined ? monthlyLimit : plan.monthlyLimit;
  plan.features = features || plan.features;
  plan.popular = popular !== undefined ? popular : plan.popular;
  plan.color = color || plan.color;
  plan.active = active !== undefined ? active : plan.active;
  
  await plan.save();
  
  res.json({
    success: true,
    message: 'Pricing plan updated successfully',
    data: plan
  });
}));

// POST /api/admin/pricing-plans/initialize - Initialize default pricing plans
router.post('/pricing-plans/initialize', adminAuth, asyncHandler(async (req, res) => {
  await PricingPlan.initializeDefaultPlans();
  
  const plans = await PricingPlan.find().sort({ price: 1 });
  
  res.json({
    success: true,
    message: 'Default pricing plans initialized successfully',
    data: plans
  });
}));

// DELETE /api/admin/pricing-plans/:id - Soft delete pricing plan (set active to false)
router.delete('/pricing-plans/:id', adminAuth, asyncHandler(async (req, res) => {
  const plan = await PricingPlan.findOne({ id: req.params.id });
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Pricing plan not found'
    });
  }
  
  // Don't allow deletion of free plan
  if (plan.id === 'free') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete the free plan'
    });
  }
  
  plan.active = false;
  await plan.save();
  
  res.json({
    success: true,
    message: 'Pricing plan deactivated successfully'
  });
}));

// GET /api/pricing/plans - Public endpoint to get active pricing plans
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = await PricingPlan.getActivePlans();
  
  res.json({
    success: true,
    plans: plans
  });
}));

// GET /api/pricing/plans/:id - Public endpoint to get specific active pricing plan
router.get('/plans/:id', asyncHandler(async (req, res) => {
  const plan = await PricingPlan.getPlanById(req.params.id);
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Pricing plan not found'
    });
  }
  
  res.json({
    success: true,
    plan: plan
  });
}));

module.exports = router;
