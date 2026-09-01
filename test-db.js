require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const dbName = mongoose.connection.name;
  const collections = await mongoose.connection.db.listCollections().toArray();

  console.log('Connected OK');
  console.log('Database:', dbName);
  console.log('Collections:', collections.length ? collections.map((c) => c.name).join(', ') : '(empty — ready for models)');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Connection FAILED:', err.message);
  process.exit(1);
});
