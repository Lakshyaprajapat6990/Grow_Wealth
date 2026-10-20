/**
 * 1) Claw back duplicate same-day auto ROI (keep earliest tx)
 * 2) Ensure unique index so same day cannot be paid twice
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const dupes = await Transaction.aggregate([
    { $match: { type: 'roi', status: 'success', 'meta.autoDaily': true, 'meta.roiDay': { $exists: true } } },
    {
      $group: {
        _id: { userId: '$userId', day: '$meta.roiDay' },
        count: { $sum: 1 },
        docs: { $push: { id: '$_id', amount: '$amount', createdAt: '$createdAt' } },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  console.log('Duplicate groups to fix:', dupes.length);
  for (const d of dupes) {
    const docs = [...d.docs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const keep = docs[0];
    const remove = docs.slice(1);
    const claw = Number(remove.reduce((s, x) => s + Number(x.amount || 0), 0).toFixed(8));
    const user = await User.findOne({ userId: d._id.userId });
    if (!user) continue;

    for (const r of remove) {
      await Transaction.updateOne(
        { _id: r.id },
        {
          $set: {
            status: 'failed',
            description: `DUPLICATE ROI removed (kept one for ${d._id.day})`,
            'meta.duplicateRemoved': true,
            'meta.keptRoiTx': keep.id,
          },
        }
      );
    }

    const before = Number(user.incomeBalance || 0);
    user.incomeBalance = Number(Math.max(0, before - claw).toFixed(8));
    user.roiIncome = Number(Math.max(0, Number(user.roiIncome || 0) - claw).toFixed(8));
    user.totalRoiIncome = Number(Math.max(0, Number(user.totalRoiIncome || 0) - claw).toFixed(8));
    user.totalEarnings = Number(Math.max(0, Number(user.totalEarnings || 0) - claw).toFixed(8));
    await user.save();

    await Transaction.create({
      userId: user.userId,
      type: 'admin_debit',
      amount: claw,
      balanceAfter: user.incomeBalance,
      status: 'success',
      description: `Clawback duplicate ROI for ${d._id.day} (system pays once per day only)`,
      meta: {
        correction: 'duplicate_roi_clawback',
        roiDay: d._id.day,
        keptTx: keep.id,
        removedTxs: remove.map((x) => x.id),
        claw,
      },
      createdBy: 'system_roi_integrity',
    });

    console.log(
      `Fixed ${d._id.userId} ${d._id.day}: clawed $${claw} · income ${before} → ${user.incomeBalance}`
    );
  }

  // Unique index: one successful autoDaily ROI per user per day
  try {
    await Transaction.collection.createIndex(
      { userId: 1, type: 1, 'meta.roiDay': 1 },
      {
        unique: true,
        name: 'uniq_auto_daily_roi_per_day',
        partialFilterExpression: {
          type: 'roi',
          status: 'success',
          'meta.autoDaily': true,
        },
      }
    );
    console.log('Unique index created: uniq_auto_daily_roi_per_day');
  } catch (e) {
    console.log('Index create:', e.message);
  }

  const left = await Transaction.aggregate([
    { $match: { type: 'roi', status: 'success', 'meta.autoDaily': true } },
    { $group: { _id: { userId: '$userId', day: '$meta.roiDay' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  console.log('Remaining duplicate groups:', left.length);

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
