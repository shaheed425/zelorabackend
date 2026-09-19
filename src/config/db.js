const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message}`);
    console.warn(`Falling back to local in-memory/mock state if MongoDB is not running locally.`);
    return null;
  }
};

module.exports = connectDB;
