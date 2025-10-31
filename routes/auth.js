const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { 
  ValidationError, 
  AuthenticationError, 
  ConflictError, 
  asyncHandler,
  logger 
} = require('../middleware/errorHandler');

const router = express.Router();

// Register
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error('Email already registered');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], asyncHandler(async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    throw new ValidationError(errorMessages.join(', '));
  }

  const { email, password } = req.body;

  logger.info(`Registration attempt for email: ${email}`, {
    email,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Create new user (ensure email is provided for regular users)
  const user = new User({ 
    email: email, 
    password: password,
    isGuest: false // Explicitly set as non-guest
  });
  await user.save();

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development';
  const token = jwt.sign(
    { userId: user._id },
    jwtSecret,
    { expiresIn: '7d' }
  );

  logger.info(`User registered successfully: ${user._id}`, {
    userId: user._id,
    email: user.email
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        maxDocuments: user.maxDocuments,
        role: user.role
      }
    }
  });
}));

// Login
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], asyncHandler(async (req, res) => {
  try {
    console.log('\n🔑 === LOGIN ROUTE STARTED ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB not connected');
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again later.',
        error: 'MongoDB not connected'
      });
    }
    console.log('✅ MongoDB connected');

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      const errorMessages = errors.array().map(err => err.msg);
      throw new ValidationError(errorMessages.join(', '));
    }
    console.log('✅ Validation passed');

    const { email, password } = req.body;
    console.log('Email:', email);
    console.log('Password length:', password ? password.length : 'undefined');

  logger.info(`Login attempt for email: ${email}`, {
    email,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Find user
  let user;
  try {
    console.log('🔍 Searching for user with email:', email);
    user = await User.findOne({ email });
    console.log('User found:', !!user);
  } catch (dbError) {
    console.error('❌ Database query error during login:', dbError);
    return res.status(503).json({ 
      message: 'Database connection issue. Please try again later.',
      error: 'Database query failed'
    });
  }
  
  if (!user) {
    logger.warn(`Login failed - user not found: ${email}`, {
      email,
      ip: req.ip
    });
    throw new AuthenticationError('Invalid email or password');
  }

  // Check password
  // Guard against users without a stored password (e.g., legacy/guest)
  if (!user.password) {
    logger.warn(`Login failed - no password set for: ${email}`, {
      email,
      userId: user._id,
      ip: req.ip
    });
    throw new AuthenticationError('Invalid email or password');
  }

  let isMatch = false;
  try {
    isMatch = await user.comparePassword(password);
  } catch (compareError) {
    console.error('❌ Password comparison error during login:', compareError);
    logger.error('Password comparison error', {
      email,
      userId: user._id,
      error: compareError.message
    });
    throw new AuthenticationError('Invalid email or password');
  }
  if (!isMatch) {
    logger.warn(`Login failed - invalid password for: ${email}`, {
      email,
      userId: user._id,
      ip: req.ip
    });
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last activity
  try {
    await user.updateActivity();
  } catch (dbError) {
    console.error('Database update error during login:', dbError);
    // Don't fail login for this, just log the error
  }

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development';
  const token = jwt.sign(
    { userId: user._id },
    jwtSecret,
    { expiresIn: '7d' }
  );

  logger.info(`User logged in successfully: ${user._id}`, {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        maxDocuments: user.maxDocuments,
        role: user.role
      }
    }
  });
  } catch (error) {
    logger.error('Login error:', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });
    
    // Check if it's a database connection error
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again later.',
        error: 'Database connection failed'
      });
    }
    
    throw error;
  }
}));

// Guest login
router.post('/guest', asyncHandler(async (req, res) => {
  // Generate unique guest session ID
  const guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('Guest login attempt', {
    guestSessionId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Create guest user with unique email
  const guestEmail = `guest_${guestSessionId}@temp.local`;
  const guestUser = new User({
    email: guestEmail,
    isGuest: true,
    guestSessionId: guestSessionId,
    maxDocuments: 3
  });
  
  await guestUser.save();

  // Generate JWT token (shorter expiry for guests)
  const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development';
  const token = jwt.sign(
    { userId: guestUser._id },
    jwtSecret,
    { expiresIn: '24h' } // 24 hours for guests
  );

  logger.info(`Guest user created successfully: ${guestUser._id}`, {
    userId: guestUser._id,
    guestSessionId
  });

  res.json({
    success: true,
    message: 'Guest login successful',
    data: {
      token,
      user: {
        id: guestUser._id,
        email: 'Guest User',
        maxDocuments: guestUser.maxDocuments,
        isGuest: true,
        role: guestUser.role
      }
    }
  });
}));

// Get current user
router.get('/me', auth, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email || 'Guest User',
        maxDocuments: req.user.maxDocuments,
        isGuest: req.user.isGuest,
        role: req.user.role
      }
    }
  });
}));

module.exports = router;
