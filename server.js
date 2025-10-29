const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');
const Document = require('./models/Document');
const Favorite = require('./models/Favorite');
const QuizResult = require('./models/QuizResult');
const { errorHandler, notFoundHandler, logger } = require('./middleware/errorHandler');
const mongoManager = require('./config/mongodb');

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

// Enhanced CORS configuration for development
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS Origin check:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
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
        console.log('✅ CORS: Allowing localhost origin:', origin);
        return callback(null, true);
      }
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Allowing production origin:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS: Blocking origin:', origin);
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
  console.log(`\n🌐 ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Authorization:', req.headers.authorization ? 'Present' : 'Not present');
  next();
});

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('uploads'));

// MongoDB connection with robust retry logic
console.log('🔄 Initializing MongoDB connection...');
mongoManager.connect().then((connected) => {
  if (connected) {
    console.log('✅ MongoDB connection established successfully');
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/aiConfig'));
app.use('/api/admin', require('./routes/seed'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/pricing'));
app.use('/api/pricing', require('./routes/pricing'));

// Serve React app in production only
if (process.env.NODE_ENV === 'production') {
  // Try multiple possible build paths
  const possiblePaths = [
    path.join(__dirname, 'client/build'),
    path.join(__dirname, '../client/build'),
    path.join(__dirname, '../../client/build'),
    path.resolve(process.cwd(), 'client/build')
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
  
  // Check if build directory exists
  if (buildPath && indexPath) {
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
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
