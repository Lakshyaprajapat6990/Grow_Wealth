require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { connectDB } = require('../config/db');
const { runDailyRoi, todayKey } = require('../services/roiService');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

(async () => {
  await connectDB();
  const day = todayKey();
  const r1 = await runDailyRoi({ createdBy: 'test_once' });
  const r2 = await runDailyRoi({ createdBy: 'test_twice' });
  console.log('day', day);
  console.log('first credited', r1.credited, r1.message);
  console.log('second credited', r2.credited, 'skipped', r2.skipped);

  const u = await User.findOne({ userId: 'GW9869420' }).select('incomeBalance totalRoiIncome');
  console.log('Praveen income', u.incomeBalance, 'totalRoi', u.totalRoiIncome);

  const dups = await Transaction.aggregate([
    { $match: { type: 'roi', status: 'success', 'meta.autoDaily': true } },
    { $group: { _id: { u: '$userId', d: '$meta.roiDay' }, c: { $sum: 1 } } },
    { $match: { c: { $gt: 1 } } },
  ]);
  console.log('dup groups', dups.length);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
