require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { roiBase, remainingRoiCap, todayKey } = require('../services/roiService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const days = ['2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'];
  console.log('UTC todayKey now:', todayKey());
  console.log('Local date hint:', new Date().toString());

  for (const day of days) {
    const agg = await Transaction.aggregate([
      { $match: { type: 'roi', status: 'success', 'meta.autoDaily': true, 'meta.roiDay': day } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);
    console.log(`\n${day}:`, agg[0] || { count: 0, total: 0 });
  }

  const eligible = await User.find({
    role: { $ne: 'admin' },
    isJoined: true,
    isBlocked: false,
  }).select(
    'userId name totalDeposited joiningAmount totalRoiIncome incomeBalance leaderIncentiveAmount leaderIncentiveActive isJoined'
  );

  console.log('\nEligible joined members:', eligible.length);

  const day = '2026-10-19';
  const got = await Transaction.find({
    type: 'roi',
    status: 'success',
    'meta.autoDaily': true,
    'meta.roiDay': day,
  }).select('userId amount meta createdBy createdAt');

  const gotSet = new Set(got.map((t) => t.userId));
  console.log('Got Oct 19 ROI:', got.length);

  const missing = [];
  for (const u of eligible) {
    if (gotSet.has(u.userId)) continue;
    const base = roiBase(u);
    const remaining = remainingRoiCap(u);
    missing.push({
      userId: u.userId,
      name: u.name,
      base,
      remaining,
      deposited: u.totalDeposited,
      totalRoi: u.totalRoiIncome,
      reason: !base ? 'no_base' : remaining <= 0 ? 'cap_reached' : 'MISSING_SHOULD_GET',
    });
  }

  console.log('\nMissing Oct 19 among eligible:', missing.length);
  missing.forEach((m) =>
    console.log(`${m.userId} | ${m.name} | base $${m.base} | remaining $${m.remaining} | ${m.reason}`)
  );

  console.log('\nSample who GOT Oct 19:');
  got.slice(0, 10).forEach((t) =>
    console.log(t.userId, '$' + t.amount, 'base', t.meta?.baseAmount, 'by', t.createdBy, t.createdAt)
  );

  // Any non-auto ROI on Oct 19?
  const anyRoi = await Transaction.countDocuments({
    type: 'roi',
    status: 'success',
    createdAt: {
      $gte: new Date('2026-10-19T00:00:00.000Z'),
      $lt: new Date('2026-10-20T00:00:00.000Z'),
    },
  });
  console.log('\nAny ROI txs created during UTC Oct 19 calendar day:', anyRoi);

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
