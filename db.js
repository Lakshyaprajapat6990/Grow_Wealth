require('dotenv').config();
const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env');

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  isConnected = true;
  console.log(`[DB] Connected → ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = { connectDB, mongoose };
