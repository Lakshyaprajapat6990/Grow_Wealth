require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { roiBase } = require('../services/roiService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const users = await User.find({ role: { $ne: 'admin' }, leaderIncentiveAmount: { $gt: 0 } });
  let badBase = 0;
  for (const u of users) {
    const stake = Math.max(Number(u.totalDeposited || 0), Number(u.joiningAmount || 0), 0);
    const base = roiBase(u);
    const gift = Number(u.leaderIncentiveAmount || 0);
    if (Math.abs(base - stake) > 0.0001) {
      badBase += 1;
      console.log('BAD roiBase', u.userId, { stake, base, gift, active: u.leaderIncentiveActive });
    }
  }

  const unclaused = await Transaction.find({
    type: 'roi',
    status: 'success',
    'meta.giftRoiClawed': { $ne: true },
  })
    .select('userId amount meta')
    .limit(5000);

  let stillGiftBase = 0;
  for (const t of unclaused) {
    const u = users.find((x) => x.userId === t.userId);
    if (!u) continue;
    const gift = Number(u.leaderIncentiveAmount || 0);
    const stake = Math.max(Number(u.totalDeposited || 0), Number(u.joiningAmount || 0), 0);
    const base = Number(t.meta?.baseAmount || 0);
    if (gift > 0 && Math.abs(base - (stake + gift)) <= 0.05) {
      stillGiftBase += 1;
      console.log('Uncorrected gift ROI tx', t.userId, t.amount, base);
    }
  }

  const clawbacks = await Transaction.find({
    type: 'admin_debit',
    'meta.correction': 'gift_roi_clawback',
  }).select('userId amount meta createdAt');

  console.log('\nMembers with gift:', users.length);
  console.log('roiBase mismatches (should be 0):', badBase);
  console.log('Uncorrected gift-base ROI txs (should be 0):', stillGiftBase);
  console.log('Clawback debits:', clawbacks.length);
  clawbacks.forEach((c) => console.log(c.userId, '−$' + c.amount, c.meta?.days));

  // Spot check Praveen
  const p = await User.findOne({ userId: 'GW7752182' });
  console.log('\nPraveen check:', {
    roiBase: roiBase(p),
    daily: roiBase(p) / 100,
    incomeBalance: p.incomeBalance,
    totalRoiIncome: p.totalRoiIncome,
  });

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
