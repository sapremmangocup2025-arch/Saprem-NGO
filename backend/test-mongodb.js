// Quick MongoDB Connection Test Script
// Run with: node test-mongodb.js

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...\n');
console.log('Connection String:', process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@'));
console.log('');

const testConnection = async () => {
  try {
    console.log('⏳ Attempting to connect...');
    
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log('✅ SUCCESS! MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('');
    console.log('✨ Your MongoDB connection is working perfectly!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.log('❌ FAILED! Could not connect to MongoDB\n');
    console.log('Error:', error.message);
    console.log('');
    console.log('📋 Troubleshooting Steps:');
    console.log('');
    console.log('1. Check Internet Connection:');
    console.log('   Run: ping cluster0prem.fbhatto.mongodb.net');
    console.log('');
    console.log('2. Whitelist Your IP in MongoDB Atlas:');
    console.log('   - Go to https://cloud.mongodb.com/');
    console.log('   - Network Access → Add IP Address');
    console.log('   - Add Current IP or Allow 0.0.0.0/0');
    console.log('');
    console.log('3. Check if Cluster is Active:');
    console.log('   - Go to MongoDB Atlas dashboard');
    console.log('   - Verify cluster status is "Active"');
    console.log('');
    console.log('4. Verify Connection String:');
    console.log('   - Check username and password');
    console.log('   - Verify cluster name');
    console.log('');
    console.log('5. Use Local MongoDB (Alternative):');
    console.log('   - Install MongoDB locally');
    console.log('   - Update .env: MONGO_URI=mongodb://localhost:27017/saprem');
    console.log('');
    console.log('📖 See MONGODB_TROUBLESHOOTING.md for detailed guide');
    
    process.exit(1);
  }
};

testConnection();
