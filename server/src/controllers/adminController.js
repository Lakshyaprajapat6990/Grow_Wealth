const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const { creditLevelIncomeFromRoi } = require('../services/levelIncomeService');
const { remainingRoiCap, roiBase, ROI_CAP_MULTIPLIER } = require('../services/roiService');
const { autoJoinOnPayment, forceJoinUsers } = require('../services/joiningService');
const { getUsdtTransferFromTx } = require('../utils/bscUsdt');
const { evaluateRanksUpChain } = require('../services/rankRewardService');

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

/** Manual ROI credit — 1%, with 2X cap + L1–L7 ROI-ka-ROI */
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

  const base = Number(baseAmount ?? roiBase(user));
  if (!base || base <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid ROI base amount' });
  }

  const remaining = remainingRoiCap(user);
  if (remaining <= 0) {
    return res.status(400).json({
      success: false,
      message: `ROI cap reached (max ${ROI_CAP_MULTIPLIER}X investment)`,
    });
  }

  let amount = Number(((base * ROI_PERCENT) / 100).toFixed(8));
  if (amount > remaining) amount = remaining;
  if (amount <= 0) {
    return res.status(400).json({ success: false, message: 'No ROI amount to credit' });
  }

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
    description: `Manual ROI ${ROI_PERCENT}% on $${base} · cap 2X`,
    meta: { baseAmount: base, roiPercent: ROI_PERCENT, manual: true },
    createdBy: req.user.userId,
  });

  const levelResult = await creditLevelIncomeFromRoi({
    fromUserId: user.userId,
    roiAmount: amount,
    createdBy: req.user.userId,
  });

  return res.json({
    success: true,
    message: `Credited $${amount} ROI (${ROI_PERCENT}%) · level income $${levelResult.totalAmount}`,
    amount,
    levelIncome: levelResult,
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
    .limit(500);
  return res.json({
    success: true,
    users: users.map((u) => u.toSafeJSON()),
  });
}

/**
 * Team hierarchy tree for admin.
 * ?userId=GW123 → tree rooted at that member
 * no userId → top-level members (sponsor admin / missing / unknown)
 */
async function getTeamHierarchy(req, res) {
  const rootId = String(req.query.userId || '')
    .trim()
    .toUpperCase();

  const all = await User.find({ role: 'user' })
    .select(
      'userId name sponsorId isJoined fundBalance incomeBalance totalDeposited joiningAmount createdAt mobile email'
    )
    .lean();

  const byId = new Map(all.map((u) => [u.userId, u]));
  const childrenOf = new Map();
  for (const u of all) {
    const sid = u.sponsorId || '';
    if (!childrenOf.has(sid)) childrenOf.set(sid, []);
    childrenOf.get(sid).push(u);
  }

  function countDescendants(nodes) {
    let n = 0;
    for (const node of nodes) {
      n += 1 + countDescendants(node.children || []);
    }
    return n;
  }

  function buildNode(user, depth = 0, pathSet = new Set()) {
    if (!user || pathSet.has(user.userId) || depth > 25) return null;
    const nextPath = new Set(pathSet);
    nextPath.add(user.userId);
    const kids = (childrenOf.get(user.userId) || [])
      .map((c) => buildNode(c, depth + 1, nextPath))
      .filter(Boolean)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return {
      userId: user.userId,
      name: user.name,
      sponsorId: user.sponsorId || null,
      isJoined: !!user.isJoined,
      fundBalance: user.fundBalance || 0,
      incomeBalance: user.incomeBalance || 0,
      totalDeposited: user.totalDeposited || 0,
      joiningAmount: user.joiningAmount || 0,
      directCount: kids.length,
      teamCount: countDescendants(kids),
      mobile: user.mobile || '',
      email: user.email || '',
      createdAt: user.createdAt,
      depth,
      children: kids,
    };
  }

  if (rootId) {
    const root = byId.get(rootId);
    if (!root) {
      return res.status(404).json({ success: false, message: `User ${rootId} not found` });
    }
    const tree = buildNode(root);
    return res.json({
      success: true,
      rootId,
      tree: tree ? [tree] : [],
      totalMembers: all.length,
    });
  }

  const roots = all
    .filter((u) => {
      const sid = u.sponsorId;
      if (!sid || sid === 'GW0000001' || sid === 'ADMIN') return true;
      return !byId.has(sid);
    })
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const tree = roots.map((r) => buildNode(r)).filter(Boolean);
  return res.json({
    success: true,
    rootId: null,
    tree,
    totalMembers: all.length,
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

  let amt = Number(deposit.amount);
  const txHash = deposit.meta?.txHash;
  const companyWallet = process.env.DEPOSIT_ADDRESS || '';
  const onChain = txHash ? await getUsdtTransferFromTx(txHash, companyWallet) : null;
  if (onChain && onChain.amount > 0) {
    if (Math.abs(onChain.amount - amt) > 0.0001) {
      deposit.meta = {
        ...(deposit.meta || {}),
        submittedAmount: amt,
        onChainAmount: onChain.amount,
        amountCorrectedFromChain: true,
      };
      amt = onChain.amount;
      deposit.amount = amt;
    }
  }

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

    user.fundBalance = Number((user.fundBalance + amt).toFixed(8));
    user.usdtBep20Balance = Number(((user.usdtBep20Balance || 0) + amt).toFixed(8));
    user.totalDeposited = Number((user.totalDeposited + amt).toFixed(8));
    await user.save();

    const joinResult = await autoJoinOnPayment(user, {
      paymentAmount: amt,
      createdBy: req.user.userId,
      source: 'joining_payment',
    });

    deposit.status = 'success';
    deposit.balanceAfter = (joinResult.user || user).fundBalance;
    deposit.description = `Joining $${amt} approved & account activated`;
    deposit.meta = { ...(deposit.meta || {}), approvedBy: req.user.userId, approvedAt: new Date(), autoJoined: true };
    await deposit.save();

    const fresh = joinResult.user || (await User.findOne({ userId: user.userId }));
    const rankEval = await evaluateRanksUpChain(user.userId);
    return res.json({
      success: true,
      message: `Joining approved — ${user.userId} activated`,
      deposit,
      user: fresh.toSafeJSON(),
      rankRewards: rankEval.chain,
    });
  }

  user.fundBalance = Number((user.fundBalance + amt).toFixed(8));
  user.usdtBep20Balance = Number((user.usdtBep20Balance + amt).toFixed(8));
  user.totalDeposited = Number((user.totalDeposited + amt).toFixed(8));
  await user.save();

  const joinResult = await autoJoinOnPayment(user, {
    paymentAmount: amt,
    createdBy: req.user.userId,
    source: 'deposit',
  });

  deposit.status = 'success';
  deposit.balanceAfter = (joinResult.user || user).fundBalance;
  deposit.description = joinResult.joined
    ? 'USDT deposit approved · fund credited · auto joined'
    : 'USDT BEP-20 deposit approved & credited';
  deposit.meta = {
    ...(deposit.meta || {}),
    approvedBy: req.user.userId,
    approvedAt: new Date(),
    autoJoined: !!joinResult.joined,
  };
  await deposit.save();

  const fresh = joinResult.user || (await User.findOne({ userId: user.userId }));
  const rankEval = await evaluateRanksUpChain(user.userId);
  return res.json({
    success: true,
    message: joinResult.joined
      ? `Deposit $${amt} credited · ${user.userId} auto joined`
      : `Deposit $${amt} credited to ${user.userId}`,
    deposit,
    user: fresh.toSafeJSON(),
    rankRewards: rankEval.chain,
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

  let joinResult = { joined: false };
  if (action === 'credit') {
    joinResult = await autoJoinOnPayment(user, {
      paymentAmount: amt,
      createdBy: req.user.userId,
      source: 'admin_fund_credit',
    });
  }

  const fresh = joinResult.user || (await User.findOne({ userId: user.userId }));
  let rankRewards = [];
  if (action === 'credit') {
    const rankEval = await evaluateRanksUpChain(user.userId);
    rankRewards = rankEval.chain || [];
  }
  return res.json({
    success: true,
    message: joinResult.joined
      ? `Fund credit $${amt} for ${user.userId} · auto joined`
      : `Fund ${action} $${amt} for ${user.userId}`,
    user: fresh.toSafeJSON(),
    rankRewards,
  });
}

/** Admin: deposit + credit history for one user */
async function getUserHistory(req, res) {
  const userId = String(req.params.userId || '')
    .trim()
    .toUpperCase();
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId required' });
  }

  const user = await User.findOne({ userId }).select('-password -transactionPassword');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const history = await Transaction.find({
    userId,
    type: {
      $in: [
        'deposit',
        'joining',
        'admin_credit',
        'admin_debit',
        'roi',
        'direct_income',
        'level_income',
        'salary_income',
        'fast_track_income',
        'rank_reward',
        'compound',
        'withdraw',
        'transfer_in',
        'transfer_out',
      ],
    },
  })
    .sort({ createdAt: -1 })
    .limit(200);

  const deposits = history.filter((t) => ['deposit', 'joining'].includes(t.type));
  const credits = history.filter((t) =>
    [
      'admin_credit',
      'roi',
      'direct_income',
      'level_income',
      'salary_income',
      'fast_track_income',
      'rank_reward',
      'transfer_in',
    ].includes(t.type)
  );

  return res.json({
    success: true,
    user: user.toSafeJSON(),
    history,
    deposits,
    credits,
  });
}

/** Admin: force-join users who already paid but status is still No */
async function forceJoinUsersAdmin(req, res) {
  const ids = Array.isArray(req.body.userIds) ? req.body.userIds : [];
  if (!ids.length) {
    return res.status(400).json({ success: false, message: 'userIds array required' });
  }
  const results = await forceJoinUsers(ids, req.user.userId);
  return res.json({ success: true, results });
}

module.exports = {
  dashboard,
  creditRoi,
  creditIncome,
  listWithdrawals,
  approveWithdrawal,
  listUsers,
  getTeamHierarchy,
  listPendingDeposits,
  approveDeposit,
  rejectDeposit,
  adjustFund,
  forceJoinUsersAdmin,
  getUserHistory,
};
