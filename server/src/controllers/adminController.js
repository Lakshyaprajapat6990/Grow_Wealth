const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const { remainingRoiCap, roiBase, ROI_CAP_MULTIPLIER } = require('../services/roiService');
const { autoJoinOnPayment, forceJoinUsers } = require('../services/joiningService');
const { getUsdtTransferFromTx } = require('../utils/bscUsdt');
const { evaluateRanksUpChain } = require('../services/rankRewardService');
const { evaluateSalaryUpChain } = require('../services/salaryIncomeService');
const { generateUniqueUserId, generateTrxPassword, isValidBep20Address } = require('../utils/helpers');

const ROI_PERCENT = Number(process.env.ROI_PERCENT || 1);

async function dashboard(_req, res) {
  const [users, joined, pendingWithdrawals, totalDepositedAgg] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
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

/** Manual ROI credit for today only — same once-per-day rule as cron */
async function creditRoi(req, res) {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId required' });
  }

  const user = await User.findOne({ userId: String(userId).toUpperCase() });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (!user.isJoined) {
    return res.status(400).json({ success: false, message: 'User has not joined yet' });
  }

  const { creditOneDailyRoi, todayKey } = require('../services/roiService');
  const day = todayKey();
  const result = await creditOneDailyRoi(user, day, { createdBy: req.user.userId });
  if (result.skipped) {
    return res.status(400).json({
      success: false,
      message:
        result.reason === 'already' || result.reason === 'duplicate_race'
          ? `ROI for ${day} already credited (once per day only)`
          : result.reason === 'cap'
            ? `ROI cap reached (max ${ROI_CAP_MULTIPLIER}X investment)`
            : 'No ROI amount to credit',
    });
  }

  const amount = result.amount;
  const fresh = await User.findOne({ userId: user.userId });

  return res.json({
    success: true,
    message: `Credited $${amount} ROI (${ROI_PERCENT}%) for ${day}`,
    amount,
    user: fresh.toSafeJSON(),
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

  const kindLabel = withdrawal.kind === 'fund_refund' ? 'Fund refund' : 'Income withdrawal';
  const reqAmt = Number(withdrawal.requestedAmount ?? withdrawal.amount ?? 0);
  const feeAmt = Number(withdrawal.fee || 0);
  await Transaction.updateMany(
    { 'meta.withdrawalId': withdrawal._id },
    {
      $set: {
        status: 'success',
        description: `${kindLabel} paid · requested $${reqAmt} · fee $${feeAmt} · net $${withdrawal.amount}`,
      },
    }
  );

  return res.json({
    success: true,
    message: `${kindLabel} marked paid (net $${Number(withdrawal.amount).toFixed(2)})`,
    withdrawal,
    user: user.toSafeJSON(),
  });
}

async function listUsers(_req, res) {
  const users = await User.find({ role: { $ne: 'admin' } })
    .select('-password -transactionPassword')
    .sort({ createdAt: -1 })
    .limit(500);

  // In-memory mapping of sponsor -> children for fast downline business calculation
  const allForVolume = await User.find({ role: { $ne: 'admin' } })
    .select('userId sponsorId totalDeposited joiningAmount')
    .lean();

  const childrenMap = new Map();
  const directBusinessMap = new Map();

  for (const u of allForVolume) {
    const sid = u.sponsorId || '';
    if (!childrenMap.has(sid)) childrenMap.set(sid, []);
    childrenMap.get(sid).push(u);

    const dep = Number(u.totalDeposited || u.joiningAmount || 0);
    directBusinessMap.set(sid, (directBusinessMap.get(sid) || 0) + dep);
  }

  function calcDownlineBusiness(userId) {
    let total = 0;
    const queue = childrenMap.get(userId) ? [...childrenMap.get(userId)] : [];
    const seen = new Set();
    while (queue.length > 0) {
      const child = queue.shift();
      if (seen.has(child.userId)) continue;
      seen.add(child.userId);
      total += Number(child.totalDeposited || child.joiningAmount || 0);
      const grandKids = childrenMap.get(child.userId);
      if (grandKids) {
        for (const gk of grandKids) {
          if (!seen.has(gk.userId)) queue.push(gk);
        }
      }
    }
    return Number(total.toFixed(2));
  }

  const safeUsers = users.map((u) => {
    const json = u.toSafeJSON();
    json.teamBusiness = calcDownlineBusiness(u.userId);
    json.directBusiness = Number((directBusinessMap.get(u.userId) || 0).toFixed(2));
    return json;
  });

  return res.json({
    success: true,
    users: safeUsers,
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

  // Include leaders — gift/leader role must still appear in hierarchy search
  const all = await User.find({ role: { $ne: 'admin' } })
    .select(
      'userId name sponsorId isJoined fundBalance incomeBalance totalDeposited joiningAmount createdAt mobile email role leaderIncentiveAmount'
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

  function sumDescendantsBusiness(nodes) {
    let vol = 0;
    for (const node of nodes) {
      vol += Number(node.totalDeposited || node.joiningAmount || 0) + sumDescendantsBusiness(node.children || []);
    }
    return Number(vol.toFixed(2));
  }

  function buildNode(user, depth = 0, pathSet = new Set()) {
    if (!user || pathSet.has(user.userId) || depth > 25) return null;
    const nextPath = new Set(pathSet);
    nextPath.add(user.userId);
    const kids = (childrenOf.get(user.userId) || [])
      .map((c) => buildNode(c, depth + 1, nextPath))
      .filter(Boolean)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    const principal = Number(user.fundBalance || 0);
    const gift = Number(user.leaderIncentiveAmount || 0);
    return {
      userId: user.userId,
      name: user.name,
      sponsorId: user.sponsorId || null,
      isJoined: !!user.isJoined,
      role: user.role || 'user',
      fundBalance: Number((principal + gift).toFixed(8)),
      principalBalance: principal,
      leaderIncentiveAmount: gift,
      incomeBalance: user.incomeBalance || 0,
      totalDeposited: user.totalDeposited || 0,
      joiningAmount: user.joiningAmount || 0,
      directCount: kids.length,
      teamCount: countDescendants(kids),
      teamBusiness: sumDescendantsBusiness(kids),
      directBusiness: Number(kids.reduce((sum, k) => sum + Number(k.totalDeposited || k.joiningAmount || 0), 0).toFixed(2)),
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
    const salaryEval = await evaluateSalaryUpChain(user.userId);
    return res.json({
      success: true,
      message: `Joining approved — ${user.userId} activated`,
      deposit,
      user: fresh.toSafeJSON(),
      rankRewards: rankEval.chain,
      salaryRewards: salaryEval.chain,
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
  const salaryEval = await evaluateSalaryUpChain(user.userId);
  return res.json({
    success: true,
    message: joinResult.joined
      ? `Deposit $${amt} credited · ${user.userId} auto joined`
      : `Deposit $${amt} credited to ${user.userId}`,
    deposit,
    user: fresh.toSafeJSON(),
    rankRewards: rankEval.chain,
    salaryRewards: salaryEval.chain,
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
  if (!userId || !amount || !action) {
    return res.status(400).json({
      success: false,
      message: 'userId, amount, and action (credit|debit) required',
    });
  }

  const amt = Number(Number(amount).toFixed(8));
  if (amt <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
  }

  const user = await User.findOne({ userId: String(userId).trim().toUpperCase() });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (action === 'debit') {
    if ((user.fundBalance || 0) < amt) {
      return res.status(400).json({
        success: false,
        message: `Insufficient fund balance. Current balance is $${Number(user.fundBalance || 0).toFixed(2)}`,
      });
    }

    user.fundBalance = Number(Math.max(0, user.fundBalance - amt).toFixed(8));
    user.totalDeposited = Number(Math.max(0, (user.totalDeposited || 0) - amt).toFixed(8));
    user.joiningAmount = Number(Math.max(0, (user.joiningAmount || 0) - amt).toFixed(8));
    user.usdtBep20Balance = Number(Math.max(0, (user.usdtBep20Balance || 0) - amt).toFixed(8));
    if (user.fundBalance === 0) {
      user.isJoined = false;
    }
  } else if (action === 'credit') {
    user.fundBalance = Number((user.fundBalance + amt).toFixed(8));
    user.totalDeposited = Number((user.totalDeposited + amt).toFixed(8));
    user.usdtBep20Balance = Number(((user.usdtBep20Balance || 0) + amt).toFixed(8));
  } else {
    return res.status(400).json({ success: false, message: 'Invalid action: must be credit or debit' });
  }

  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: action === 'credit' ? 'admin_credit' : 'admin_debit',
    amount: amt,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: remark || `Admin ${action === 'credit' ? 'fund credit (+)' : 'fund debit (-)'} $${amt}`,
    meta: {
      action,
      amount: amt,
      remark: remark || null,
      balanceAfter: user.fundBalance,
    },
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
  let salaryRewards = [];
  if (action === 'credit') {
    const rankEval = await evaluateRanksUpChain(user.userId);
    const salaryEval = await evaluateSalaryUpChain(user.userId);
    rankRewards = rankEval.chain || [];
    salaryRewards = salaryEval.chain || [];
  }

  return res.json({
    success: true,
    message: joinResult.joined
      ? `Successfully credited $${amt} to ${user.userId} · auto-joined & activated!`
      : `Successfully ${action === 'credit' ? 'credited (+' : 'debited (-'}${amt}$) for ${user.userId}. New Balance: $${Number(fresh.fundBalance).toFixed(2)}`,
    user: fresh.toSafeJSON(),
    rankRewards,
    salaryRewards,
  });
}

/** Admin: create a new member ID with all details and optional deposit amount */
async function createMemberAdmin(req, res) {
  const {
    name,
    email,
    mobile,
    password,
    transactionPassword,
    sponsorId,
    walletAddress,
    depositAmount = 0,
    country = 'INDIA',
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Member name is required' });
  }
  if (!mobile || !String(mobile).trim()) {
    return res.status(400).json({ success: false, message: 'Mobile number is required' });
  }

  // Resolve sponsor
  let resolvedSponsorId = 'GW0000001';
  let sponsorDoc = null;
  const sid = (sponsorId || '').trim().toUpperCase();
  if (sid && sid !== 'ADMIN' && sid !== 'GW0000001') {
    sponsorDoc = await User.findOne({ userId: sid, isBlocked: false });
    if (!sponsorDoc) {
      return res.status(400).json({ success: false, message: `Sponsor ${sid} not found` });
    }
    resolvedSponsorId = sponsorDoc.userId;
  } else {
    sponsorDoc = await User.findOne({ userId: 'GW0000001' });
  }

  // Email handling: use provided or generate unique fallback
  let emailClean = (email || '').trim().toLowerCase();
  if (emailClean) {
    const emailExists = await User.findOne({ email: emailClean });
    if (emailExists) {
      return res.status(400).json({ success: false, message: `Email already registered (${emailClean})` });
    }
  } else {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const mobileLast4 = String(mobile).trim().slice(-4);
    let candidate = `${slug}${mobileLast4}@gmail.com`;
    let count = 1;
    while (await User.exists({ email: candidate })) {
      candidate = `${slug}${mobileLast4}${count}@gmail.com`;
      count += 1;
    }
    emailClean = candidate;
  }

  // Passwords
  const cleanFirstName = name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'member';
  const passwordPlain = (password || '').trim() || `${cleanFirstName}@123`;
  const trxPlain = (transactionPassword || '').trim() || generateTrxPassword();
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  const trxHash = await bcrypt.hash(trxPlain, 10);

  // Wallet address
  let wallet = (walletAddress || '').trim().toLowerCase();
  if (!wallet || !isValidBep20Address(wallet)) {
    wallet = '0x789074a9649f4d09c255a9c0c21df4306a6fd9e4';
  }

  const userId = await generateUniqueUserId();

  const user = await User.create({
    userId,
    name: name.trim(),
    email: emailClean,
    mobile: String(mobile).trim(),
    password: passwordHash,
    transactionPassword: trxHash,
    country: country || 'INDIA',
    role: 'user',
    sponsorId: resolvedSponsorId,
    walletAddress: wallet,
    isJoined: false,
    registrationPaid: true,
    fundBalance: 0,
    totalDeposited: 0,
  });

  if (sponsorDoc) {
    sponsorDoc.directCount = (sponsorDoc.directCount || 0) + 1;
    sponsorDoc.teamCount = (sponsorDoc.teamCount || 0) + 1;
    await sponsorDoc.save();
  }

  const dep = Number(Number(depositAmount || 0).toFixed(8));
  let joinResult = { joined: false };

  if (dep > 0) {
    user.fundBalance = dep;
    user.usdtBep20Balance = dep;
    user.totalDeposited = dep;
    await user.save();

    await Transaction.create({
      userId: user.userId,
      type: 'deposit',
      amount: dep,
      balanceAfter: user.fundBalance,
      status: 'success',
      description: `Admin deposit $${dep} USDT on member creation (sponsor ${resolvedSponsorId})`,
      meta: {
        method: 'admin_create_member',
        network: 'BEP-20',
        purpose: 'package',
        note: `Created by admin with deposit $${dep}`,
      },
      createdBy: req.user.userId,
    });

    joinResult = await autoJoinOnPayment(user, {
      paymentAmount: dep,
      createdBy: req.user.userId,
      source: 'admin_create_member',
    });

    await evaluateRanksUpChain(user.userId);
    await evaluateSalaryUpChain(user.userId);
  }

  const fresh = await User.findOne({ userId });

  return res.json({
    success: true,
    message: `Member ${fresh.userId} (${fresh.name}) created successfully!`,
    member: {
      userId: fresh.userId,
      name: fresh.name,
      email: fresh.email,
      mobile: fresh.mobile,
      passwordPlain,
      transactionPasswordPlain: trxPlain,
      sponsorId: fresh.sponsorId,
      sponsorName: sponsorDoc ? sponsorDoc.name : 'Grow Wealth Admin',
      walletAddress: fresh.walletAddress,
      depositAmount: dep,
      isJoined: fresh.isJoined,
      fundBalance: fresh.fundBalance,
      referEarnPaid: joinResult?.referChain?.levels || [],
    },
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
    status: { $ne: 'failed' },
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

/** Admin: grant locked gift to one member (amount from env; $0 = disabled). */
async function grantLeaderIncentiveAdmin(req, res) {
  const { grantLeaderIncentive } = require('../services/leaderIncentiveService');
  const userId = String(req.params.userId || req.body.userId || '').trim().toUpperCase();
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId required' });
  }
  const result = await grantLeaderIncentive(userId, {
    createdBy: req.user.userId,
    source: 'admin_manual',
  });
  if (!result.ok && !result.already) {
    return res.status(400).json({ success: false, message: result.message });
  }
  return res.json({
    success: true,
    message: result.already
      ? 'Gift already on this account (locked, non-withdrawable).'
      : 'Locked gift granted. Not withdrawable. Does not earn ROI.',
    user: result.user.toSafeJSON(),
  });
}

/** Admin: gift-all (no-op when env gift amount is $0). */
async function grantGiftToAllMembersAdmin(req, res) {
  const { grantGiftToAllMembers, GIFT_TOTAL_DEFAULT } = require('../services/leaderIncentiveService');
  if (!(GIFT_TOTAL_DEFAULT > 0)) {
    return res.json({
      success: true,
      message: 'Auto gift is $0 — no gifts granted to new/missing members.',
      count: 0,
      results: [],
    });
  }
  const out = await grantGiftToAllMembers({ createdBy: req.user.userId });
  return res.json({
    success: true,
    message: `Processed ${out.count} members for locked gift (non-withdrawable).`,
    ...out,
  });
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
  createMemberAdmin,
  forceJoinUsersAdmin,
  getUserHistory,
  grantLeaderIncentiveAdmin,
  grantGiftToAllMembersAdmin,
};
