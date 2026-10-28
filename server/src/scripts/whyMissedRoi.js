require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const id = 'GW9869420';
  const u = await User.findOne({ userId: id });
  console.log('User:', {
    userId: u.userId,
    name: u.name,
    role: u.role,
    isJoined: u.isJoined,
    isBlocked: u.isBlocked,
    totalDeposited: u.totalDeposited,
    createdAt: u.createdAt,
  });

  const rois = await Transaction.find({ userId: id, type: 'roi', 'meta.autoDaily': true })
    .sort({ 'meta.roiDay': 1 })
    .select('amount meta createdAt createdBy description');
  console.log('\nAll auto ROI days for', id);
  rois.forEach((t) => console.log(t.meta?.roiDay, '$' + t.amount, 'base', t.meta?.baseAmount, t.createdBy));

  // Order of users as runDailyRoi finds them
  const users = await User.find({ role: { $ne: 'admin' }, isJoined: true, isBlocked: false }).select(
    'userId name totalDeposited'
  );
  const idx = users.findIndex((x) => x.userId === id);
  console.log('\nPosition in ROI loop:', idx + 1, 'of', users.length);

  // Days where count < eligible
  const days = await Transaction.aggregate([
    { $match: { type: 'roi', 'meta.autoDaily': true } },
    { $group: { _id: '$meta.roiDay', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 14 },
  ]);
  console.log('\nRecent day counts:', days);

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
