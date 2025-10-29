// MongoDB Connection Fix Script
// This script helps diagnose and fix MongoDB Atlas connection issues

const mongoose = require('mongoose');

console.log('🔍 MongoDB Connection Diagnostic Tool');
console.log('=====================================\n');

// Test MongoDB connection
async function testConnection() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://pasindu:12345@cluster0.yg0v7az.mongodb.net/test?retryWrites=true&w=majority&authSource=admin';
  
  console.log('📡 Testing MongoDB Atlas connection...');
  console.log('URI:', mongoUri.replace(/\/\/.*@/, '//***:***@'));
  
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      connectTimeoutMS: 10000, // 10 seconds timeout
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    // Test a simple query
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log('📊 User count:', userCount);
    
  } catch (error) {
    console.log('❌ MongoDB connection failed!');
    console.log('Error:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n🔧 SOLUTION: IP Whitelist Issue');
      console.log('1. Go to MongoDB Atlas Dashboard: https://cloud.mongodb.com/');
      console.log('2. Click on your project');
      console.log('3. Go to "Network Access" in the left sidebar');
      console.log('4. Click "Add IP Address"');
      console.log('5. Click "Add Current IP Address" (auto-detects your IP)');
      console.log('6. Or add "0.0.0.0/0" to allow all IPs (development only)');
      console.log('7. Wait 1-2 minutes for changes to take effect');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔧 SOLUTION: Authentication Issue');
      console.log('1. Check your MongoDB Atlas username and password');
      console.log('2. Verify the database name in the connection string');
      console.log('3. Make sure the user has proper permissions');
    } else {
      console.log('\n🔧 SOLUTION: General Connection Issue');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas cluster is running');
      console.log('3. Check if your firewall is blocking the connection');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testConnection().catch(console.error);


