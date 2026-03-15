const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('URI (masked):', mongoUri ? mongoUri.replace(/\/\/[^:@]+:[^@]+@/, '//***:***@') : 'NOT SET');

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

mongoose.set('strictQuery', false);

const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000,
};

console.log('Attempting connection...');

mongoose.connect(mongoUri, options)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Connection state:', mongoose.connection.readyState);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 DNS Resolution Error - Cannot find MongoDB server');
      console.error('Possible causes:');
      console.error('  1. No internet connection');
      console.error('  2. MongoDB Atlas cluster is paused or deleted');
      console.error('  3. DNS server cannot resolve the hostname');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication Error - Wrong username/password');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Timeout Error - Cannot reach MongoDB server');
      console.error('Possible causes:');
      console.error('  1. Firewall blocking connection');
      console.error('  2. IP address not whitelisted in MongoDB Atlas');
      console.error('  3. Network issues');
    }
    
    process.exit(1);
  });
