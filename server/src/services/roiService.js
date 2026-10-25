const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const ROI_PERCENT = Number(process.env.ROI_PERCENT || 1);
const ROI_CAP_MULTIPLIER = Number(process.env.ROI_CAP_MULTIPLIER || 2);

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function roiBase(user) {
  const deposited = Number(user.totalDeposited || 0);
  const joining = Number(user.joiningAmount || 0);
  // Gifted USDT never earns ROI
  return Number(Math.max(deposited, joining, 0).toFixed(8));
}

function remainingRoiCap(user) {
  const base = roiBase(user);
  const cap = base * ROI_CAP_MULTIPLIER;
  const earned = Number(user.totalRoiIncome || 0);
  return Math.max(0, Number((cap - earned).toFixed(8)));
}

function isDuplicateKeyError(err) {
  return err && (err.code === 11000 || err.code === 11001 || /E11000/.test(String(err.message || '')));
}

/**
 * Credit one member's daily ROI exactly once for `day`.
 * Uses a DB transaction + unique index so cron/admin double-run cannot pay twice.
 */
async function creditOneDailyRoi(userDoc, day, { createdBy = 'system', backfill = false } = {}) {
  const base = roiBase(userDoc);
  if (!base || base <= 0) return { skipped: true, reason: 'no_base' };

  const remaining = remainingRoiCap(userDoc);
  if (remaining <= 0) return { skipped: true, reason: 'cap' };

  let amount = Number(((base * ROI_PERCENT) / 100).toFixed(8));
  if (amount > remaining) amount = remaining;
  if (amount <= 0) return { skipped: true, reason: 'zero' };

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const already = await Transaction.findOne({
      userId: userDoc.userId,
      type: 'roi',
      status: 'success',
      'meta.roiDay': day,
      'meta.autoDaily': true,
    }).session(session);

    if (already) {
      await session.abortTransaction();
      return { skipped: true, reason: 'already' };
    }

    const fresh = await User.findOne({ _id: userDoc._id }).session(session);
    if (!fresh || fresh.isBlocked || !fresh.isJoined) {
      await session.abortTransaction();
      return { skipped: true, reason: 'user' };
    }

    // Recompute remaining on locked read
    const rem2 = remainingRoiCap(fresh);
    if (rem2 <= 0) {
      await session.abortTransaction();
      return { skipped: true, reason: 'cap' };
    }
    if (amount > rem2) amount = rem2;

    fresh.roiIncome = Number((Number(fresh.roiIncome || 0) + amount).toFixed(8));
    fresh.totalRoiIncome = Number((Number(fresh.totalRoiIncome || 0) + amount).toFixed(8));
    fresh.incomeBalance = Number((Number(fresh.incomeBalance || 0) + amount).toFixed(8));
    fresh.totalEarnings = Number((Number(fresh.totalEarnings || 0) + amount).toFixed(8));
    await fresh.save({ session });

    await Transaction.create(
      [
        {
          userId: fresh.userId,
          type: 'roi',
          amount,
          balanceAfter: fresh.incomeBalance,
          status: 'success',
          description: `Daily auto ROI ${ROI_PERCENT}% on $${base} (${day}) · cap 2X`,
          meta: {
            baseAmount: base,
            roiPercent: ROI_PERCENT,
            roiDay: day,
            autoDaily: true,
            roiCapMultiplier: ROI_CAP_MULTIPLIER,
            remainingAfter: remainingRoiCap(fresh),
            ...(backfill ? { backfill: true } : {}),
          },
          createdBy,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      credited: true,
      userId: fresh.userId,
      amount,
      base,
      levelIncome: { credited: 0, totalAmount: 0, details: [], disabled: true },
    };
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {
      /* ignore */
    }
    if (isDuplicateKeyError(err)) {
      return { skipped: true, reason: 'duplicate_race' };
    }
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Credit 1% daily ROI to all joined members (once per UTC day).
 * @param {{ createdBy?: string, day?: string }} opts
 */
async function runDailyRoi({ createdBy = 'system', day: dayOverride } = {}) {
  const day = dayOverride || todayKey();
  const users = await User.find({ role: { $ne: 'admin' }, isJoined: true, isBlocked: false }).sort({
    createdAt: 1,
  });

  let credited = 0;
  let skipped = 0;
  let failed = 0;
  let totalAmount = 0;
  let levelCredited = 0;
  let levelTotalAmount = 0;
  const details = [];
  const errors = [];

  for (const user of users) {
    try {
      const result = await creditOneDailyRoi(user, day, {
        createdBy,
        backfill: Boolean(dayOverride),
      });
      if (result.skipped) {
        skipped += 1;
        continue;
      }
      credited += 1;
      totalAmount += result.amount;
      levelCredited += result.levelIncome?.credited || 0;
      levelTotalAmount += result.levelIncome?.totalAmount || 0;
      details.push(result);
    } catch (err) {
      failed += 1;
      const msg = err?.message || String(err);
      console.error(`[daily-roi] failed for ${user.userId}:`, msg);
      errors.push({ userId: user.userId, message: msg });
    }
  }

  return {
    success: true,
    day,
    roiPercent: ROI_PERCENT,
    credited,
    skipped,
    failed,
    totalAmount: Number(totalAmount.toFixed(8)),
    levelCredited,
    levelTotalAmount: Number(levelTotalAmount.toFixed(8)),
    details,
    errors,
    message: `Daily ROI ${ROI_PERCENT}% done for ${day}: ${credited} users, $${totalAmount.toFixed(2)} ROI · ${levelCredited} level credits, $${levelTotalAmount.toFixed(2)}${failed ? ` · ${failed} failed` : ''}`,
  };
}

module.exports = {
  runDailyRoi,
  creditOneDailyRoi,
  ROI_PERCENT,
  ROI_CAP_MULTIPLIER,
  todayKey,
  roiBase,
  remainingRoiCap,
};
