const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing in .env');

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`[DB] Connected → ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = { connectDB, mongoose };
