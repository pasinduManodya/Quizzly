const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const User = require('./src/models/User');
const Document = require('./src/models/Document');
const Favorite = require('./src/models/Favorite');
const QuizResult = require('./src/models/QuizResult');
const { errorHandler, notFoundHandler, logger } = require('./src/middleware/errorHandler');
const mongoManager = require('./src/config/mongodb');

// Load environment variables manually
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
  logger.info('Environment variables loaded successfully');
} catch (error) {
  logger.error('Error loading .env file:', error.message);
}

const app = express();

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (same-origin requests, mobile apps, curl, etc.)
    // Same-origin requests don't send Origin header - this is normal behavior
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, be very permissive
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('0.0.0.0') ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('https://localhost:')) {
        return callback(null, true);
      }
    }
    
    // In production, check against allowed origins
    // If FRONTEND_URL is set, use it; otherwise allow same-origin (no origin header)
    const allowedOrigins = process.env.FRONTEND_URL 
      ? [process.env.FRONTEND_URL] 
      : [];
    
    // If no FRONTEND_URL is set and we're in production, allow same-origin requests
    if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    
    if (allowedOrigins.length > 0 && allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  console.log('Preflight request from:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

// Apply CORS middleware
app.use(cors(corsOptions));

// Request logging middleware for debugging
app.use((req, res, next) => {
  // Only log in development or if DEBUG is enabled
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
    console.log(`\n🌐 ${req.method} ${req.path}`);
    console.log('Origin:', req.headers.origin || 'Same-origin (no Origin header)');
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Content-Type:', req.headers['content-type'] || 'Not set');
    console.log('Authorization:', req.headers.authorization ? 'Present' : 'Not present');
  }
  next();
});

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection with robust retry logic
console.log('🔄 Initializing MongoDB connection...');
mongoManager.connect().then(async (connected) => {
  if (connected) {
    console.log('✅ MongoDB connection established successfully');
    
    // Fix users with incorrect token limits on startup
    try {
      console.log('🔧 Checking for users with incorrect token limits...');
      const usersToFix = await User.find({
        $or: [
          { 'tokenLimits.dailyLimit': 1000000 },
          { 'tokenLimits.monthlyLimit': 10000000 }
        ]
      });
      
      if (usersToFix.length > 0) {
        console.log(`⚠️  Found ${usersToFix.length} users with incorrect token limits. Fixing...`);
        
        for (const user of usersToFix) {
          try {
            await user.loadTokenLimits();
            await user.save();
            console.log(`✅ Fixed token limits for ${user.email}`);
          } catch (error) {
            console.error(`❌ Error fixing user ${user.email}:`, error.message);
          }
        }
        
        console.log(`✅ Fixed token limits for ${usersToFix.length} users`);
      } else {
        console.log('✅ All users have correct token limits');
      }
    } catch (error) {
      console.error('❌ Error checking token limits:', error.message);
    }
  } else {
    console.log('⚠️  MongoDB connection failed, but server will continue');
    console.log('🔄 Automatic reconnection attempts will continue in background');
  }
}).catch((error) => {
  console.error('❌ Critical MongoDB connection error:', error.message);
  logger.error('Critical MongoDB connection error', {
    error: error.message,
    stack: error.stack
  });
});

// MongoDB connection check middleware
const checkMongoConnection = (req, res, next) => {
  if (!mongoManager.isConnected()) {
    return res.status(503).json({ 
      error: 'Database connection unavailable',
      message: 'Please try again later',
      connectionState: mongoManager.getConnectionState()
    });
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: {
      connected: mongoManager.isConnected(),
      state: mongoManager.getConnectionState(),
      attempts: mongoManager.connectionAttempts
    }
  });
});

// API Routes - these must come before static file serving
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/admin', require('./src/routes/aiConfig'));
app.use('/api/admin', require('./src/routes/seed'));
app.use('/api/documents', require('./src/routes/documents'));
app.use('/api/quiz', require('./src/routes/quiz'));
app.use('/api/favorites', require('./src/routes/favorites'));
app.use('/api/contact', require('./src/routes/contact'));
app.use('/api/admin', require('./src/routes/pricing'));
app.use('/api/pricing', require('./src/routes/pricing'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Try multiple possible build paths
  const possiblePaths = [
    path.join(__dirname, '../frontend/build'),
    path.resolve(process.cwd(), 'frontend/build')
  ];
  
  let buildPath = null;
  let indexPath = null;
  
  // Find the build directory
  for (const possiblePath of possiblePaths) {
    const possibleIndexPath = path.join(possiblePath, 'index.html');
    if (fs.existsSync(possiblePath) && fs.existsSync(possibleIndexPath)) {
      buildPath = possiblePath;
      indexPath = possibleIndexPath;
      console.log('✅ Found build directory at:', buildPath);
      break;
    }
  }
  
  // If we found the build directory, serve static files and handle client-side routing
  if (buildPath && indexPath) {
    console.log('Serving static files from:', buildPath);
    
    // Serve static files from the React app
    app.use(express.static(buildPath, {
      // Don't serve index.html for API routes
      index: false,
      // Cache control for static assets
      maxAge: '1y',
      // Allow serving HTML files
      extensions: ['html']
    }));
    
    // Handle React routing, return all other requests to React app
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // Skip file extensions (like .js, .css, .png, etc.)
      if (req.path.includes('.')) {
        return next();
      }
      
      // For all other routes, serve index.html
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          next(err);
        }
      });
    });
  } else {
    // Build directory doesn't exist - log warning and provide helpful error
    console.error('⚠️  WARNING: Production build not found!');
    console.error('Tried paths:', possiblePaths);
    console.error('Current directory (__dirname):', __dirname);
    console.error('Working directory (process.cwd()):', process.cwd());
    
    // List what does exist
    try {
      const dirContents = fs.readdirSync(__dirname);
      console.error('Contents of __dirname:', dirContents);
      
      const clientPath = path.join(__dirname, 'client');
      if (fs.existsSync(clientPath)) {
        const clientContents = fs.readdirSync(clientPath);
        console.error('Contents of client directory:', clientContents);
      }
      
      // Check if client/build exists but index.html is missing
      const checkedBuildPath = path.join(__dirname, 'client/build');
      if (fs.existsSync(checkedBuildPath)) {
        const buildContents = fs.readdirSync(checkedBuildPath);
        console.error('Contents of client/build (index.html may be missing):', buildContents);
      }
    } catch (err) {
      console.error('Error reading directory:', err.message);
    }
    
    // Serve helpful error page
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'Frontend build not found. Please ensure the build completed successfully.',
            type: 'build_error',
            triedPaths: possiblePaths,
            timestamp: new Date().toISOString()
          }
        });
      }
      res.status(503).send(`
        <html>
          <head><title>Build Error</title></head>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>⚠️ Build Not Found</h1>
            <p>The frontend build directory is missing.</p>
            <p><strong>Tried paths:</strong></p>
            <ul style="text-align: left; display: inline-block;">
              ${possiblePaths.map(p => `<li>${p}</li>`).join('')}
            </ul>
            <p>Please ensure the build process completed successfully.</p>
            <hr>
            <p><small>If you're deploying to Render, make sure your build command is:</small></p>
            <p><code>npm ci && cd client && npm ci && npm run build</code></p>
          </body>
        </html>
      `);
    });
  }
} else {
  // In development, ignore non-API routes (handled by React dev server)
  app.use((req, res, next) => {
    // Only handle API routes in development - let React dev server handle hot-updates and static files
    if (!req.path.startsWith('/api')) {
      return res.status(204).end(); // Return 204 No Content - let React dev server handle it
    }
    next();
  });
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    await mongoManager.disconnect();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    await mongoManager.disconnect();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
});

// Cleanup guest users every hour
setInterval(async () => {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Find old guest users
    const oldGuests = await User.find({
      isGuest: true,
      lastActivity: { $lt: cutoffTime }
    });

    if (oldGuests.length > 0) {
      console.log(`Cleaning up ${oldGuests.length} old guest sessions`);
      
      for (const guest of oldGuests) {
        // Delete guest's documents and files
        const documents = await Document.find({ user: guest._id });
        for (const doc of documents) {
          if (fs.existsSync(doc.filePath)) {
            fs.unlinkSync(doc.filePath);
          }
        }
        await Document.deleteMany({ user: guest._id });
        
        // Delete guest's favorites and quiz results
        await Favorite.deleteMany({ user: guest._id });
        await QuizResult.deleteMany({ user: guest._id });
        
        // Delete the guest user
        await User.deleteOne({ _id: guest._id });
      }
      
      console.log(`Cleaned up ${oldGuests.length} guest sessions`);
    }
  } catch (error) {
    console.error('Guest cleanup error:', error);
  }
}, 60 * 60 * 1000); // Run every hour
