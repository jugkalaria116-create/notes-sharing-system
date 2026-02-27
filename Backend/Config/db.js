const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // 127.0.0.1 use karna best hai local ke liye
    await mongoose.connect("mongodb://127.0.0.1:27017/notestation"); 
    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
    process.exit(1);
  }
};

// Yahan function ko call kar dein
connectDB(); 

module.exports = connectDB;