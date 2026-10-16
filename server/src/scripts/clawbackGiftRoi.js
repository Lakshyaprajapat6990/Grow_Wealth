/**
 * Remove past ROI that was wrongly paid on gifted $100.
 * - Debits excess from member income (simple correction tx)
 * - Also claws back proportional level_income paid from that inflated ROI
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');

const ROI_PERCENT = Number(process.env.ROI_PERCENT || 1);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');

  const users = await User.find({
    role: { $ne: 'admin' },
    leaderIncentiveAmount: { $gt: 0 },
  });

  const report = [];
  let totalRoiClawed = 0;
  let totalLevelClawed = 0;

  for (const user of users) {
    const gift = Number(user.leaderIncentiveAmount || 0);
    const stake = Math.max(Number(user.totalDeposited || 0), Number(user.joiningAmount || 0), 0);
    if (!(gift > 0)) continue;

    const rois = await Transaction.find({
      userId: user.userId,
      type: 'roi',
      status: 'success',
    }).sort({ createdAt: 1 });

    let excessRoi = 0;
    const touchedDays = [];

    for (const t of rois) {
      if (t.meta?.giftRoiClawed) continue;
      const base = Number(t.meta?.baseAmount || 0);
      const amount = Number(t.amount || 0);
      const pct = Number(t.meta?.roiPercent || ROI_PERCENT);
      if (!(base > 0) || !(amount > 0)) continue;

      // Gift was included when ROI base ≈ stake + gift
      if (Math.abs(base - (stake + gift)) > 0.05) continue;

      const correctBase = stake;
      let correctAmount = Number(((correctBase * pct) / 100).toFixed(8));
      if (correctAmount > amount) correctAmount = amount;
      const excess = Number((amount - correctAmount).toFixed(8));
      if (excess <= 0.00000001) continue;

      excessRoi = Number((excessRoi + excess).toFixed(8));
      touchedDays.push({
        day: t.meta?.roiDay || t.createdAt,
        amount,
        base,
        correctAmount,
        excess,
        txId: t._id,
      });

      // Mark ROI meta so we don't double-claw later
      t.meta = {
        ...(t.meta || {}),
        giftRoiClawed: true,
        giftRoiExcess: excess,
        correctedBaseAmount: correctBase,
        correctedAmount: correctAmount,
      };
      t.description = `${t.description || ''} · gift ROI corrected (−$${excess})`.trim();
      await t.save();
    }

    if (excessRoi <= 0) continue;

    // Proportional level income clawback from those ROI days
    let excessLevel = 0;
    const levelDetails = [];
    for (const d of touchedDays) {
      const day = d.day;
      const levels = await Transaction.find({
        type: 'level_income',
        status: 'success',
        'meta.fromUserId': user.userId,
        'meta.roiDay': day,
        'meta.giftRoiClawed': { $ne: true },
      });

      for (const lt of levels) {
        const roiAmt = Number(lt.meta?.roiAmount || 0);
        if (!(roiAmt > 0) || !(d.amount > 0)) continue;
        const share = Number(((lt.amount * d.excess) / d.amount).toFixed(8));
        if (share <= 0) continue;

        const upline = await User.findOne({ userId: lt.userId });
        if (!upline) continue;

        const debit = Math.min(share, Number(upline.incomeBalance || 0));
        upline.incomeBalance = Number((Number(upline.incomeBalance || 0) - debit).toFixed(8));
        upline.totalEarnings = Number(Math.max(0, Number(upline.totalEarnings || 0) - debit).toFixed(8));
        upline.levelIncome = Number(Math.max(0, Number(upline.levelIncome || 0) - debit).toFixed(8));
        upline.totalLevelIncome = Number(Math.max(0, Number(upline.totalLevelIncome || 0) - debit).toFixed(8));
        await upline.save();

        await Transaction.create({
          userId: upline.userId,
          type: 'admin_debit',
          amount: debit,
          balanceAfter: upline.incomeBalance,
          status: 'success',
          description: `Clawback level income from gift-ROI of ${user.userId} (${day})`,
          meta: {
            correction: 'gift_roi_level_clawback',
            fromUserId: user.userId,
            roiDay: day,
            originalLevelTx: lt._id,
            originalAmount: lt.amount,
          },
          createdBy: 'system_gift_roi_fix',
        });

        lt.meta = { ...(lt.meta || {}), giftRoiClawed: true, giftRoiExcess: debit };
        await lt.save();

        excessLevel = Number((excessLevel + debit).toFixed(8));
        levelDetails.push({ upline: upline.userId, debit, day });
      }
    }

    // Debit member excess ROI (direct income correction)
    const fresh = await User.findOne({ userId: user.userId });
    const beforeIncome = Number(fresh.incomeBalance || 0);
    fresh.incomeBalance = Number(Math.max(0, beforeIncome - excessRoi).toFixed(8));
    fresh.roiIncome = Number(Math.max(0, Number(fresh.roiIncome || 0) - excessRoi).toFixed(8));
    fresh.totalRoiIncome = Number(Math.max(0, Number(fresh.totalRoiIncome || 0) - excessRoi).toFixed(8));
    fresh.totalEarnings = Number(Math.max(0, Number(fresh.totalEarnings || 0) - excessRoi).toFixed(8));
    await fresh.save();

    await Transaction.create({
      userId: fresh.userId,
      type: 'admin_debit',
      amount: excessRoi,
      balanceAfter: fresh.incomeBalance,
      status: 'success',
      description: `Clawback ROI paid on gifted $${gift} (not eligible for ROI)`,
      meta: {
        correction: 'gift_roi_clawback',
        giftAmount: gift,
        stake,
        excessRoi,
        days: touchedDays.map((x) => x.day),
        incomeBefore: beforeIncome,
        incomeAfter: fresh.incomeBalance,
      },
      createdBy: 'system_gift_roi_fix',
    });

    totalRoiClawed = Number((totalRoiClawed + excessRoi).toFixed(8));
    totalLevelClawed = Number((totalLevelClawed + excessLevel).toFixed(8));
    report.push({
      userId: user.userId,
      name: user.name,
      stake,
      gift,
      excessRoi,
      excessLevel,
      days: touchedDays.length,
      newIncome: fresh.incomeBalance,
      levelDetails,
    });
  }

  console.log('=== Gift ROI clawback complete ===');
  console.log('Members corrected:', report.length);
  console.log('Total ROI clawed:', totalRoiClawed);
  console.log('Total level income clawed:', totalLevelClawed);
  report.forEach((r) => {
    console.log(
      `\n${r.userId} ${r.name} | stake $${r.stake} | clawed ROI $${r.excessRoi} over ${r.days} days | level clawed $${r.excessLevel} | income now $${r.newIncome}`
    );
    r.levelDetails.forEach((l) => console.log(`  level ← ${l.upline} −$${l.debit} (${l.day})`));
  });

  // Verify formula
  const { roiBase } = require('../services/roiService');
  for (const r of report) {
    const u = await User.findOne({ userId: r.userId });
    const base = roiBase(u);
    console.log(`Verify ${r.userId} roiBase now $${base} (should equal stake $${r.stake}, daily ~$${(base / 100).toFixed(4)})`);
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
