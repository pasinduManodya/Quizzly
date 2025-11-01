const mongoose = require('mongoose');
const { logger } = require('../middleware/errorHandler');
const dnsResolver = require('../utils/dnsResolver');

class MongoDBConnectionManager {
  constructor() {
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 2000; // Start with 2 seconds
    this.maxRetryDelay = 30000; // Max 30 seconds
    this.isConnecting = false;
    this.connectionCheckInterval = null;
    this.reconnectTimeout = null;
  }

  async connect() {
    if (this.isConnecting) {
      console.log('🔄 Connection already in progress, skipping...');
      return;
    }

    this.isConnecting = true;
    
    try {
      // Clear DNS cache before connection attempt
      try {
        const dns = require('dns');
        dns.setDefaultResultOrder('ipv4first');
        console.log('🔄 DNS cache cleared, using IPv4 first...');
      } catch (error) {
        console.log('⚠️  DNS cache clear failed, proceeding...');
      }
      
      // Try DNS pre-resolution, but don't fail if it doesn't work
      try {
        console.log('🔍 Pre-resolving MongoDB hostnames...');
        const dnsResults = await dnsResolver.preResolveMongoDBHosts();
        const failedHosts = dnsResults.filter(r => !r.success);
        if (failedHosts.length > 0) {
          console.warn(`⚠️  Some MongoDB hostnames failed DNS resolution:`);
          failedHosts.forEach(host => {
            console.warn(`   ❌ ${host.host}: ${host.error || 'Unknown error'}`);
          });
          console.warn(`💡 This may cause connection issues. Continuing anyway...`);
        } else {
          console.log('✅ All MongoDB hostnames resolved successfully');
        }
      } catch (error) {
        console.log('⚠️  DNS pre-resolution failed, proceeding with connection attempt...');
        console.log('⚠️  Error:', error.message);
      }
      
      // Use a more reliable MongoDB URI with fallback options
      const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://pasindu:12345@cluster0.yg0v7az.mongodb.net/test?retryWrites=true&w=majority&authSource=admin&directConnection=false&serverSelectionTimeoutMS=60000';
      
      console.log('🔄 Attempting MongoDB connection...');
      console.log('📝 MongoDB URI (masked):', mongoUri.replace(/\/\/[^:@]+:[^@]+@/, '//***:***@'));
      logger.info('Attempting MongoDB connection...', {
        attempt: this.connectionAttempts + 1,
        maxRetries: this.maxRetries,
        hasUri: !!mongoUri
      });

      // Enhanced connection options for better DNS resolution
      const connectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 60000, // Increased to 60 seconds
        socketTimeoutMS: 60000, // 60 seconds
        connectTimeoutMS: 60000, // Increased to 60 seconds
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        // DNS and connection improvements
        bufferCommands: false,
        retryWrites: true,
        retryReads: true,
        // Better error handling
        heartbeatFrequencyMS: 10000,
        // Compression
        compressors: ['zlib'],
        // TLS/SSL options (updated to use new format)
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        // DNS resolution - try SRV record first, then direct connection
        directConnection: false,
        // Additional options for better connectivity
        appName: 'Quizzly',
        // Ignore undefined fields
        ignoreUndefined: true
      };

      // Set mongoose strict mode
      mongoose.set('strictQuery', false);
      
      // Try connection with enhanced error handling
      try {
        await mongoose.connect(mongoUri, connectionOptions);
      } catch (connectError) {
        // If connection fails, log detailed error
        console.error('❌ MongoDB connection error details:', {
          message: connectError.message,
          name: connectError.name,
          code: connectError.code,
          hostname: connectError.hostname
        });
        
        // If it's a DNS error, try to provide helpful information
        if (connectError.message && connectError.message.includes('ENOTFOUND')) {
          console.error('💡 DNS Resolution Error Detected');
          console.error('💡 This usually means:');
          console.error('   1. Internet connection issue');
          console.error('   2. DNS server cannot resolve MongoDB hostname');
          console.error('   3. MongoDB Atlas cluster might be paused or deleted');
          console.error('💡 Troubleshooting steps:');
          console.error('   - Check your internet connection');
          console.error('   - Verify MongoDB Atlas cluster is running');
          console.error('   - Check if IP whitelist allows your IP address');
          console.error('   - Try using a different DNS server (8.8.8.8 or 1.1.1.1)');
        }
        
        throw connectError; // Re-throw to trigger retry logic
      }
      
      this.connectionAttempts = 0;
      this.isConnecting = false;
      
      console.log('✅ MongoDB connected successfully');
      console.log('📊 Database:', mongoose.connection.db.databaseName);
      console.log('🌐 Host:', mongoose.connection.host);
      console.log('🔌 Port:', mongoose.connection.port);
      
      logger.info('MongoDB connected successfully', {
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        connectionState: mongoose.connection.readyState
      });

      // Set up connection monitoring
      this.setupConnectionMonitoring();
      
      return true;
      
    } catch (error) {
      this.isConnecting = false;
      this.connectionAttempts++;
      
      console.error(`❌ MongoDB connection attempt ${this.connectionAttempts} failed:`, error.message);
      logger.error('MongoDB connection failed', {
        attempt: this.connectionAttempts,
        error: error.message,
        stack: error.stack,
        code: error.code
      });

      if (this.connectionAttempts < this.maxRetries) {
        const delay = Math.min(this.retryDelay * Math.pow(2, this.connectionAttempts - 1), this.maxRetryDelay);
        console.log(`⏳ Retrying connection in ${delay}ms... (Attempt ${this.connectionAttempts + 1}/${this.maxRetries})`);
        
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, delay);
        
        return false;
      } else {
        console.error('❌ Max connection attempts reached. MongoDB connection failed permanently.');
        console.log('⚠️  Server will continue without MongoDB connection');
        console.log('⚠️  Some features may not work until MongoDB is available');
        console.log('🔄 Automatic reconnection attempts will continue in background');
        
        // Set up periodic reconnection attempts
        this.setupPeriodicReconnection();
        
        return false;
      }
    }
  }

  setupConnectionMonitoring() {
    // Clear any existing monitoring
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    // Monitor connection state every 30 seconds
    this.connectionCheckInterval = setInterval(() => {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      console.log(`🔍 MongoDB connection state: ${states[state]} (${state})`);
      
      if (state === 0) { // disconnected
        console.log('⚠️  MongoDB connection lost, attempting reconnection...');
        this.connect();
      }
    }, 30000);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established');
      this.connectionAttempts = 0;
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error.message);
      logger.error('MongoDB connection error', {
        error: error.message,
        stack: error.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('close', () => {
      console.log('🔌 MongoDB connection closed');
      logger.warn('MongoDB connection closed');
    });
  }

  setupPeriodicReconnection() {
    // Try to reconnect every 5 minutes if connection failed
    const reconnectInterval = setInterval(() => {
      if (mongoose.connection.readyState === 0) { // disconnected
        console.log('🔄 Attempting periodic reconnection...');
        this.connect();
      } else {
        console.log('✅ MongoDB connection restored, stopping periodic reconnection');
        clearInterval(reconnectInterval);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  async disconnect() {
    try {
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval);
      }
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      await mongoose.disconnect();
      console.log('🔌 MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ Error disconnecting MongoDB:', error.message);
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState];
  }
}

// Create singleton instance
const mongoManager = new MongoDBConnectionManager();

module.exports = mongoManager;