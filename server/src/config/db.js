const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing in environment');

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(uri).then((m) => {
      console.log(`[DB] Connected → ${m.connection.name}`);
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB, mongoose };
