const express = require('express');
const mongoose = require('mongoose');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Document = require('../models/Document');
const QuizResult = require('../models/QuizResult');
const Favorite = require('../models/Favorite');
// const TokenLimits = require('../models/TokenLimits'); // Commented out temporarily
const { 
  ValidationError, 
  AuthenticationError, 
  ConflictError, 
  asyncHandler,
  logger 
} = require('../middleware/errorHandler');

const router = express.Router();

// Get all users
router.get('/users', adminAuth, asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('-password')
    .populate('documents', 'title uploadedAt')
    .sort({ createdAt: -1 });

  // Get actual quiz counts from QuizResult collection
  const userIds = users.map(user => user._id);
  const quizCounts = await QuizResult.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: '$user', count: { $sum: 1 } } }
  ]);

  // Create a map for quick lookup
  const quizCountMap = {};
  quizCounts.forEach(item => {
    quizCountMap[item._id.toString()] = item.count;
  });

  res.json({
    success: true,
    data: {
      users: users.map(user => ({
        id: user._id,
        email: user.email || 'Guest User',
        fullName: user.getFullName(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        role: user.role,
        isGuest: user.isGuest,
        isPro: user.isPro,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.getSubscriptionStatus(),
        subscriptionExpiry: user.subscriptionExpiry,
        subscriptionStartDate: user.subscriptionStartDate,
        paymentMethod: user.paymentMethod,
        maxDocuments: user.maxDocuments,
        documentsCount: user.documents.length,
        totalQuizzesTaken: quizCountMap[user._id.toString()] || user.totalQuizzesTaken || 0,
        totalDocumentsUploaded: user.totalDocumentsUploaded,
        tokenUsage: user.getTokenUsage(),
        createdAt: user.createdAt,
        lastActivity: user.lastActivity,
        lastLoginDate: user.lastLoginDate,
        timezone: user.timezone
      }))
    }
  });
}));

// Get user by ID
router.get('/users/:userId', adminAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .select('-password')
    .populate('documents', 'title uploadedAt fileSize')
    .populate({
      path: 'documents',
      populate: {
        path: 'quizResults',
        model: 'QuizResult'
      }
    });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get actual quiz count for this user
  const actualQuizCount = await QuizResult.countDocuments({ user: user._id });

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email || 'Guest User',
        fullName: user.getFullName(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        role: user.role,
        isGuest: user.isGuest,
        isPro: user.isPro,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.getSubscriptionStatus(),
        subscriptionExpiry: user.subscriptionExpiry,
        subscriptionStartDate: user.subscriptionStartDate,
        paymentMethod: user.paymentMethod,
        maxDocuments: user.maxDocuments,
        documents: user.documents,
        totalQuizzesTaken: actualQuizCount || user.totalQuizzesTaken || 0,
        totalDocumentsUploaded: user.totalDocumentsUploaded,
        tokenUsage: user.getTokenUsage(),
        createdAt: user.createdAt,
        lastActivity: user.lastActivity,
        lastLoginDate: user.lastLoginDate,
        timezone: user.timezone
      }
    }
  });
}));

// Update user role
router.patch('/users/:userId/role', adminAuth, asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  if (!['user', 'admin'].includes(role)) {
    throw new ValidationError('Role must be either "user" or "admin"');
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.role = role;
  await user.save();

  logger.info(`Admin ${req.user.email} updated user ${user.email} role to ${role}`, {
    adminId: req.user._id,
    targetUserId: user._id,
    newRole: role
  });

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email || 'Guest User',
        role: user.role
      }
    }
  });
}));

// Update user subscription
router.patch('/users/:userId/subscription', adminAuth, asyncHandler(async (req, res) => {
  const { 
    isPro, 
    subscriptionType, 
    subscriptionExpiry, 
    subscriptionStartDate, 
    paymentMethod 
  } = req.body;
  
  if (subscriptionType && !['free', 'pro', 'premium'].includes(subscriptionType)) {
    throw new ValidationError('Subscription type must be "free", "pro", or "premium"');
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update subscription fields
  if (typeof isPro === 'boolean') user.isPro = isPro;
  if (subscriptionType) user.subscriptionType = subscriptionType;
  // Handle subscriptionExpiry - can be null for free plans
  if (subscriptionExpiry !== undefined) {
    user.subscriptionExpiry = subscriptionExpiry ? new Date(subscriptionExpiry) : null;
  }
  if (subscriptionStartDate) user.subscriptionStartDate = new Date(subscriptionStartDate);
  // Handle paymentMethod - can be null for free plans
  if (paymentMethod !== undefined) {
    user.paymentMethod = paymentMethod || null;
  }

  await user.save();
  
  // Reload token limits based on new subscription status
  try {
    await user.loadTokenLimits();
  } catch (limitError) {
    console.error('Error loading token limits after subscription update:', limitError);
    // Don't fail the request, just log the error
  }

  logger.info(`Admin ${req.user.email} updated user ${user.email} subscription`, {
    adminId: req.user._id,
    targetUserId: user._id,
    subscriptionType: user.subscriptionType,
    isPro: user.isPro
  });

  res.json({
    success: true,
    message: 'User subscription updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email || 'Guest User',
        isPro: user.isPro,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.getSubscriptionStatus(),
        subscriptionExpiry: user.subscriptionExpiry,
        subscriptionStartDate: user.subscriptionStartDate,
        paymentMethod: user.paymentMethod
      }
    }
  });
}));

// Delete user
router.delete('/users/:userId', adminAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Delete associated documents, quiz results, and favorites
  await Document.deleteMany({ user: user._id });
  await QuizResult.deleteMany({ user: user._id });
  await Favorite.deleteMany({ user: user._id });
  
  await User.findByIdAndDelete(req.params.userId);

  logger.info(`Admin ${req.user.email} deleted user ${user.email}`, {
    adminId: req.user._id,
    deletedUserId: user._id
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// Get all documents
router.get('/documents', adminAuth, asyncHandler(async (req, res) => {
  const documents = await Document.find({})
    .populate('user', 'email role')
    .populate('quizResults', 'score totalQuestions createdAt')
    .sort({ uploadedAt: -1 });

  res.json({
    success: true,
    data: {
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        user: {
          id: doc.user._id,
          email: doc.user.email || 'Guest User',
          role: doc.user.role
        },
        quizResultsCount: doc.quizResults.length,
        averageScore: doc.quizResults.length > 0 
          ? Math.round(doc.quizResults.reduce((sum, result) => sum + result.score, 0) / doc.quizResults.length)
          : 0
      }))
    }
  });
}));

// Get all quiz results
router.get('/quiz-results', adminAuth, asyncHandler(async (req, res) => {
  const quizResults = await QuizResult.find({})
    .populate('user', 'email role')
    .populate('document', 'title')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      quizResults: quizResults.map(result => ({
        id: result._id,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        createdAt: result.createdAt,
        user: {
          id: result.user._id,
          email: result.user.email || 'Guest User',
          role: result.user.role
        },
        document: {
          id: result.document._id,
          title: result.document.title
        }
      }))
    }
  });
}));

// Get user token usage
router.get('/users/:userId/token-usage', adminAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const tokenUsage = user.getTokenUsage();
  
  res.json({
    success: true,
    data: {
      userId: user._id,
      email: user.email || 'Guest User',
      subscriptionType: user.subscriptionType,
      subscriptionStatus: user.getSubscriptionStatus(),
      tokenUsage: tokenUsage
    }
  });
}));

// Update user token limits
router.patch('/users/:userId/token-limits', adminAuth, asyncHandler(async (req, res) => {
  const { monthlyLimit, dailyLimit } = req.body;
  
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (monthlyLimit !== undefined) user.tokenLimits.monthlyLimit = monthlyLimit;
  if (dailyLimit !== undefined) user.tokenLimits.dailyLimit = dailyLimit;
  
  await user.save();

  logger.info(`Admin ${req.user.email} updated user ${user.email} token limits`, {
    adminId: req.user._id,
    targetUserId: user._id,
    monthlyLimit: user.tokenLimits.monthlyLimit,
    dailyLimit: user.tokenLimits.dailyLimit
  });

  res.json({
    success: true,
    message: 'Token limits updated successfully',
    data: {
      userId: user._id,
      email: user.email || 'Guest User',
      tokenLimits: user.tokenLimits
    }
  });
}));

// Reset user token usage
router.post('/users/:userId/reset-tokens', adminAuth, asyncHandler(async (req, res) => {
  const { resetType } = req.body; // 'daily', 'monthly', or 'all'
  
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const now = new Date();
  
  if (resetType === 'daily' || resetType === 'all') {
    user.tokenUsage.dailyTokensUsed = 0;
    user.tokenUsage.lastDailyResetDate = now;
  }
  
  if (resetType === 'monthly' || resetType === 'all') {
    user.tokenUsage.monthlyTokensUsed = 0;
    user.tokenUsage.lastTokenResetDate = now;
  }
  
  if (resetType === 'all') {
    user.tokenUsage.totalTokensUsed = 0;
  }
  
  await user.save();

  logger.info(`Admin ${req.user.email} reset user ${user.email} token usage`, {
    adminId: req.user._id,
    targetUserId: user._id,
    resetType: resetType
  });

  res.json({
    success: true,
    message: `Token usage reset successfully (${resetType})`,
    data: {
      userId: user._id,
      email: user.email || 'Guest User',
      tokenUsage: user.getTokenUsage()
    }
  });
}));

// Get all token limits
router.get('/token-limits', adminAuth, asyncHandler(async (req, res) => {
  try {
    const TokenLimits = require('../models/TokenLimits');
    const limits = await TokenLimits.getAllActiveLimits();
    
    res.json({
      success: true,
      data: {
        limits: limits.map(limit => ({
          id: limit._id,
          subscriptionType: limit.subscriptionType,
          dailyLimit: limit.dailyLimit,
          monthlyLimit: limit.monthlyLimit,
          description: limit.description,
          isActive: limit.isActive,
          createdAt: limit.createdAt,
          updatedAt: limit.updatedAt,
          createdBy: limit.createdBy,
          lastModifiedBy: limit.lastModifiedBy
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'TokenLimits model not available',
      error: error.message
    });
  }
}));

// Update token limits for a subscription type
router.patch('/token-limits/:subscriptionType', adminAuth, asyncHandler(async (req, res) => {
  try {
    const TokenLimits = require('../models/TokenLimits');
    const { subscriptionType } = req.params;
    const { dailyLimit, monthlyLimit, description } = req.body;
    
    if (!['guest', 'free', 'pro', 'premium'].includes(subscriptionType)) {
      throw new ValidationError('Invalid subscription type');
    }
    
    if (dailyLimit !== undefined && (dailyLimit < 0 || !Number.isInteger(dailyLimit))) {
      throw new ValidationError('Daily limit must be a non-negative integer');
    }
    
    if (monthlyLimit !== undefined && (monthlyLimit < 0 || !Number.isInteger(monthlyLimit))) {
      throw new ValidationError('Monthly limit must be a non-negative integer');
    }
    
    const limits = await TokenLimits.updateLimits(subscriptionType, {
      dailyLimit,
      monthlyLimit,
      description
    }, req.user._id);
  
    // Reload limits for all users with this subscription type
    // This ensures existing users get the updated limits immediately
    try {
      const User = require('../models/User');
      let query = {};
      
      // Find all users (we'll check their actual subscription status to match correctly)
      // For guest, only get guest users. For others, exclude guests.
      const userQuery = subscriptionType === 'guest' 
        ? { isGuest: true }
        : { isGuest: { $ne: true } };
      
      const allUsers = await User.find(userQuery);
      let updatedCount = 0;
      
      for (const user of allUsers) {
        try {
          // Get the user's actual subscription status (checks isPro, subscriptionType, and active status)
          const userSubscriptionStatus = user.getSubscriptionStatus();
          
          // Only update users whose subscription status matches the updated plan
          if (userSubscriptionStatus === subscriptionType) {
            await user.loadTokenLimits();
            updatedCount++;
          }
        } catch (userError) {
          console.error(`Error updating limits for user ${user._id}:`, userError);
        }
      }
      
      logger.info(`Updated token limits for ${updatedCount} users with ${subscriptionType} subscription`);
    } catch (bulkUpdateError) {
      console.error('Error bulk updating user limits:', bulkUpdateError);
      // Don't fail the request, just log the error
      // Users will get updated limits on next login or /me call
    }
  
    logger.info(`Admin ${req.user.email} updated token limits for ${subscriptionType}`, {
      adminId: req.user._id,
      subscriptionType,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit
    });
    
    res.json({
      success: true,
      message: 'Token limits updated successfully',
      data: {
        id: limits._id,
        subscriptionType: limits.subscriptionType,
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit,
        description: limits.description,
        updatedAt: limits.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'TokenLimits model not available',
      error: error.message
    });
  }
}));

// Create new token limits
router.post('/token-limits', adminAuth, asyncHandler(async (req, res) => {
  const { subscriptionType, dailyLimit, monthlyLimit, description } = req.body;
  
  if (!subscriptionType || !['guest', 'free', 'pro', 'premium'].includes(subscriptionType)) {
    throw new ValidationError('Valid subscription type is required');
  }
  
  if (!dailyLimit || !monthlyLimit || dailyLimit < 0 || monthlyLimit < 0) {
    throw new ValidationError('Valid daily and monthly limits are required');
  }
  
  // Check if limits already exist
  const existing = await TokenLimits.findOne({ subscriptionType });
  if (existing) {
    throw new ConflictError('Token limits for this subscription type already exist');
  }
  
  const limits = await TokenLimits.create({
    subscriptionType,
    dailyLimit,
    monthlyLimit,
    description: description || '',
    createdBy: req.user._id,
    lastModifiedBy: req.user._id
  });
  
  logger.info(`Admin ${req.user.email} created token limits for ${subscriptionType}`, {
    adminId: req.user._id,
    subscriptionType,
    dailyLimit: limits.dailyLimit,
    monthlyLimit: limits.monthlyLimit
  });
  
  res.json({
    success: true,
    message: 'Token limits created successfully',
    data: {
      id: limits._id,
      subscriptionType: limits.subscriptionType,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
      description: limits.description,
      createdAt: limits.createdAt
    }
  });
}));

// Delete token limits
router.delete('/token-limits/:subscriptionType', adminAuth, asyncHandler(async (req, res) => {
  const { subscriptionType } = req.params;
  
  const limits = await TokenLimits.findOne({ subscriptionType });
  if (!limits) {
    return res.status(404).json({
      success: false,
      message: 'Token limits not found'
    });
  }
  
  await TokenLimits.findByIdAndDelete(limits._id);
  
  logger.info(`Admin ${req.user.email} deleted token limits for ${subscriptionType}`, {
    adminId: req.user._id,
    subscriptionType
  });
  
  res.json({
    success: true,
    message: 'Token limits deleted successfully'
  });
}));

// Apply token limits to all users
router.post('/token-limits/apply-to-all-users', adminAuth, asyncHandler(async (req, res) => {
  const users = await User.find({});
  let updatedCount = 0;
  
  for (const user of users) {
    try {
      await user.loadTokenLimits();
      updatedCount++;
    } catch (error) {
      console.error(`Error updating limits for user ${user.email}:`, error);
    }
  }
  
  logger.info(`Admin ${req.user.email} applied token limits to all users`, {
    adminId: req.user._id,
    totalUsers: users.length,
    updatedCount
  });
  
  res.json({
    success: true,
    message: `Token limits applied to ${updatedCount} users`,
    data: {
      totalUsers: users.length,
      updatedCount
    }
  });
}));

// Get comprehensive system analytics
router.get('/analytics', adminAuth, asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Basic counts
  const [
    totalUsers,
    totalAdmins,
    totalGuests,
    totalDocuments,
    totalQuizResults,
    recentUsers,
    recentDocuments,
    recentQuizResults
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isGuest: true }),
    Document.countDocuments(),
    QuizResult.countDocuments(),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Document.countDocuments({ uploadedAt: { $gte: weekAgo } }),
    QuizResult.countDocuments({ createdAt: { $gte: weekAgo } })
  ]);

  // Token usage analytics
  const tokenAnalytics = await User.aggregate([
    {
      $group: {
        _id: null,
        totalTokensUsed: { $sum: '$tokenUsage.totalTokensUsed' },
        avgDailyTokens: { $avg: '$tokenUsage.dailyTokensUsed' },
        avgMonthlyTokens: { $avg: '$tokenUsage.monthlyTokensUsed' },
        maxTokensUsed: { $max: '$tokenUsage.totalTokensUsed' }
      }
    }
  ]);

  // User activity analytics
  const userActivityAnalytics = await User.aggregate([
    {
      $group: {
        _id: null,
        avgLastActivity: { $avg: { $toLong: '$lastActivity' } },
        usersActiveToday: {
          $sum: {
            $cond: [
              { $gte: ['$lastActivity', today] },
              1,
              0
            ]
          }
        },
        usersActiveThisWeek: {
          $sum: {
            $cond: [
              { $gte: ['$lastActivity', weekAgo] },
              1,
              0
            ]
          }
        },
        usersActiveThisMonth: {
          $sum: {
            $cond: [
              { $gte: ['$lastActivity', monthAgo] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  // Subscription analytics
  const subscriptionAnalytics = await User.aggregate([
    {
      $group: {
        _id: '$subscriptionType',
        count: { $sum: 1 },
        totalTokens: { $sum: '$tokenUsage.totalTokensUsed' },
        avgTokens: { $avg: '$tokenUsage.totalTokensUsed' }
      }
    }
  ]);

  // Daily activity for the last 30 days
  const dailyActivity = await User.aggregate([
    {
      $match: {
        lastActivity: { $gte: monthAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$lastActivity' },
          month: { $month: '$lastActivity' },
          day: { $dayOfMonth: '$lastActivity' }
        },
        activeUsers: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Quiz performance analytics
  const quizAnalytics = await QuizResult.aggregate([
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' },
        totalQuizzes: { $sum: 1 },
        highScores: {
          $sum: {
            $cond: [{ $gte: ['$score', 80] }, 1, 0]
          }
        },
        lowScores: {
          $sum: {
            $cond: [{ $lt: ['$score', 50] }, 1, 0]
          }
        }
      }
    }
  ]);

  // Top users by token usage
  const topTokenUsers = await User.find({})
    .select('email tokenUsage.totalTokensUsed subscriptionType lastActivity')
    .sort({ 'tokenUsage.totalTokensUsed': -1 })
    .limit(10);

  // Document analytics
  const documentAnalytics = await Document.aggregate([
    {
      $group: {
        _id: null,
        avgQuestionsPerDoc: { $avg: { $size: '$questions' } },
        totalQuestions: { $sum: { $size: '$questions' } },
        avgDocSize: { $avg: { $strLenCP: '$extractedText' } }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          guests: totalGuests,
          regular: totalUsers - totalAdmins - totalGuests,
          newThisWeek: recentUsers
        },
        documents: {
          total: totalDocuments,
          newThisWeek: recentDocuments
        },
        quizzes: {
          total: totalQuizResults,
          newThisWeek: recentQuizResults
        }
      },
      tokenAnalytics: {
        totalTokensUsed: tokenAnalytics[0]?.totalTokensUsed || 0,
        averageDailyTokens: Math.round(tokenAnalytics[0]?.avgDailyTokens || 0),
        averageMonthlyTokens: Math.round(tokenAnalytics[0]?.avgMonthlyTokens || 0),
        maxTokensUsed: tokenAnalytics[0]?.maxTokensUsed || 0,
        topUsers: topTokenUsers.map(user => ({
          email: user.email,
          totalTokens: user.tokenUsage.totalTokensUsed,
          subscriptionType: user.subscriptionType,
          lastActivity: user.lastActivity
        }))
      },
      userActivity: {
        activeToday: userActivityAnalytics[0]?.usersActiveToday || 0,
        activeThisWeek: userActivityAnalytics[0]?.usersActiveThisWeek || 0,
        activeThisMonth: userActivityAnalytics[0]?.usersActiveThisMonth || 0,
        dailyActivity: dailyActivity.map(day => ({
          date: new Date(day._id.year, day._id.month - 1, day._id.day).toISOString().split('T')[0],
          activeUsers: day.activeUsers
        }))
      },
      subscriptionAnalytics: subscriptionAnalytics.map(sub => ({
        type: sub._id || 'free',
        count: sub.count,
        totalTokens: sub.totalTokens,
        averageTokens: Math.round(sub.avgTokens)
      })),
      quizAnalytics: {
        averageScore: Math.round(quizAnalytics[0]?.averageScore || 0),
        totalQuizzes: quizAnalytics[0]?.totalQuizzes || 0,
        highScores: quizAnalytics[0]?.highScores || 0,
        lowScores: quizAnalytics[0]?.lowScores || 0,
        successRate: quizAnalytics[0]?.totalQuizzes > 0 
          ? Math.round((quizAnalytics[0].highScores / quizAnalytics[0].totalQuizzes) * 100)
          : 0
      },
      documentAnalytics: {
        averageQuestionsPerDoc: Math.round(documentAnalytics[0]?.avgQuestionsPerDoc || 0),
        totalQuestions: documentAnalytics[0]?.totalQuestions || 0,
        averageDocSize: Math.round(documentAnalytics[0]?.avgDocSize || 0)
      }
    }
  });
}));

// Get system statistics (legacy endpoint for backward compatibility)
router.get('/stats', adminAuth, asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalAdmins,
    totalGuests,
    totalDocuments,
    totalQuizResults,
    recentUsers,
    recentDocuments
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isGuest: true }),
    Document.countDocuments(),
    QuizResult.countDocuments(),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    Document.countDocuments({ uploadedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
  ]);

  // Calculate average quiz score
  const avgScoreResult = await QuizResult.aggregate([
    { $group: { _id: null, avgScore: { $avg: '$score' } } }
  ]);
  const averageQuizScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

  res.json({
    success: true,
    data: {
      stats: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          guests: totalGuests,
          regular: totalUsers - totalAdmins - totalGuests
        },
        documents: {
          total: totalDocuments,
          recent: recentDocuments
        },
        quizResults: {
          total: totalQuizResults,
          averageScore: averageQuizScore
        },
        recent: {
          newUsers: recentUsers,
          newDocuments: recentDocuments
        }
      }
    }
  });
}));

// Give unlimited tokens to a specific user (for testing)
router.post('/give-unlimited-tokens', adminAuth, asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`🔍 Found user: ${user.email}`);
    console.log(`📊 Current token limits:`, {
      dailyLimit: user.tokenLimits.dailyLimit,
      monthlyLimit: user.tokenLimits.monthlyLimit
    });
    
    // Set unlimited tokens (very high values)
    user.tokenLimits.dailyLimit = 1000000; // 1 million tokens per day
    user.tokenLimits.monthlyLimit = 10000000; // 10 million tokens per month
    
    // Reset current usage to 0
    user.tokenUsage.dailyTokensUsed = 0;
    user.tokenUsage.monthlyTokensUsed = 0;
    user.tokenUsage.totalTokensUsed = 0;
    
    await user.save();
    
    logger.info(`Admin ${req.user.email} gave unlimited tokens to ${email}`, {
      adminId: req.user._id,
      targetUser: user._id,
      targetEmail: email
    });
    
    res.json({
      success: true,
      message: `Unlimited token access granted to ${email}`,
      data: {
        email: user.email,
        tokenLimits: {
          dailyLimit: user.tokenLimits.dailyLimit,
          monthlyLimit: user.tokenLimits.monthlyLimit
        },
        tokenUsage: {
          dailyUsed: user.tokenUsage.dailyTokensUsed,
          monthlyUsed: user.tokenUsage.monthlyTokensUsed,
          totalUsed: user.tokenUsage.totalTokensUsed
        }
      }
    });
    
  } catch (error) {
      logger.error('Error giving unlimited tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }));

module.exports = router;
