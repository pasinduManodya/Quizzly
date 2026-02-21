// Simple endpoint to seed token limits - can be called via API
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Seed default token limits
router.post('/seed-token-limits', adminAuth, asyncHandler(async (req, res) => {
  try {
    console.log('🌱 Starting token limits seeding...');

    // Dynamically require TokenLimits model
    let TokenLimits;
    try {
      TokenLimits = require('../models/TokenLimits');
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'TokenLimits model not found. Please ensure the model file exists.',
        error: error.message
      });
    }

    // Default token limits
    const defaultLimits = [
      {
        subscriptionType: 'guest',
        dailyLimit: 100,
        monthlyLimit: 1000,
        description: 'Trial users - Limited access for testing'
      },
      {
        subscriptionType: 'free',
        dailyLimit: 200,
        monthlyLimit: 5000,
        description: 'Free tier users - Basic usage limits'
      },
      {
        subscriptionType: 'pro',
        dailyLimit: 2000,
        monthlyLimit: 50000,
        description: 'Pro users - Enhanced limits for power users'
      },
      {
        subscriptionType: 'premium',
        dailyLimit: 10000,
        monthlyLimit: 200000,
        description: 'Premium users - Maximum limits for enterprise use'
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const limitData of defaultLimits) {
      const existing = await TokenLimits.findOne({ subscriptionType: limitData.subscriptionType });
      
      if (existing) {
        // Update existing limits
        existing.dailyLimit = limitData.dailyLimit;
        existing.monthlyLimit = limitData.monthlyLimit;
        existing.description = limitData.description;
        existing.lastModifiedBy = req.user._id;
        await existing.save();
        updatedCount++;
        console.log(`✅ Updated limits for ${limitData.subscriptionType}: ${limitData.dailyLimit}/${limitData.monthlyLimit}`);
      } else {
        // Create new limits
        await TokenLimits.create({
          ...limitData,
          createdBy: req.user._id,
          lastModifiedBy: req.user._id
        });
        createdCount++;
        console.log(`✅ Created limits for ${limitData.subscriptionType}: ${limitData.dailyLimit}/${limitData.monthlyLimit}`);
      }
    }

    // Apply limits to all users
    console.log('🔄 Applying limits to all users...');
    const users = await User.find({});
    let appliedCount = 0;

    for (const user of users) {
      try {
        await user.loadTokenLimits();
        appliedCount++;
      } catch (error) {
        console.error(`❌ Error updating limits for user ${user.email}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Token limits seeded successfully',
      data: {
        created: createdCount,
        updated: updatedCount,
        usersUpdated: appliedCount
      }
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed token limits',
      error: error.message
    });
  }
}));

module.exports = router;
