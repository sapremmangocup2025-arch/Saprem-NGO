const mongoose = require("mongoose");

module.exports = async () => {
  try {
    // Connection options for better stability
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("Please check:");
    console.error("1. Your internet connection");
    console.error("2. MongoDB Atlas cluster is running");
    console.error("3. IP address is whitelisted in MongoDB Atlas");
    console.error("4. Connection string is correct");
    process.exit(1);
  }
};
