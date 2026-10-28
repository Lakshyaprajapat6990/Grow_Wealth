require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { roiBase } = require('../services/roiService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const users = await User.find({
    role: { $ne: 'admin' },
    leaderIncentiveAmount: { $gt: 0 },
  }).select(
    'userId name totalDeposited joiningAmount leaderIncentiveAmount leaderIncentiveActive totalRoiIncome incomeBalance'
  );

  console.log('=== ROI formula (code) ===');
  console.log('roiBase = max(totalDeposited, joiningAmount) + (100 gift ONLY if leaderIncentiveActive)');
  console.log('daily ROI = 1% of roiBase');
  console.log('So if gift unlocked: extra ROI per day = 1% of $100 = $1.00');
  console.log('If admin sees ~$2 extra, that can be 2 days of gift ROI, or gift ROI + level income, or stake change.\n');

  const unlocked = users.filter((u) => u.leaderIncentiveActive);
  console.log('=== Members with gift UNLOCKED (ROI includes $100) ===');
  for (const u of unlocked) {
    const stake = Math.max(Number(u.totalDeposited || 0), Number(u.joiningAmount || 0), 0);
    const base = roiBase(u);
    const dailyFull = Number(((base * 1) / 100).toFixed(8));
    const dailyStakeOnly = Number(((stake * 1) / 100).toFixed(8));
    const dailyGiftExtra = Number((dailyFull - dailyStakeOnly).toFixed(8));

    const unlockTx = await Transaction.findOne({
      userId: u.userId,
      type: 'leader_incentive',
      'meta.unlocked': true,
    }).sort({ createdAt: 1 });

    const roiAfterUnlock = unlockTx
      ? await Transaction.find({
          userId: u.userId,
          type: 'roi',
          status: 'success',
          createdAt: { $gte: unlockTx.createdAt },
        })
          .sort({ createdAt: 1 })
          .select('amount createdAt description meta')
      : [];

    const giftExtraFromRois = roiAfterUnlock.reduce((sum, t) => {
      const b = Number(t.meta?.baseAmount || 0);
      // gift portion of that day's ROI ≈ amount * (100/base) when base includes gift
      if (b > stake && Number(u.leaderIncentiveAmount || 0) > 0) {
        const giftPart = Number(((t.amount * Number(u.leaderIncentiveAmount)) / b).toFixed(8));
        return sum + giftPart;
      }
      return sum;
    }, 0);

    console.log('\n' + u.userId + ' | ' + u.name);
    console.log('  stake (deposit/join): $' + stake);
    console.log('  gift unlocked: YES · $' + u.leaderIncentiveAmount);
    console.log('  current ROI base: $' + base + ' → daily ROI $' + dailyFull + ' (of which gift ≈ $' + dailyGiftExtra + ')');
    console.log('  unlock tx at:', unlockTx?.createdAt || 'not found');
    console.log('  ROI txs after unlock:', roiAfterUnlock.length);
    roiAfterUnlock.forEach((t) => {
      console.log(
        '   -',
        t.createdAt?.toISOString?.() || t.createdAt,
        'amount $' + t.amount,
        'base $' + (t.meta?.baseAmount ?? '?'),
        '|',
        t.description
      );
    });
    console.log('  Approx total EXTRA ROI from gift since unlock: $' + giftExtraFromRois.toFixed(4));
  }

  // Recent ROI where base looks like stake+100
  console.log('\n=== Recent ROI txs whose base looks like it includes +100 gift ===');
  const recent = await Transaction.find({ type: 'roi', status: 'success', 'meta.autoDaily': true })
    .sort({ createdAt: -1 })
    .limit(80)
    .select('userId amount createdAt meta description');

  for (const t of recent) {
    const u = users.find((x) => x.userId === t.userId);
    if (!u) continue;
    const stake = Math.max(Number(u.totalDeposited || 0), Number(u.joiningAmount || 0), 0);
    const base = Number(t.meta?.baseAmount || 0);
    const gift = Number(u.leaderIncentiveAmount || 0);
    if (gift > 0 && Math.abs(base - (stake + gift)) < 0.02) {
      const extra = Number(((t.amount * gift) / base).toFixed(4));
      console.log(
        t.createdAt?.toISOString?.()?.slice(0, 10),
        t.userId,
        'ROI $' + t.amount,
        'base $' + base,
        'stake $' + stake,
        '→ gift-driven extra ≈ $' + extra
      );
    }
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
