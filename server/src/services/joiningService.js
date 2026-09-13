const User = require('../models/User');
const Transaction = require('../models/Transaction');

const JOINING_AMOUNT = Number(process.env.JOINING_AMOUNT || 1);
const DIRECT_INCOME_PERCENT = Number(process.env.DIRECT_INCOME_PERCENT || 5);

async function creditDirectIncome(sponsorId, fromUserId, baseAmount) {
  if (!sponsorId || sponsorId === 'GW0000001' || sponsorId === 'ADMIN') return null;

  const sponsor = await User.findOne({ userId: sponsorId, isBlocked: false });
  if (!sponsor || sponsor.role === 'admin') return null;

  const amt = Number(((baseAmount * DIRECT_INCOME_PERCENT) / 100).toFixed(8));
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
    description: `Direct income ${DIRECT_INCOME_PERCENT}% from ${fromUserId}`,
    meta: { fromUserId, baseAmount, percent: DIRECT_INCOME_PERCENT },
    createdBy: 'system',
  });

  return amt;
}

/**
 * Auto-activate joining when a payment/fund credit of at least JOINING_AMOUNT is received.
 * Does not deduct from fund again (payment already credited).
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

  user.isJoined = true;
  user.joiningAmount = JOINING_AMOUNT;
  user.joinedAt = new Date();
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'joining',
    amount: JOINING_AMOUNT,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: `Auto joined on ${source} (min $${JOINING_AMOUNT})`,
    meta: { autoJoin: true, paymentAmount: paid, source },
    createdBy,
  });

  if (user.sponsorId) {
    await creditDirectIncome(user.sponsorId, user.userId, JOINING_AMOUNT);
  }

  const fresh = await User.findOne({ userId: user.userId });
  return { joined: true, alreadyJoined: false, user: fresh };
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
    });
  }
  return results;
}

module.exports = {
  JOINING_AMOUNT,
  autoJoinOnPayment,
  forceJoinUsers,
  creditDirectIncome,
};
