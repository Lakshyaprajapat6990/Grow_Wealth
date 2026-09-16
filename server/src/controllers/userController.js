const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getRankStatus, RANK_PLAN } = require('../services/rankRewardService');

async function getProfile(req, res) {
  const { userId } = req.params;
  if (req.user.role !== 'admin' && req.user.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const user = await User.findOne({ userId });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const totalUsers = await User.countDocuments({ role: 'user' });
  return res.json({ success: true, user: user.toSafeJSON(), totalRealUsers: totalUsers });
}

async function getDirectTeam(req, res) {
  const { userId } = req.params;
  if (req.user.role !== 'admin' && req.user.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const team = await User.find({ sponsorId: userId })
    .select('userId name email isJoined joiningAmount totalDeposited createdAt country')
    .sort({ createdAt: -1 });

  return res.json({ success: true, team, totalTeam: team.length });
}

async function getAllTeam(req, res) {
  const { userId } = req.params;
  if (req.user.role !== 'admin' && req.user.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const all = await User.find({ sponsorId: { $ne: null } })
    .select('userId name sponsorId isJoined joiningAmount totalDeposited createdAt country')
    .sort({ createdAt: -1 });

  const downline = [];
  const queue = [userId];
  const visited = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    const directs = all.filter((u) => u.sponsorId === current && u.userId !== userId);
    directs.forEach((d) => {
      downline.push(d);
      queue.push(d.userId);
    });
  }

  const levelWiseCount = {};
  downline.forEach((_, i) => {
    const lvl = Math.min(Math.floor(i / 5) + 1, 12);
    levelWiseCount[lvl] = (levelWiseCount[lvl] || 0) + 1;
  });

  return res.json({
    success: true,
    team: downline,
    totalTeamCount: downline.length,
    directCount: all.filter((u) => u.sponsorId === userId).length,
    indirectCount: downline.length - all.filter((u) => u.sponsorId === userId).length,
    levelWiseCount,
  });
}

async function getDashboardSummary(req, res) {
  const u = req.user;
  const recent = await Transaction.find({ userId: u.userId }).sort({ createdAt: -1 }).limit(5);
  const rank = await getRankStatus(u.userId);

  return res.json({
    success: true,
    summary: {
      fundBalance: u.fundBalance,
      incomeBalance: u.incomeBalance,
      totalDeposited: u.totalDeposited,
      totalWithdrawn: u.totalWithdrawn,
      totalRoiIncome: u.totalRoiIncome,
      totalDirectIncome: u.totalDirectIncome,
      totalLevelIncome: u.totalLevelIncome,
      totalRankReward: u.totalRankReward || 0,
      currentRank: u.currentRank || 0,
      totalEarnings: u.totalEarnings,
      isJoined: u.isJoined,
      directCount: u.directCount,
      teamCount: u.teamCount,
      teamBusiness: rank?.teamVolume || 0,
      teamSize: rank?.teamSize || 0,
      remainingToNextRank: rank?.remainingToNext || 0,
      nextRank: rank?.nextRank || null,
      ranks: rank?.ranks || [],
      referralLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?ref=${u.userId}`,
    },
    recentTransactions: recent,
    rankPlan: RANK_PLAN,
  });
}

async function getMyRankStatus(req, res) {
  const status = await getRankStatus(req.user.userId);
  if (!status) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, ...status, plan: RANK_PLAN });
}

module.exports = { getProfile, getDirectTeam, getAllTeam, getDashboardSummary, getMyRankStatus };
