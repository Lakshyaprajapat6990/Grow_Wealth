require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const members = await db
    .collection('users')
    .find({ role: { $ne: 'admin' } })
    .project({ userId: 1, name: 1, leaderIncentiveAmount: 1, fundBalance: 1 })
    .toArray();
  const withGift = members.filter((u) => Number(u.leaderIncentiveAmount || 0) > 0);
  const missing = members.filter((u) => !(Number(u.leaderIncentiveAmount || 0) > 0));
  console.log('Members:', members.length);
  console.log('Have locked 100 gift:', withGift.length);
  console.log('Missing gift:', missing.length);
  if (missing.length) {
    missing.forEach((u) => console.log(' MISSING', u.userId, u.name));
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
