require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const joined = await User.countDocuments({ role: 'user', isJoined: true, isBlocked: false });
  console.log('Joined users eligible:', joined);

  const autoRoi = await Transaction.find({
    type: 'roi',
    'meta.autoDaily': true,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('userId amount createdAt meta description createdBy status');

  console.log('\nLatest auto daily ROI txs:', autoRoi.length);
  for (const t of autoRoi) {
    console.log({
      userId: t.userId,
      amount: t.amount,
      day: t.meta?.roiDay,
      at: t.createdAt,
      by: t.createdBy,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const countToday = await Transaction.countDocuments({
    type: 'roi',
    'meta.autoDaily': true,
    'meta.roiDay': today,
  });
  const countYday = await Transaction.countDocuments({
    type: 'roi',
    'meta.autoDaily': true,
    'meta.roiDay': yesterday,
  });
  console.log('\nUTC today', today, 'auto ROI count:', countToday);
  console.log('UTC yesterday', yesterday, 'auto ROI count:', countYday);

  const allRoiDays = await Transaction.aggregate([
    { $match: { type: 'roi', 'meta.autoDaily': true } },
    { $group: { _id: '$meta.roiDay', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    { $sort: { _id: -1 } },
    { $limit: 10 },
  ]);
  console.log('\nROI by day:', allRoiDays);

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
