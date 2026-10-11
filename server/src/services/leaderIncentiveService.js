const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getTeamVolume } = require('./rankRewardService');

const LEADER_INCENTIVE_COMPANY = Number(process.env.LEADER_INCENTIVE_COMPANY || 50);
const LEADER_INCENTIVE_LEADER = Number(process.env.LEADER_INCENTIVE_LEADER || 50);
const LEADER_INCENTIVE_UNLOCK = Number(process.env.LEADER_INCENTIVE_UNLOCK_VOLUME || 500);

/**
 * Grant locked 100 USDT incentive (50 company + 50 leader).
 * Non-withdrawable. Trading/ROI benefits unlock at 500 USDT downline business.
 */
async function grantLeaderIncentive(userId, { createdBy = 'admin' } = {}) {
  const user = await User.findOne({ userId: String(userId).trim().toUpperCase() });
  if (!user) return { ok: false, message: 'User not found' };
  if ((user.leaderIncentiveAmount || 0) > 0) {
    return { ok: false, message: 'Leader incentive already granted' };
  }

  const companyPart = LEADER_INCENTIVE_COMPANY;
  const leaderPart = LEADER_INCENTIVE_LEADER;
  const total = Number((companyPart + leaderPart).toFixed(8));

  user.role = user.role === 'admin' ? 'admin' : 'leader';
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
    description: `Leader incentive ${total} USDT locked (company ${companyPart} + leader ${leaderPart}). Unlocks trading at $${LEADER_INCENTIVE_UNLOCK} team business.`,
    meta: {
      companyPart,
      leaderPart,
      unlockVolume: LEADER_INCENTIVE_UNLOCK,
      locked: true,
      active: false,
    },
    createdBy,
  });

  // Immediately check if already eligible
  await checkAndUnlockLeaderIncentive(user.userId);

  const fresh = await User.findOne({ userId: user.userId });
  return { ok: true, user: fresh };
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
    description: `Leader incentive trading unlocked (team volume $${volume} ≥ $${unlockAt}). Still non-withdrawable.`,
    meta: {
      unlocked: true,
      teamVolume: volume,
      unlockAt,
      amount: user.leaderIncentiveAmount,
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
  checkAndUnlockLeaderIncentive,
};
