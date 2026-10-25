const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { evaluateRanksUpChain } = require('./rankRewardService');
const { evaluateSalaryUpChain } = require('./salaryIncomeService');
const { checkAndUnlockLeaderIncentive } = require('./leaderIncentiveService');

const JOINING_AMOUNT = Number(process.env.JOINING_AMOUNT || 1);

/** L1 / L2 / L3 % of joining amount (upline chain). */
const REFER_LEVEL_RATES = [5, 2, 1];
/** Kept for API/UI compatibility — means L1/L2/L3 rates. */
const REFER_EARN_RATES = REFER_LEVEL_RATES;

const COMPANY_REFERRAL_PERCENT = Number(process.env.COMPANY_REFERRAL_PERCENT || 0.8);
const COMPANY_USER_ID = 'GW0000001';

function getReferEarnPercent(level) {
  const n = Number(level) || 0;
  if (n < 1 || n > REFER_LEVEL_RATES.length) return 0;
  return REFER_LEVEL_RATES[n - 1];
}

async function creditOneReferLevel(sponsor, fromUserId, baseAmount, level, percent) {
  const base = Number(baseAmount || 0);
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
    description: `Refer L${level}: ${percent}% of $${base} from ${fromUserId}`,
    meta: {
      fromUserId,
      baseAmount: base,
      percent,
      level,
      referEarn: true,
      referChain: true,
    },
    createdBy: 'system',
  });

  return { userId: sponsor.userId, amount: amt, percent, level, baseAmount: base };
}

/** Credit company 0.8% of joining amount (non-member payout). */
async function creditCompanyReferralShare(fromUserId, baseAmount) {
  const base = Number(baseAmount || 0);
  const amt = Number(((base * COMPANY_REFERRAL_PERCENT) / 100).toFixed(8));
  if (amt <= 0) return null;

  const company = await User.findOne({ userId: COMPANY_USER_ID });
  if (!company) return null;

  company.incomeBalance = Number(((company.incomeBalance || 0) + amt).toFixed(8));
  company.totalEarnings = Number(((company.totalEarnings || 0) + amt).toFixed(8));
  await company.save();

  await Transaction.create({
    userId: company.userId,
    type: 'company_income',
    amount: amt,
    balanceAfter: company.incomeBalance,
    status: 'success',
    description: `Company referral share ${COMPANY_REFERRAL_PERCENT}% of $${base} from ${fromUserId}`,
    meta: {
      fromUserId,
      baseAmount: base,
      percent: COMPANY_REFERRAL_PERCENT,
      purpose: 'company_referral_share',
    },
    createdBy: 'system',
  });

  return { amount: amt, percent: COMPANY_REFERRAL_PERCENT };
}

/**
 * Walk 3 uplines: L1=5%, L2=2%, L3=1% of joining/investment amount.
 * Also credits company 0.8%.
 */
async function creditReferEarnChain(fromUserId, baseAmount) {
  const member = await User.findOne({ userId: fromUserId }).select('sponsorId');
  if (!member?.sponsorId) {
    return { levels: [], company: null };
  }

  const levels = [];
  let sid = member.sponsorId;
  const seen = new Set();

  for (let level = 1; level <= REFER_LEVEL_RATES.length; level += 1) {
    if (!sid || sid === COMPANY_USER_ID || sid === 'ADMIN' || seen.has(sid)) break;
    seen.add(sid);

    const sponsor = await User.findOne({ userId: sid, isBlocked: false });
    if (!sponsor || sponsor.role === 'admin') {
      sid = sponsor?.sponsorId || null;
      continue;
    }

    const percent = getReferEarnPercent(level);
    const credited = await creditOneReferLevel(sponsor, fromUserId, baseAmount, level, percent);
    if (credited) levels.push(credited);

    sid = sponsor.sponsorId || null;
  }

  const company = await creditCompanyReferralShare(fromUserId, baseAmount);
  return { levels, company };
}

/** @deprecated sliding-nth API — now credits L1 only equivalent via chain */
async function creditReferEarn(sponsorId, fromUserId, baseAmount, _nth) {
  const chain = await creditReferEarnChain(fromUserId, baseAmount);
  return chain.levels[0] || null;
}

async function countJoinedDirects(sponsorId) {
  if (!sponsorId) return 0;
  return User.countDocuments({ sponsorId, isJoined: true, role: { $ne: 'admin' } });
}

async function afterJoinSideEffects(userId) {
  const rankEval = await evaluateRanksUpChain(userId);
  const salaryEval = await evaluateSalaryUpChain(userId);
  // Unlock leader incentives up the chain when team volume moves
  const member = await User.findOne({ userId }).select('sponsorId');
  let sid = member?.sponsorId;
  const seen = new Set();
  while (sid && sid !== COMPANY_USER_ID && !seen.has(sid)) {
    seen.add(sid);
    await checkAndUnlockLeaderIncentive(sid);
    const up = await User.findOne({ userId: sid }).select('sponsorId');
    sid = up?.sponsorId || null;
  }
  return { ...rankEval, salaryChain: salaryEval.chain };
}

async function autoJoinOnPayment(user, { paymentAmount = 0, createdBy = 'system', source = 'payment' } = {}) {
  if (!user || user.isJoined) {
    return { joined: false, alreadyJoined: !!user?.isJoined };
  }

  const paid = Number(paymentAmount || 0);
  const fund = Number(user.fundBalance || 0);
  if (paid < JOINING_AMOUNT && fund < JOINING_AMOUNT) {
    return { joined: false, alreadyJoined: false, reason: 'below_min' };
  }

  const investBase = Math.max(paid, JOINING_AMOUNT);

  user.isJoined = true;
  user.joiningAmount = investBase;
  user.joinedAt = new Date();
  await user.save();

  let referChain = { levels: [], company: null };
  if (user.sponsorId) {
    referChain = await creditReferEarnChain(user.userId, investBase);
  }

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
      referChain,
    },
    createdBy,
  });

  const fresh = await User.findOne({ userId: user.userId });
  const rankEval = await afterJoinSideEffects(user.userId);
  return {
    joined: true,
    alreadyJoined: false,
    user: fresh,
    referEarn: referChain.levels[0] || null,
    referChain,
    rankRewards: rankEval.chain,
  };
}

async function activateJoiningFromFund(user, createdBy) {
  if (!user || user.isJoined) {
    return { ok: false, message: 'Already joined' };
  }
  if (user.fundBalance < JOINING_AMOUNT) {
    return { ok: false, message: `Insufficient fund balance. Need $${JOINING_AMOUNT} to join.` };
  }

  const investBase = JOINING_AMOUNT;
  let referChain = { levels: [], company: null };
  if (user.sponsorId) {
    // Credit after we know userId; chain uses fromUserId
  }

  user.fundBalance = Number((user.fundBalance - JOINING_AMOUNT).toFixed(8));
  user.isJoined = true;
  user.joiningAmount = investBase;
  user.joinedAt = new Date();
  if ((user.totalDeposited || 0) < JOINING_AMOUNT) {
    user.totalDeposited = Number((user.totalDeposited + JOINING_AMOUNT).toFixed(8));
  }
  await user.save();

  if (user.sponsorId) {
    referChain = await creditReferEarnChain(user.userId, investBase);
  }

  await Transaction.create({
    userId: user.userId,
    type: 'joining',
    amount: investBase,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: `Joining activated for $${investBase}`,
    meta: { referChain },
    createdBy: createdBy || user.userId,
  });

  const fresh = await User.findOne({ userId: user.userId });
  const rankEval = await afterJoinSideEffects(user.userId);
  return {
    ok: true,
    user: fresh,
    referEarn: referChain.levels[0] || null,
    referChain,
    rankRewards: rankEval.chain,
  };
}

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
      referChain: result.referChain || null,
    });
  }
  return results;
}

module.exports = {
  JOINING_AMOUNT,
  REFER_EARN_RATES,
  REFER_LEVEL_RATES,
  COMPANY_REFERRAL_PERCENT,
  getReferEarnPercent,
  creditReferEarn,
  creditReferEarnChain,
  countJoinedDirects,
  autoJoinOnPayment,
  activateJoiningFromFund,
  forceJoinUsers,
  creditDirectIncome: async (_sponsorId, fromUserId, baseAmount) => {
    const chain = await creditReferEarnChain(fromUserId, baseAmount);
    return chain.levels[0] || null;
  },
};
