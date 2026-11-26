const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getTeamVolume } = require('./rankRewardService');

/** Minimum direct referral business required to unlock salary (Option 1). */
const DIRECT_SALARY_REQUIRED = 500;

/**
 * Direct Referral Business: strictly the sum of initial joining/activation package amounts
 * (joiningAmount) of directly sponsored members. Subsequent top-ups and extra deposits are excluded.
 */
async function getDirectVolume(userId) {
  const directs = await User.find({ sponsorId: userId, role: { $ne: 'admin' }, isJoined: true })
    .select('userId joiningAmount totalDeposited isJoined')
    .lean();
  const volume = directs.reduce((sum, u) => {
    const amt = Number(u.joiningAmount ?? (u.isJoined ? 10 : 0));
    return sum + (amt > 0 ? amt : 0);
  }, 0);
  return {
    volume: Number(volume.toFixed(8)),
    directCount: directs.length,
    activeDirectCount: directs.filter((u) => u.isJoined && (Number(u.joiningAmount || 0) > 0 || Number(u.totalDeposited || 0) > 0)).length,
  };
}

/**
 * Daily Salary (Divided Monthly Salary) — based on downline Team Business (sum of totalDeposited)
 * AND personal direct referral business (minimum $500 USDT).
 * Highest matching tier only (not stacked). The monthly salary is divided across 30 days and paid daily
 * (e.g. $180 / 30 = $6.00 USDT/day) while team volume still qualifies and direct volume >= $500.
 * Achieving any tier unlocks daily withdrawals.
 */
const SALARY_PLAN = [
  { tier: 1, target: 3000, monthly: 180, daily: 6.0 },
  { tier: 2, target: 5000, monthly: 270, daily: 9.0 },
  { tier: 3, target: 7000, monthly: 450, daily: 15.0 },
  { tier: 4, target: 10000, monthly: 600, daily: 20.0 },
  { tier: 5, target: 15000, monthly: 750, daily: 25.0 },
  { tier: 6, target: 20000, monthly: 1000, daily: 33.33 },
];

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function currentPeriodKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function resolveSalaryTier(volume, directVolume = 0) {
  const vol = Number(volume || 0);
  const dVol = Number(directVolume || 0);
  let current = null;
  for (const cfg of SALARY_PLAN) {
    if (vol >= cfg.target) current = cfg;
  }
  const next = SALARY_PLAN.find((c) => vol < c.target) || null;
  const directQualified = dVol >= DIRECT_SALARY_REQUIRED;
  // Both team volume >= 3000 AND direct referral volume >= 500 required to unlock
  const unlocked = !!current && directQualified;
  return {
    current,
    next,
    unlocked,
    teamQualified: !!current,
    directQualified,
    directVolume: dVol,
    directRequired: DIRECT_SALARY_REQUIRED,
    directRemaining: Math.max(0, Number((DIRECT_SALARY_REQUIRED - dVol).toFixed(2))),
  };
}

/**
 * Credit one daily installment of salary (e.g. $6.00/day for Tier 1).
 * Idempotent: exactly once per calendar day per member.
 */
async function creditDailySalary(user, tierCfg, teamVolume, day = todayKey()) {
  const amt = Number(tierCfg.daily || Number((tierCfg.monthly / 30).toFixed(8)));
  if (amt <= 0) return null;

  // Idempotent: never pay same day twice
  const already = await Transaction.findOne({
    userId: user.userId,
    type: 'salary_income',
    'meta.salaryDay': day,
    status: 'success',
  }).lean();
  if (already) return null;

  user.salaryIncome = Number(((user.salaryIncome || 0) + amt).toFixed(8));
  user.totalSalaryIncome = Number(((user.totalSalaryIncome || 0) + amt).toFixed(8));
  user.incomeBalance = Number((user.incomeBalance + amt).toFixed(8));
  user.totalEarnings = Number((user.totalEarnings + amt).toFixed(8));
  user.salaryTier = Math.max(Number(user.salaryTier || 0), tierCfg.tier);
  user.lastSalaryDay = day;
  user.lastSalaryPeriod = currentPeriodKey();
  user.lastSalaryPaidAt = new Date();
  user.dailyWithdrawUnlocked = true;
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'salary_income',
    amount: amt,
    balanceAfter: user.incomeBalance,
    status: 'success',
    description: `Daily Salary tier ${tierCfg.tier}: ${amt} USDT/day ($${tierCfg.monthly}/mo) · team business $${teamVolume} (day ${day})`,
    meta: {
      salaryTier: tierCfg.tier,
      target: tierCfg.target,
      monthly: tierCfg.monthly,
      daily: amt,
      teamVolume,
      salaryDay: day,
      salaryPeriod: currentPeriodKey(),
      autoDaily: true,
    },
    createdBy: 'system',
  });

  return { tier: tierCfg.tier, amount: amt, monthly: tierCfg.monthly, teamVolume, day };
}

/** Backwards-compatible alias */
async function creditMonthlySalary(user, tierCfg, teamVolume, period) {
  return creditDailySalary(user, tierCfg, teamVolume);
}

/**
 * Unlock daily WD if both team business and direct referral business qualify;
 * credit today's daily salary installment if due.
 */
async function evaluateSalaryForUser(userId, { paySalary = true, day = todayKey() } = {}) {
  if (!userId || userId === 'GW0000001' || userId === 'ADMIN') {
    return { paid: null, volume: 0, directVolume: 0, unlocked: false };
  }

  const user = await User.findOne({ userId, isBlocked: false });
  if (!user || user.role === 'admin') {
    return { paid: null, volume: 0, directVolume: 0, unlocked: false };
  }

  const { volume, teamSize } = await getTeamVolume(userId);
  const { volume: directVolume, directCount } = await getDirectVolume(userId);
  const { current, next, unlocked, directQualified, directRemaining } = resolveSalaryTier(volume, directVolume);

  if (unlocked) {
    if (!user.dailyWithdrawUnlocked) {
      user.dailyWithdrawUnlocked = true;
    }
    if (Number(user.salaryTier || 0) < current.tier) {
      user.salaryTier = current.tier;
    }
    await user.save();
  } else {
    // If not direct qualified ($500), salary is locked and daily withdraw is locked
    if ((user.dailyWithdrawUnlocked || user.salaryTier > 0) && !directQualified) {
      user.dailyWithdrawUnlocked = false;
      user.salaryTier = 0;
      await user.save();
    }
  }

  let paid = null;
  if (paySalary && unlocked && current) {
    if (user.lastSalaryDay !== day) {
      paid = await creditDailySalary(user, current, volume, day);
    }
  }

  const salaryPopupEligible = Number(volume || 0) >= 3000 && Number(directVolume || 0) >= DIRECT_SALARY_REQUIRED;

  return {
    paid,
    volume,
    teamSize,
    directVolume,
    directCount,
    directRequired: DIRECT_SALARY_REQUIRED,
    directQualified,
    directRemaining,
    salaryTier: unlocked ? (user.salaryTier || current?.tier || 0) : 0,
    dailyWithdrawUnlocked: !!user.dailyWithdrawUnlocked,
    unlocked,
    salaryPopupEligible,
    salaryPopupDismissed: !!user.salaryPopupDismissed,
    current,
    next,
  };
}

/** After a deposit/join, re-check all uplines for salary unlock (pay today if qualified). */
async function evaluateSalaryUpChain(memberUserId, { day = todayKey() } = {}) {
  const member = await User.findOne({ userId: memberUserId }).select('sponsorId');
  if (!member?.sponsorId) return { chain: [] };

  const chain = [];
  let sid = member.sponsorId;
  const seen = new Set();

  while (sid && sid !== 'GW0000001' && sid !== 'ADMIN' && !seen.has(sid)) {
    seen.add(sid);
    const result = await evaluateSalaryForUser(sid, { paySalary: true, day });
    chain.push({ userId: sid, ...result });
    const up = await User.findOne({ userId: sid }).select('sponsorId');
    sid = up?.sponsorId || null;
  }

  return { chain };
}

/** Daily cron pass: pay daily salary installment for all qualified members (once per calendar day). */
async function runDailySalaryPass({ createdBy = 'cron', day = todayKey() } = {}) {
  const users = await User.find({
    role: { $ne: 'admin' },
    isBlocked: false,
    isJoined: true,
  }).select('userId');

  const results = { day, checked: 0, paid: 0, unlocked: 0, errors: [] };

  for (const row of users) {
    try {
      results.checked += 1;
      const r = await evaluateSalaryForUser(row.userId, { paySalary: true, day });
      if (r.paid) results.paid += 1;
      if (r.unlocked) results.unlocked += 1;
    } catch (err) {
      results.errors.push({ userId: row.userId, message: err.message });
    }
  }

  results.createdBy = createdBy;
  return { success: true, ...results };
}

/** Backwards-compatible alias for existing cron callers */
const runMonthlySalaryPass = runDailySalaryPass;

async function getSalaryStatus(userId) {
  const user = await User.findOne({ userId });
  if (!user) return null;

  const { volume, teamSize } = await getTeamVolume(userId);
  const { volume: directVolume, directCount } = await getDirectVolume(userId);
  const { current, next, unlocked, directQualified, directRemaining } = resolveSalaryTier(volume, directVolume);
  const day = todayKey();
  const period = currentPeriodKey();
  const paidToday = user.lastSalaryDay === day;

  const tiers = SALARY_PLAN.map((t) => {
    const hitTeam = volume >= t.target;
    const hitBoth = hitTeam && directQualified;
    return {
      ...t,
      unlocked: hitBoth,
      teamQualified: hitTeam,
      directQualified,
      isCurrent: unlocked && current?.tier === t.tier,
      progressPercent: Math.min(100, Number(((volume / t.target) * 100).toFixed(2))),
    };
  });

  const salaryPopupEligible = Number(volume || 0) >= 3000 && Number(directVolume || 0) >= DIRECT_SALARY_REQUIRED;

  return {
    salaryTier: unlocked ? (user.salaryTier || current?.tier || 0) : 0,
    teamVolume: volume,
    teamSize,
    directVolume,
    directCount,
    directRequired: DIRECT_SALARY_REQUIRED,
    directQualified,
    directRemaining,
    unlocked,
    salaryPopupEligible,
    salaryPopupDismissed: !!user.salaryPopupDismissed,
    totalSalaryIncome: user.totalSalaryIncome || 0,
    salaryMonthsPaid: user.salaryMonthsPaid || 0,
    lastSalaryDay: user.lastSalaryDay || null,
    lastSalaryPaidAt: user.lastSalaryPaidAt || null,
    currentDay: day,
    currentPeriod: period,
    paidToday,
    paidThisMonth: paidToday, // compatibility
    dailyWithdrawUnlocked: !!user.dailyWithdrawUnlocked,
    currentTier: current,
    nextTier: next,
    remainingToNext: next ? Math.max(0, Number((next.target - volume).toFixed(2))) : 0,
    dailyAmount: unlocked && current ? current.daily : 0,
    monthlyAmount: unlocked && current ? current.monthly : 0,
    tiers,
  };
}

module.exports = {
  SALARY_PLAN,
  DIRECT_SALARY_REQUIRED,
  todayKey,
  currentPeriodKey,
  getDirectVolume,
  resolveSalaryTier,
  creditDailySalary,
  creditMonthlySalary,
  evaluateSalaryForUser,
  evaluateSalaryUpChain,
  runDailySalaryPass,
  runMonthlySalaryPass,
  getSalaryStatus,
};
