const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getTeamVolume } = require('./rankRewardService');

const LEADER_INCENTIVE_COMPANY = Number(process.env.LEADER_INCENTIVE_COMPANY || 0);
const LEADER_INCENTIVE_LEADER = Number(process.env.LEADER_INCENTIVE_LEADER || 0);
const LEADER_INCENTIVE_UNLOCK = Number(process.env.LEADER_INCENTIVE_UNLOCK_VOLUME || 500);
const GIFT_TOTAL_DEFAULT = Number((LEADER_INCENTIVE_COMPANY + LEADER_INCENTIVE_LEADER).toFixed(8));

/**
 * Grant locked gift to a member (amount from env; default $0 = disabled for new joins).
 * Non-withdrawable. Does not earn ROI.
 * Pass amount/companyPart/leaderPart to override (admin top-up).
 */
async function grantLeaderIncentive(
  userId,
  {
    createdBy = 'system',
    source = 'auto_all_members',
    amount,
    companyPart: companyOverride,
    leaderPart: leaderOverride,
    allowTopUp = false,
  } = {}
) {
  const user = await User.findOne({ userId: String(userId).trim().toUpperCase() });
  if (!user) return { ok: false, message: 'User not found' };
  if (user.role === 'admin') return { ok: false, message: 'Admin accounts are excluded' };

  const companyPart = Number(
    companyOverride != null ? companyOverride : LEADER_INCENTIVE_COMPANY
  );
  const leaderPart = Number(leaderOverride != null ? leaderOverride : LEADER_INCENTIVE_LEADER);
  const total = Number(
    (amount != null ? amount : companyPart + leaderPart).toFixed(8)
  );

  if (!(total > 0)) {
    return { ok: false, message: 'Gift amount is 0 (disabled for new joins)', skipped: true };
  }

  const current = Number(user.leaderIncentiveAmount || 0);
  if (current > 0 && !allowTopUp) {
    return { ok: false, message: 'Gift already granted', user, already: true };
  }
  if (allowTopUp && current >= total) {
    return { ok: false, message: 'Gift already at or above target', user, already: true };
  }

  const prev = current;
  user.leaderIncentiveAmount = total;
  user.leaderIncentiveCompanyPart = companyPart;
  user.leaderIncentiveLeaderPart = leaderPart;
  user.leaderIncentiveActive = false;
  user.leaderIncentiveUnlockVolume = LEADER_INCENTIVE_UNLOCK;
  await user.save();

  const delta = Number((total - prev).toFixed(8));
  await Transaction.create({
    userId: user.userId,
    type: 'leader_incentive',
    amount: allowTopUp && prev > 0 ? delta : total,
    balanceAfter: user.incomeBalance,
    status: 'success',
    description:
      allowTopUp && prev > 0
        ? `Gift top-up $${prev} → $${total} locked (company ${companyPart} + leader ${leaderPart}). Not withdrawable. Does not earn ROI.`
        : `Locked gift ${total} USDT (company ${companyPart} + leader ${leaderPart}). Not withdrawable. Does not earn ROI.`,
    meta: {
      companyPart,
      leaderPart,
      unlockVolume: LEADER_INCENTIVE_UNLOCK,
      locked: true,
      active: false,
      source,
      withdrawable: false,
      earnsRoi: false,
      previousAmount: prev,
      newAmount: total,
    },
    createdBy,
  });

  await checkAndUnlockLeaderIncentive(user.userId);

  const fresh = await User.findOne({ userId: user.userId });
  return { ok: true, user: fresh, already: false };
}

/** Ensure gift only when enabled (env total > 0). New joins get $0 by default. */
async function ensureMemberGift(userId) {
  const user = await User.findOne({ userId: String(userId).trim().toUpperCase() });
  if (!user || user.role === 'admin') return { ok: false, skipped: true };
  if ((user.leaderIncentiveAmount || 0) > 0) {
    await checkAndUnlockLeaderIncentive(user.userId);
    const fresh = await User.findOne({ userId: user.userId });
    return { ok: true, already: true, user: fresh };
  }
  if (!(GIFT_TOTAL_DEFAULT > 0)) {
    return { ok: false, skipped: true, message: 'Auto gift disabled' };
  }
  return grantLeaderIncentive(user.userId, { createdBy: 'system', source: 'auto_all_members' });
}

/** Set / top-up locked gift to an exact amount (e.g. 10 → 100). */
async function setMemberGiftAmount(userId, totalAmount, { createdBy = 'system', source = 'admin_adjust' } = {}) {
  const total = Number(Number(totalAmount).toFixed(8));
  if (!(total > 0)) return { ok: false, message: 'Invalid gift amount' };
  const half = Number((total / 2).toFixed(8));
  return grantLeaderIncentive(userId, {
    createdBy,
    source,
    amount: total,
    companyPart: half,
    leaderPart: half,
    allowTopUp: true,
  });
}

/** Backfill all existing members missing the gift. */
async function grantGiftToAllMembers({ createdBy = 'system' } = {}) {
  const users = await User.find({
    role: { $ne: 'admin' },
    $or: [{ leaderIncentiveAmount: { $exists: false } }, { leaderIncentiveAmount: 0 }, { leaderIncentiveAmount: null }],
  }).select('userId');

  const results = [];
  for (const u of users) {
    const r = await grantLeaderIncentive(u.userId, { createdBy, source: 'backfill_all_members' });
    results.push({ userId: u.userId, ok: r.ok, already: !!r.already, message: r.message });
  }
  return { count: results.length, results };
}

async function checkAndUnlockLeaderIncentive(userId) {
  const user = await User.findOne({ userId });
  if (!user || !(user.leaderIncentiveAmount > 0) || user.leaderIncentiveActive) {
    return { unlocked: false };
  }

  const unlockAt = Number(user.leaderIncentiveUnlockVolume || LEADER_INCENTIVE_UNLOCK);
  const { volume } = await getTeamVolume(user.userId);
  if (volume + 0.0001 < unlockAt) {
    return { unlocked: false, volume, unlockAt };
  }

  user.leaderIncentiveActive = true;
  user.leaderIncentiveUnlockedAt = new Date();
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'leader_incentive',
    amount: user.leaderIncentiveAmount,
    balanceAfter: user.incomeBalance,
    status: 'success',
    description: `Gift marked active (team volume $${volume} ≥ $${unlockAt}). Still non-withdrawable and does not earn ROI.`,
    meta: {
      unlocked: true,
      teamVolume: volume,
      unlockAt,
      amount: user.leaderIncentiveAmount,
      withdrawable: false,
      earnsRoi: false,
    },
    createdBy: 'system',
  });

  return { unlocked: true, volume, unlockAt };
}

module.exports = {
  LEADER_INCENTIVE_COMPANY,
  LEADER_INCENTIVE_LEADER,
  LEADER_INCENTIVE_UNLOCK,
  GIFT_TOTAL_DEFAULT,
  grantLeaderIncentive,
  ensureMemberGift,
  setMemberGiftAmount,
  grantGiftToAllMembers,
  checkAndUnlockLeaderIncentive,
};
