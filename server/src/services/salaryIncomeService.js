const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getTeamVolume } = require('./rankRewardService');

/**
 * Monthly Salary — based on downline Team Business (sum of totalDeposited).
 * Highest matching tier only (not stacked). Paid once per calendar month (UTC)
 * while volume still qualifies. Achieving any tier unlocks daily withdrawals.
 */
const SALARY_PLAN = [
  { tier: 1, target: 3000, monthly: 180 },
  { tier: 2, target: 5000, monthly: 270 },
  { tier: 3, target: 7000, monthly: 450 },
  { tier: 4, target: 10000, monthly: 600 },
  { tier: 5, target: 15000, monthly: 750 },
  { tier: 6, target: 20000, monthly: 1000 },
];

function currentPeriodKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function resolveSalaryTier(volume) {
  const vol = Number(volume || 0);
  let current = null;
  for (const cfg of SALARY_PLAN) {
    if (vol >= cfg.target) current = cfg;
  }
  const next = SALARY_PLAN.find((c) => vol < c.target) || null;
  return { current, next, unlocked: !!current };
}

async function creditMonthlySalary(user, tierCfg, teamVolume, period) {
  const amt = Number(tierCfg.monthly);
  if (amt <= 0) return null;

  // Idempotent: never pay same period twice
  const already = await Transaction.findOne({
    userId: user.userId,
    type: 'salary_income',
    'meta.salaryPeriod': period,
    status: 'success',
  }).lean();
  if (already) return null;

  user.salaryIncome = Number(((user.salaryIncome || 0) + amt).toFixed(8));
  user.totalSalaryIncome = Number(((user.totalSalaryIncome || 0) + amt).toFixed(8));
  user.incomeBalance = Number((user.incomeBalance + amt).toFixed(8));
  user.totalEarnings = Number((user.totalEarnings + amt).toFixed(8));
  user.salaryTier = Math.max(Number(user.salaryTier || 0), tierCfg.tier);
  user.lastSalaryPeriod = period;
  user.lastSalaryPaidAt = new Date();
  user.salaryMonthsPaid = Number(user.salaryMonthsPaid || 0) + 1;
  user.dailyWithdrawUnlocked = true;
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'salary_income',
    amount: amt,
    balanceAfter: user.incomeBalance,
    status: 'success',
    description: `Monthly Salary tier ${tierCfg.tier}: ${amt} USDT (team business $${teamVolume}, period ${period})`,
    meta: {
      salaryTier: tierCfg.tier,
      target: tierCfg.target,
      monthly: amt,
      teamVolume,
      salaryPeriod: period,
    },
    createdBy: 'system',
  });

  return { tier: tierCfg.tier, amount: amt, teamVolume, period };
}

/**
 * Unlock daily WD if volume qualifies; credit this month's salary if due.
 */
async function evaluateSalaryForUser(userId, { paySalary = true } = {}) {
  if (!userId || userId === 'GW0000001' || userId === 'ADMIN') {
    return { paid: null, volume: 0, unlocked: false };
  }

  const user = await User.findOne({ userId, isBlocked: false });
  if (!user || user.role === 'admin') {
    return { paid: null, volume: 0, unlocked: false };
  }

  const { volume, teamSize } = await getTeamVolume(userId);
  const { current, next, unlocked } = resolveSalaryTier(volume);

  if (unlocked && !user.dailyWithdrawUnlocked) {
    user.dailyWithdrawUnlocked = true;
    user.salaryTier = Math.max(Number(user.salaryTier || 0), current.tier);
    await user.save();
  } else if (unlocked && current && Number(user.salaryTier || 0) < current.tier) {
    user.salaryTier = current.tier;
    await user.save();
  }

  let paid = null;
  if (paySalary && current) {
    const period = currentPeriodKey();
    if (user.lastSalaryPeriod !== period) {
      paid = await creditMonthlySalary(user, current, volume, period);
    }
  }

  return {
    paid,
    volume,
    teamSize,
    salaryTier: user.salaryTier || (current?.tier || 0),
    dailyWithdrawUnlocked: !!user.dailyWithdrawUnlocked || unlocked,
    current,
    next,
  };
}

/** After a deposit/join, re-check all uplines for salary unlock (pay if month due). */
async function evaluateSalaryUpChain(memberUserId) {
  const member = await User.findOne({ userId: memberUserId }).select('sponsorId');
  if (!member?.sponsorId) return { chain: [] };

  const chain = [];
  let sid = member.sponsorId;
  const seen = new Set();

  while (sid && sid !== 'GW0000001' && sid !== 'ADMIN' && !seen.has(sid)) {
    seen.add(sid);
    const result = await evaluateSalaryForUser(sid, { paySalary: true });
    chain.push({ userId: sid, ...result });
    const up = await User.findOne({ userId: sid }).select('sponsorId');
    sid = up?.sponsorId || null;
  }

  return { chain };
}

/** Daily cron helper: pay monthly salary for all qualified members (once per period). */
async function runMonthlySalaryPass({ createdBy = 'cron' } = {}) {
  const period = currentPeriodKey();
  const users = await User.find({
    role: { $ne: 'admin' },
    isBlocked: false,
    isJoined: true,
  }).select('userId');

  const results = { period, checked: 0, paid: 0, unlocked: 0, errors: [] };

  for (const row of users) {
    try {
      results.checked += 1;
      const r = await evaluateSalaryForUser(row.userId, { paySalary: true });
      if (r.paid) results.paid += 1;
      if (r.dailyWithdrawUnlocked) results.unlocked += 1;
    } catch (err) {
      results.errors.push({ userId: row.userId, message: err.message });
    }
  }

  results.createdBy = createdBy;
  return { success: true, ...results };
}

async function getSalaryStatus(userId) {
  const user = await User.findOne({ userId });
  if (!user) return null;

  const { volume, teamSize } = await getTeamVolume(userId);
  const { current, next, unlocked } = resolveSalaryTier(volume);
  const period = currentPeriodKey();
  const paidThisMonth = user.lastSalaryPeriod === period;

  const tiers = SALARY_PLAN.map((t) => {
    const hit = volume >= t.target;
    return {
      ...t,
      unlocked: hit,
      isCurrent: current?.tier === t.tier,
      progressPercent: Math.min(100, Number(((volume / t.target) * 100).toFixed(2))),
    };
  });

  return {
    salaryTier: user.salaryTier || (current?.tier || 0),
    teamVolume: volume,
    teamSize,
    totalSalaryIncome: user.totalSalaryIncome || 0,
    salaryMonthsPaid: user.salaryMonthsPaid || 0,
    lastSalaryPeriod: user.lastSalaryPeriod || null,
    lastSalaryPaidAt: user.lastSalaryPaidAt || null,
    currentPeriod: period,
    paidThisMonth,
    dailyWithdrawUnlocked: !!(user.dailyWithdrawUnlocked || unlocked),
    currentTier: current,
    nextTier: next,
    remainingToNext: next ? Math.max(0, Number((next.target - volume).toFixed(2))) : 0,
    monthlyAmount: current?.monthly || 0,
    tiers,
  };
}

module.exports = {
  SALARY_PLAN,
  currentPeriodKey,
  resolveSalaryTier,
  evaluateSalaryForUser,
  evaluateSalaryUpChain,
  runMonthlySalaryPass,
  getSalaryStatus,
};
