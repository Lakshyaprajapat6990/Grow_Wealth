const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { evaluateRanksUpChain } = require('./rankRewardService');

const JOINING_AMOUNT = Number(process.env.JOINING_AMOUNT || 1);

/** nth direct join → % of that member's joining/investment amount (sponsor only, no upline). */
const REFER_EARN_RATES = [5, 3, 2, 1.5, 1, 0.5, 0.5, 0.5, 0.5, 0.5];

function getReferEarnPercent(nth) {
  const n = Number(nth) || 0;
  if (n < 1) return 0;
  if (n <= REFER_EARN_RATES.length) return REFER_EARN_RATES[n - 1];
  return REFER_EARN_RATES[REFER_EARN_RATES.length - 1]; // after 10th: keep 0.5%
}

/**
 * Credit Refer & Earn to the direct sponsor only.
 * nth = which joined direct this is for the sponsor (1st→5%, 2nd→3%, …).
 * baseAmount = new member's joining/investment amount.
 */
async function creditReferEarn(sponsorId, fromUserId, baseAmount, nth) {
  if (!sponsorId || sponsorId === 'GW0000001' || sponsorId === 'ADMIN') return null;

  const sponsor = await User.findOne({ userId: sponsorId, isBlocked: false });
  if (!sponsor || sponsor.role === 'admin') return null;

  const percent = getReferEarnPercent(nth);
  const base = Number(baseAmount || 0);
  if (percent <= 0 || base <= 0) return null;

  const amt = Number(((base * percent) / 100).toFixed(8));
  if (amt <= 0) return null;

  sponsor.directIncome = Number(((sponsor.directIncome || 0) + amt).toFixed(8));
  sponsor.totalDirectIncome = Number(((sponsor.totalDirectIncome || 0) + amt).toFixed(8));
  sponsor.incomeBalance = Number((sponsor.incomeBalance + amt).toFixed(8));
  sponsor.totalEarnings = Number((sponsor.totalEarnings + amt).toFixed(8));
  await sponsor.save();

  await Transaction.create({
    userId: sponsor.userId,
    type: 'direct_income',
    amount: amt,
    balanceAfter: sponsor.incomeBalance,
    status: 'success',
    description: `Refer & Earn #${nth}: ${percent}% of $${base} from ${fromUserId}`,
    meta: {
      fromUserId,
      baseAmount: base,
      percent,
      referralIndex: nth,
      referEarn: true,
    },
    createdBy: 'system',
  });

  return { amount: amt, percent, nth, baseAmount: base };
}

/** How many directs under this sponsor have already joined (activated). */
async function countJoinedDirects(sponsorId) {
  if (!sponsorId) return 0;
  return User.countDocuments({ sponsorId, isJoined: true, role: 'user' });
}

/**
 * Auto-activate joining when a payment/fund credit of at least JOINING_AMOUNT is received.
 * Refer & Earn uses the payment/joining amount paid by the new member.
 */
async function autoJoinOnPayment(user, { paymentAmount = 0, createdBy = 'system', source = 'payment' } = {}) {
  if (!user || user.isJoined) {
    return { joined: false, alreadyJoined: !!user?.isJoined };
  }

  const paid = Number(paymentAmount || 0);
  const fund = Number(user.fundBalance || 0);
  if (paid < JOINING_AMOUNT && fund < JOINING_AMOUNT) {
    return { joined: false, alreadyJoined: false, reason: 'below_min' };
  }

  // Commission base = what they paid to join (fallback to min joining)
  const investBase = Math.max(paid, JOINING_AMOUNT);

  let referResult = null;
  if (user.sponsorId) {
    const priorJoined = await countJoinedDirects(user.sponsorId);
    const nth = priorJoined + 1;
    referResult = await creditReferEarn(user.sponsorId, user.userId, investBase, nth);
  }

  user.isJoined = true;
  user.joiningAmount = investBase;
  user.joinedAt = new Date();
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'joining',
    amount: investBase,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: `Auto joined on ${source} (invest $${investBase})`,
    meta: {
      autoJoin: true,
      paymentAmount: paid,
      investBase,
      source,
      referEarn: referResult
        ? { nth: referResult.nth, percent: referResult.percent, amount: referResult.amount }
        : null,
    },
    createdBy,
  });

  const fresh = await User.findOne({ userId: user.userId });
  const rankEval = await evaluateRanksUpChain(user.userId);
  return { joined: true, alreadyJoined: false, user: fresh, referEarn: referResult, rankRewards: rankEval.chain };
}

/** Manual join from fund balance (Activate Joining page). */
async function activateJoiningFromFund(user, createdBy) {
  if (!user || user.isJoined) {
    return { ok: false, message: 'Already joined' };
  }
  if (user.fundBalance < JOINING_AMOUNT) {
    return { ok: false, message: `Insufficient fund balance. Need $${JOINING_AMOUNT} to join.` };
  }

  const investBase = JOINING_AMOUNT;
  let referResult = null;
  if (user.sponsorId) {
    const priorJoined = await countJoinedDirects(user.sponsorId);
    const nth = priorJoined + 1;
    referResult = await creditReferEarn(user.sponsorId, user.userId, investBase, nth);
  }

  user.fundBalance = Number((user.fundBalance - JOINING_AMOUNT).toFixed(8));
  user.isJoined = true;
  user.joiningAmount = investBase;
  user.joinedAt = new Date();
  if ((user.totalDeposited || 0) < JOINING_AMOUNT) {
    user.totalDeposited = Number((user.totalDeposited + JOINING_AMOUNT).toFixed(8));
  }
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'joining',
    amount: investBase,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: `Joining activated for $${investBase}`,
    meta: {
      referEarn: referResult
        ? { nth: referResult.nth, percent: referResult.percent, amount: referResult.amount }
        : null,
    },
    createdBy: createdBy || user.userId,
  });

  const fresh = await User.findOne({ userId: user.userId });
  const rankEval = await evaluateRanksUpChain(user.userId);
  return { ok: true, user: fresh, referEarn: referResult, rankRewards: rankEval.chain };
}

/** Force-join specific users who already have fund (admin fix / migration). */
async function forceJoinUsers(userIds, createdBy = 'system') {
  const results = [];
  for (const id of userIds) {
    const userId = String(id).trim().toUpperCase();
    const user = await User.findOne({ userId });
    if (!user) {
      results.push({ userId, ok: false, message: 'not found' });
      continue;
    }
    if (user.isJoined) {
      results.push({ userId, ok: true, message: 'already joined', name: user.name });
      continue;
    }
    const result = await autoJoinOnPayment(user, {
      paymentAmount: Math.max(user.fundBalance || 0, user.totalDeposited || 0, JOINING_AMOUNT),
      createdBy,
      source: 'admin_force_join',
    });
    results.push({
      userId,
      name: user.name,
      ok: result.joined || result.alreadyJoined,
      message: result.joined ? 'joined' : result.reason || 'failed',
      referEarn: result.referEarn || null,
    });
  }
  return results;
}

module.exports = {
  JOINING_AMOUNT,
  REFER_EARN_RATES,
  getReferEarnPercent,
  creditReferEarn,
  countJoinedDirects,
  autoJoinOnPayment,
  activateJoiningFromFund,
  forceJoinUsers,
  /** @deprecated use creditReferEarn — kept for older imports */
  creditDirectIncome: async (sponsorId, fromUserId, baseAmount) => {
    const prior = await countJoinedDirects(sponsorId);
    return creditReferEarn(sponsorId, fromUserId, baseAmount, prior + 1);
  },
};
