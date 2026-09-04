const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');

const ROI_PERCENT = Number(process.env.ROI_PERCENT || 1);

async function dashboard(_req, res) {
  const [users, joined, pendingWithdrawals, totalDepositedAgg] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ isJoined: true }),
    Withdrawal.countDocuments({ status: 'pending' }),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$totalDeposited' } } }]),
  ]);

  return res.json({
    success: true,
    stats: {
      totalUsers: users,
      joinedUsers: joined,
      pendingWithdrawals,
      totalDeposited: totalDepositedAgg[0]?.total || 0,
      roiPercent: ROI_PERCENT,
    },
  });
}

/** Manual ROI credit — 1%, 24/7, by admin */
async function creditRoi(req, res) {
  const { userId, baseAmount } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId required' });
  }

  const user = await User.findOne({ userId: String(userId).toUpperCase() });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (!user.isJoined) {
    return res.status(400).json({ success: false, message: 'User has not joined yet' });
  }

  const base = Number(baseAmount ?? user.totalDeposited ?? user.joiningAmount ?? 0);
  if (!base || base <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid ROI base amount' });
  }

  const amount = Number(((base * ROI_PERCENT) / 100).toFixed(8));
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
    description: `Manual ROI ${ROI_PERCENT}% on $${base}`,
    meta: { baseAmount: base, roiPercent: ROI_PERCENT },
    createdBy: req.user.userId,
  });

  return res.json({
    success: true,
    message: `Credited $${amount} ROI (${ROI_PERCENT}%)`,
    amount,
    user: user.toSafeJSON(),
  });
}

async function listWithdrawals(req, res) {
  const status = req.query.status || 'pending';
  const filter = status === 'all' ? {} : { status };
  const list = await Withdrawal.find(filter).sort({ createdAt: -1 }).limit(200);
  return res.json({ success: true, withdrawals: list });
}

async function approveWithdrawal(req, res) {
  const { id } = req.params;
  const withdrawal = await Withdrawal.findById(id);
  if (!withdrawal) return res.status(404).json({ success: false, message: 'Not found' });
  if (withdrawal.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Already processed' });
  }

  const user = await User.findOne({ userId: withdrawal.userId });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  withdrawal.status = 'paid';
  withdrawal.processedAt = new Date();
  withdrawal.processedBy = req.user.userId;
  await withdrawal.save();

  user.pendingWithdrawals = Number(Math.max(0, user.pendingWithdrawals - withdrawal.amount).toFixed(8));
  user.totalWithdrawn = Number((user.totalWithdrawn + withdrawal.amount).toFixed(8));
  user.withdrawalCount += 1;
  if (withdrawal.isFirstWithdrawal) user.hasCompletedFirstWithdrawal = true;
  await user.save();

  await Transaction.updateMany(
    { 'meta.withdrawalId': withdrawal._id },
    { $set: { status: 'success', description: 'Withdrawal paid' } }
  );

  return res.json({ success: true, message: 'Withdrawal marked paid', withdrawal, user: user.toSafeJSON() });
}

async function listUsers(_req, res) {
  const users = await User.find({ role: 'user' })
    .select('-password -transactionPassword')
    .sort({ createdAt: -1 })
    .limit(200);
  return res.json({
    success: true,
    users: users.map((u) => u.toSafeJSON()),
  });
}

async function creditIncome(req, res) {
  const { userId, amount, description } = req.body;
  const incomeType = req.body.incomeType || req.body.type;
  const typeMap = {
    direct: { field: 'directIncome', total: 'totalDirectIncome', tx: 'direct_income' },
    level: { field: 'levelIncome', total: 'totalLevelIncome', tx: 'level_income' },
    salary: { field: 'salaryIncome', total: 'totalSalaryIncome', tx: 'salary_income' },
    fast_track: { field: 'fastTrackIncome', total: 'totalFastTrackIncome', tx: 'fast_track_income' },
  };

  const cfg = typeMap[incomeType];
  if (!userId || !amount || !cfg) {
    return res.status(400).json({ success: false, message: 'userId, amount, incomeType required' });
  }

  const user = await User.findOne({ userId: String(userId).toUpperCase() });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const amt = Number(amount);
  user[cfg.field] = Number(((user[cfg.field] || 0) + amt).toFixed(8));
  user[cfg.total] = Number(((user[cfg.total] || 0) + amt).toFixed(8));
  user.incomeBalance = Number((user.incomeBalance + amt).toFixed(8));
  user.totalEarnings = Number((user.totalEarnings + amt).toFixed(8));
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: cfg.tx,
    amount: amt,
    balanceAfter: user.incomeBalance,
    status: 'success',
    description: description || `${incomeType} income credited`,
    createdBy: req.user.userId,
  });

  return res.json({ success: true, message: `Credited $${amt} ${incomeType} income`, user: user.toSafeJSON() });
}

async function listPendingDeposits(_req, res) {
  const deposits = await Transaction.find({
    status: 'pending',
    type: { $in: ['deposit', 'joining'] },
  })
    .sort({ createdAt: -1 })
    .limit(200);
  return res.json({ success: true, deposits });
}

async function approveDeposit(req, res) {
  const { id } = req.params;
  const deposit = await Transaction.findById(id);
  if (!deposit || !['deposit', 'joining'].includes(deposit.type)) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }
  if (deposit.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Already processed' });
  }

  const user = await User.findOne({ userId: deposit.userId });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const amt = Number(deposit.amount);
  const isJoining = deposit.type === 'joining' || deposit.meta?.purpose === 'registration_joining';

  if (isJoining) {
    if (user.isJoined) {
      deposit.status = 'success';
      deposit.description = 'Joining already active — payment marked success';
      deposit.meta = { ...(deposit.meta || {}), approvedBy: req.user.userId, approvedAt: new Date() };
      await deposit.save();
      return res.json({
        success: true,
        message: `${user.userId} already joined`,
        deposit,
        user: user.toSafeJSON(),
      });
    }

    user.isJoined = true;
    user.joiningAmount = amt;
    user.joinedAt = new Date();
    user.totalDeposited = Number((user.totalDeposited + amt).toFixed(8));
    await user.save();

    deposit.status = 'success';
    deposit.balanceAfter = user.fundBalance;
    deposit.description = `Joining $${amt} approved & account activated`;
    deposit.meta = { ...(deposit.meta || {}), approvedBy: req.user.userId, approvedAt: new Date() };
    await deposit.save();

    return res.json({
      success: true,
      message: `Joining approved — ${user.userId} activated`,
      deposit,
      user: user.toSafeJSON(),
    });
  }

  user.fundBalance = Number((user.fundBalance + amt).toFixed(8));
  user.usdtBep20Balance = Number((user.usdtBep20Balance + amt).toFixed(8));
  user.totalDeposited = Number((user.totalDeposited + amt).toFixed(8));
  await user.save();

  deposit.status = 'success';
  deposit.balanceAfter = user.fundBalance;
  deposit.description = 'USDT BEP-20 deposit approved & credited';
  deposit.meta = { ...(deposit.meta || {}), approvedBy: req.user.userId, approvedAt: new Date() };
  await deposit.save();

  return res.json({
    success: true,
    message: `Deposit $${amt} credited to ${user.userId}`,
    deposit,
    user: user.toSafeJSON(),
  });
}

async function rejectDeposit(req, res) {
  const { id } = req.params;
  const deposit = await Transaction.findById(id);
  if (!deposit || !['deposit', 'joining'].includes(deposit.type)) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }
  if (deposit.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Already processed' });
  }

  deposit.status = 'rejected';
  deposit.description = req.body.reason || 'Payment rejected by admin';
  deposit.meta = { ...(deposit.meta || {}), rejectedBy: req.user.userId, rejectedAt: new Date() };
  await deposit.save();

  return res.json({ success: true, message: 'Payment rejected', deposit });
}

/** Admin credit or debit member fund balance */
async function adjustFund(req, res) {
  const { userId, amount, action, remark } = req.body;
  const amt = Number(amount);
  if (!userId || !amt || amt <= 0 || !['credit', 'debit'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'userId, amount, and action (credit|debit) required',
    });
  }

  const user = await User.findOne({ userId: String(userId).toUpperCase() });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (action === 'debit' && user.fundBalance < amt) {
    return res.status(400).json({ success: false, message: 'Insufficient fund balance' });
  }

  if (action === 'credit') {
    user.fundBalance = Number((user.fundBalance + amt).toFixed(8));
    user.totalDeposited = Number((user.totalDeposited + amt).toFixed(8));
  } else {
    user.fundBalance = Number((user.fundBalance - amt).toFixed(8));
  }
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: action === 'credit' ? 'admin_credit' : 'admin_debit',
    amount: amt,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: remark || `Admin ${action} $${amt}`,
    createdBy: req.user.userId,
  });

  return res.json({
    success: true,
    message: `Fund ${action} $${amt} for ${user.userId}`,
    user: user.toSafeJSON(),
  });
}

module.exports = {
  dashboard,
  creditRoi,
  creditIncome,
  listWithdrawals,
  approveWithdrawal,
  listUsers,
  listPendingDeposits,
  approveDeposit,
  rejectDeposit,
  adjustFund,
};
