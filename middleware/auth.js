const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('\n🔐 === AUTH MIDDLEWARE DEBUG ===');
    console.log('🔐 Request path:', req.path);
    console.log('🔐 Request method:', req.method);
    console.log('🔐 Authorization header:', req.header('Authorization'));
    console.log('🔐 All headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ AUTH ERROR: No Authorization header provided');
      return res.status(401).json({ 
        message: 'No Authorization header provided',
        error: 'Missing token',
        help: 'Include Authorization header with Bearer token'
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ AUTH ERROR: Invalid Authorization header format');
      return res.status(401).json({ 
        message: 'Invalid Authorization header format',
        error: 'Invalid token format',
        help: 'Use format: Bearer <token>',
        received: authHeader
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ AUTH ERROR: Empty token after Bearer');
      return res.status(401).json({ 
        message: 'Empty token provided',
        error: 'Missing token value',
        help: 'Provide a valid JWT token after Bearer'
      });
    }
    
    console.log('✅ Token extracted:', token.substring(0, 20) + '...');

    const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development';
    console.log('🔐 JWT Secret available:', !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ Token decoded successfully, userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ AUTH ERROR: User not found for userId:', decoded.userId);
      return res.status(401).json({ 
        message: 'User not found',
        error: 'Invalid token',
        help: 'Token may be expired or user may have been deleted'
      });
    }
    
    console.log('✅ User found:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ AUTH ERROR:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'Token verification failed',
        help: 'Please login again to get a new token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'Token has expired',
        help: 'Please login again to get a new token'
      });
    }
    
    res.status(401).json({ 
      message: 'Authentication failed',
      error: error.message,
      help: 'Please check your token and try again'
    });
  }
};

module.exports = auth;
