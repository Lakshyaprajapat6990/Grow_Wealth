const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getTeamVolume } = require('./rankRewardService');

const LEADER_INCENTIVE_COMPANY = Number(process.env.LEADER_INCENTIVE_COMPANY || 50);
const LEADER_INCENTIVE_LEADER = Number(process.env.LEADER_INCENTIVE_LEADER || 50);
const LEADER_INCENTIVE_UNLOCK = Number(process.env.LEADER_INCENTIVE_UNLOCK_VOLUME || 500);

/**
 * Grant locked 100 USDT gift to a member (50 company + 50 leader).
 * Non-withdrawable. Trading/ROI unlocks at $500 downline business.
 * Does NOT change role to leader (all members get this).
 */
async function grantLeaderIncentive(userId, { createdBy = 'system', source = 'auto_all_members' } = {}) {
  const user = await User.findOne({ userId: String(userId).trim().toUpperCase() });
  if (!user) return { ok: false, message: 'User not found' };
  if (user.role === 'admin') return { ok: false, message: 'Admin accounts are excluded' };
  if ((user.leaderIncentiveAmount || 0) > 0) {
    return { ok: false, message: 'Gift already granted', user, already: true };
  }

  const companyPart = LEADER_INCENTIVE_COMPANY;
  const leaderPart = LEADER_INCENTIVE_LEADER;
  const total = Number((companyPart + leaderPart).toFixed(8));

  user.leaderIncentiveAmount = total;
  user.leaderIncentiveCompanyPart = companyPart;
  user.leaderIncentiveLeaderPart = leaderPart;
  user.leaderIncentiveActive = false;
  user.leaderIncentiveUnlockVolume = LEADER_INCENTIVE_UNLOCK;
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'leader_incentive',
    amount: total,
    balanceAfter: user.incomeBalance,
    status: 'success',
    description: `Navratri gift ${total} USDT locked (company ${companyPart} + leader ${leaderPart}). Not withdrawable. Trading unlocks at $${LEADER_INCENTIVE_UNLOCK} team business.`,
    meta: {
      companyPart,
      leaderPart,
      unlockVolume: LEADER_INCENTIVE_UNLOCK,
      locked: true,
      active: false,
      source,
      withdrawable: false,
    },
    createdBy,
  });

  await checkAndUnlockLeaderIncentive(user.userId);

  const fresh = await User.findOne({ userId: user.userId });
  return { ok: true, user: fresh, already: false };
}

/** Ensure every member has the locked 100 USDT gift (idempotent). */
async function ensureMemberGift(userId) {
  const user = await User.findOne({ userId: String(userId).trim().toUpperCase() });
  if (!user || user.role === 'admin') return { ok: false, skipped: true };
  if ((user.leaderIncentiveAmount || 0) > 0) {
    await checkAndUnlockLeaderIncentive(user.userId);
    const fresh = await User.findOne({ userId: user.userId });
    return { ok: true, already: true, user: fresh };
  }
  return grantLeaderIncentive(user.userId, { createdBy: 'system', source: 'auto_all_members' });
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
    description: `Gift trading unlocked (team volume $${volume} ≥ $${unlockAt}). Still non-withdrawable.`,
    meta: {
      unlocked: true,
      teamVolume: volume,
      unlockAt,
      amount: user.leaderIncentiveAmount,
      withdrawable: false,
    },
    createdBy: 'system',
  });

  return { unlocked: true, volume, unlockAt };
}

module.exports = {
  LEADER_INCENTIVE_COMPANY,
  LEADER_INCENTIVE_LEADER,
  LEADER_INCENTIVE_UNLOCK,
  grantLeaderIncentive,
  ensureMemberGift,
  grantGiftToAllMembers,
  checkAndUnlockLeaderIncentive,
};
