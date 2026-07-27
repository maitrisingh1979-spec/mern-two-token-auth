const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_auth_db');
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    // Non-fatal fallback for development demo mode if DB is not active yet
    console.warn('[MongoDB Notice] Ensure MongoDB service is running locally or MONGO_URI is set in .env');
  }
};

module.exports = connectDB;
