require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { roiBase, remainingRoiCap, ROI_PERCENT, ROI_CAP_MULTIPLIER } = require('../services/roiService');
const { creditLevelIncomeFromRoi } = require('../services/levelIncomeService');

const DAY = '2026-10-19';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const eligible = await User.find({
    role: { $ne: 'admin' },
    isJoined: true,
    isBlocked: false,
  });

  const missing = [];
  for (const user of eligible) {
    const already = await Transaction.findOne({
      userId: user.userId,
      type: 'roi',
      status: 'success',
      'meta.autoDaily': true,
      'meta.roiDay': DAY,
    });
    if (already) continue;

    const base = roiBase(user);
    const remaining = remainingRoiCap(user);
    if (!base || base <= 0 || remaining <= 0) {
      console.log('Skip', user.userId, { base, remaining });
      continue;
    }
    missing.push(user);
  }

  console.log('Will credit Oct 19 ROI for', missing.length, 'members');

  const details = [];
  for (const user of missing) {
    const base = roiBase(user);
    let amount = Number(((base * ROI_PERCENT) / 100).toFixed(8));
    const remaining = remainingRoiCap(user);
    if (amount > remaining) amount = remaining;
    if (amount <= 0) continue;

    // Re-check race
    const exists = await Transaction.findOne({
      userId: user.userId,
      type: 'roi',
      status: 'success',
      'meta.autoDaily': true,
      'meta.roiDay': DAY,
    });
    if (exists) {
      console.log('Already exists now', user.userId);
      continue;
    }

    user.roiIncome = Number((user.roiIncome + amount).toFixed(8));
    user.totalRoiIncome = Number((user.totalRoiIncome + amount).toFixed(8));
    user.incomeBalance = Number((user.incomeBalance + amount).toFixed(8));
    user.totalEarnings = Number((user.totalEarnings + amount).toFixed(8));
    await user.save();

    await Transaction.create({
      userId: user.userId,
      type: 'roi',
      amount,
      balanceAfter: user.incomeBalance,
      status: 'success',
      description: `Daily auto ROI ${ROI_PERCENT}% on $${base} (${DAY}) · cap 2X · backfill`,
      meta: {
        baseAmount: base,
        roiPercent: ROI_PERCENT,
        roiDay: DAY,
        autoDaily: true,
        roiCapMultiplier: ROI_CAP_MULTIPLIER,
        remainingAfter: remainingRoiCap(user),
        backfill: true,
      },
      createdBy: 'system_oct19_backfill',
    });

    const levelResult = await creditLevelIncomeFromRoi({
      fromUserId: user.userId,
      roiAmount: amount,
      roiDay: DAY,
      createdBy: 'system_oct19_backfill',
    });

    details.push({
      userId: user.userId,
      name: user.name,
      amount,
      base,
      levelCredited: levelResult.credited,
      levelTotal: levelResult.totalAmount,
    });
    console.log('Credited', user.userId, user.name, '$' + amount, 'base', base);
  }

  // Verify
  const count = await Transaction.countDocuments({
    type: 'roi',
    status: 'success',
    'meta.autoDaily': true,
    'meta.roiDay': DAY,
  });
  const joined = await User.countDocuments({ role: { $ne: 'admin' }, isJoined: true, isBlocked: false });
  console.log('\nOct 19 ROI count now:', count, '/ eligible', joined);
  console.log('Details:', details);

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
