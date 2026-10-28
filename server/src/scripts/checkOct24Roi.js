require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { roiBase, remainingRoiCap, todayKey } = require('../services/roiService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const day = '2026-10-24';
  console.log('Now UTC:', new Date().toISOString(), '| todayKey:', todayKey());
  console.log('Checking ROI day:', day);

  const eligible = await User.find({
    role: { $ne: 'admin' },
    isJoined: true,
    isBlocked: false,
  }).select('userId name totalDeposited joiningAmount totalRoiIncome isJoined');

  const got = await Transaction.find({
    type: 'roi',
    status: 'success',
    'meta.autoDaily': true,
    'meta.roiDay': day,
  })
    .select('userId amount meta createdAt createdBy description')
    .sort({ createdAt: 1 });

  const gotSet = new Set(got.map((t) => t.userId));
  console.log('\nEligible joined members:', eligible.length);
  console.log('Got Oct 24 auto ROI:', got.length);

  if (got.length) {
    console.log('\nSample credited:');
    got.slice(0, 8).forEach((t) =>
      console.log(
        t.userId,
        '$' + t.amount,
        'base',
        t.meta?.baseAmount,
        'by',
        t.createdBy,
        t.createdAt?.toISOString?.()
      )
    );
    const sum = got.reduce((s, t) => s + Number(t.amount || 0), 0);
    console.log('Total Oct 24 ROI amount: $' + sum.toFixed(4));
  }

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
      reason: !base ? 'no_base' : remaining <= 0 ? 'cap_reached' : 'MISSING_SHOULD_GET',
    });
  }

  console.log('\nMissing among eligible:', missing.length);
  missing.forEach((m) =>
    console.log(`${m.userId} | ${m.name} | base $${m.base} | rem $${m.remaining} | ${m.reason}`)
  );

  // Nearby days for context
  console.log('\n=== Nearby day counts ===');
  for (const d of ['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']) {
    const c = await Transaction.countDocuments({
      type: 'roi',
      status: 'success',
      'meta.autoDaily': true,
      'meta.roiDay': d,
    });
    const agg = await Transaction.aggregate([
      { $match: { type: 'roi', status: 'success', 'meta.autoDaily': true, 'meta.roiDay': d } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    console.log(d, 'count=', c, 'total=$' + Number(agg[0]?.total || 0).toFixed(4));
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
