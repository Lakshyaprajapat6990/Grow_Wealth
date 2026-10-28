require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { roiBase } = require('../services/roiService');
const { getTeamVolume } = require('../services/rankRewardService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const u = await User.findOne({ userId: 'GW7752182' });
  if (!u) {
    console.log('User not found');
    process.exit(1);
  }

  const stake = Math.max(Number(u.totalDeposited || 0), Number(u.joiningAmount || 0), 0);
  const gift = Number(u.leaderIncentiveAmount || 0);
  const active = !!u.leaderIncentiveActive;
  const base = roiBase(u);
  const { volume } = await getTeamVolume(u.userId);

  console.log('=== Praveen Kumar GW7752182 ===');
  console.log('Name:', u.name);
  console.log('totalDeposited:', u.totalDeposited);
  console.log('joiningAmount:', u.joiningAmount);
  console.log('Stake used for ROI (max deposit/join):', stake);
  console.log('Gift amount (leaderIncentiveAmount):', gift);
  console.log('Gift unlocked (leaderIncentiveActive):', active);
  console.log('Gift unlocked at:', u.leaderIncentiveUnlockedAt);
  console.log('Unlock rule volume needed:', u.leaderIncentiveUnlockVolume || 500);
  console.log('Current team business:', volume);
  console.log('roiBase() today:', base);
  console.log('Daily 1% ROI =', (base * 1) / 100);
  console.log('  of which from real money ≈', (stake * 1) / 100);
  console.log('  of which from gift ≈', active ? (gift * 1) / 100 : 0);

  const unlockTx = await Transaction.findOne({
    userId: 'GW7752182',
    type: 'leader_incentive',
    'meta.unlocked': true,
  }).sort({ createdAt: 1 });

  console.log('\nUnlock transaction:', unlockTx
    ? {
        at: unlockTx.createdAt,
        description: unlockTx.description,
        meta: unlockTx.meta,
      }
    : 'none');

  const rois = await Transaction.find({
    userId: 'GW7752182',
    type: 'roi',
    status: 'success',
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('amount createdAt description meta');

  console.log('\nLatest ROI credits:');
  rois.forEach((t) => {
    console.log({
      day: t.meta?.roiDay || t.createdAt,
      amount: t.amount,
      baseAmount: t.meta?.baseAmount,
      description: t.description,
    });
  });

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
