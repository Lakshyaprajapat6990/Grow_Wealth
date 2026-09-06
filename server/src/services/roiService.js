const User = require('../models/User');
const Transaction = require('../models/Transaction');

const ROI_PERCENT = Number(process.env.ROI_PERCENT || 1);

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function roiBase(user) {
  const deposited = Number(user.totalDeposited || 0);
  const joining = Number(user.joiningAmount || 0);
  return Math.max(deposited, joining, 0);
}

/**
 * Credit 1% daily ROI to all joined members (once per UTC day).
 */
async function runDailyRoi({ createdBy = 'system' } = {}) {
  const day = todayKey();
  const users = await User.find({ role: 'user', isJoined: true, isBlocked: false });

  let credited = 0;
  let skipped = 0;
  let totalAmount = 0;
  const details = [];

  for (const user of users) {
    const base = roiBase(user);
    if (!base || base <= 0) {
      skipped += 1;
      continue;
    }

    const already = await Transaction.findOne({
      userId: user.userId,
      type: 'roi',
      status: 'success',
      'meta.roiDay': day,
      'meta.autoDaily': true,
    });
    if (already) {
      skipped += 1;
      continue;
    }

    const amount = Number(((base * ROI_PERCENT) / 100).toFixed(8));
    if (amount <= 0) {
      skipped += 1;
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
      description: `Daily auto ROI ${ROI_PERCENT}% on $${base} (${day})`,
      meta: {
        baseAmount: base,
        roiPercent: ROI_PERCENT,
        roiDay: day,
        autoDaily: true,
      },
      createdBy,
    });

    credited += 1;
    totalAmount += amount;
    details.push({ userId: user.userId, amount, base });
  }

  return {
    success: true,
    day,
    roiPercent: ROI_PERCENT,
    credited,
    skipped,
    totalAmount: Number(totalAmount.toFixed(8)),
    details,
    message: `Daily ROI ${ROI_PERCENT}% done for ${day}: ${credited} users, $${totalAmount.toFixed(2)} total`,
  };
}

module.exports = { runDailyRoi, ROI_PERCENT, todayKey, roiBase };
