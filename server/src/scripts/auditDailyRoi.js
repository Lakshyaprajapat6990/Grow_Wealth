require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  // Duplicates: same userId + roiDay more than once
  const dupes = await Transaction.aggregate([
    { $match: { type: 'roi', status: 'success', 'meta.autoDaily': true, 'meta.roiDay': { $exists: true } } },
    {
      $group: {
        _id: { userId: '$userId', day: '$meta.roiDay' },
        count: { $sum: 1 },
        total: { $sum: '$amount' },
        ids: { $push: '$_id' },
        amounts: { $push: '$amount' },
        createdAts: { $push: '$createdAt' },
        createdBys: { $push: '$createdBy' },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { '_id.day': -1 } },
  ]);

  console.log('=== DUPLICATE same-day ROI ===');
  console.log('Groups:', dupes.length);
  let extraTotal = 0;
  for (const d of dupes) {
    const keep = 1;
    const extraCount = d.count - keep;
    const sortedAmts = [...d.amounts];
    // excess = sum of all after first
    const excess = Number((d.total - d.amounts[0]).toFixed(8));
    // better: keep one payment = first amount, claw rest
    const keepAmt = d.amounts[0];
    const claw = Number((d.total - keepAmt).toFixed(8));
    extraTotal += claw;
    console.log(
      `${d._id.userId} ${d._id.day} x${d.count} total $${d.total} → claw ~$${claw} | by`,
      d.createdBys,
      d.createdAts.map((t) => t?.toISOString?.())
    );
  }
  console.log('Approx excess ROI to claw:', extraTotal);

  // Missing days for joined users (from first ROI/join day to yesterday UTC)
  const users = await User.find({ role: { $ne: 'admin' }, isJoined: true, isBlocked: false }).select(
    'userId name joinedAt createdAt totalDeposited joiningAmount'
  );
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const endDay = yesterday.toISOString().slice(0, 10);

  console.log('\n=== MISSING ROI days (joined → yesterday UTC', endDay, ') ===');
  let missingCount = 0;
  for (const u of users) {
    const start = (u.joinedAt || u.createdAt || new Date()).toISOString().slice(0, 10);
    const rois = await Transaction.find({
      userId: u.userId,
      type: 'roi',
      status: 'success',
      'meta.autoDaily': true,
    }).select('meta.roiDay');
    const have = new Set(rois.map((t) => t.meta?.roiDay).filter(Boolean));

    const missing = [];
    const cursor = new Date(start + 'T00:00:00.000Z');
    const end = new Date(endDay + 'T00:00:00.000Z');
    while (cursor <= end) {
      const day = cursor.toISOString().slice(0, 10);
      if (!have.has(day)) missing.push(day);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    if (missing.length) {
      missingCount += missing.length;
      console.log(u.userId, u.name, 'missing', missing.length, ':', missing.join(', '));
    }
  }
  console.log('Total missing day-slots:', missingCount);

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
