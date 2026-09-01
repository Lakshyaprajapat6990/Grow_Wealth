const Transaction = require('../models/Transaction');
const User = require('../models/User');

async function liveDeposits(_req, res) {
  const deposits = await Transaction.find({ type: 'deposit', status: 'success' })
    .sort({ createdAt: -1 })
    .limit(50);

  const userIds = [...new Set(deposits.map((d) => d.userId))];
  const users = await User.find({ userId: { $in: userIds } }).select('userId name country');
  const userMap = Object.fromEntries(users.map((u) => [u.userId, u]));

  const data = deposits.map((d) => ({
    userId: d.userId,
    name: userMap[d.userId]?.name || 'User',
    country: userMap[d.userId]?.country || '—',
    amount: d.amount,
    status: 'Success',
    type: 'deposit',
    createdAt: d.createdAt,
    hash: d.meta?.txHash || null,
  }));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalAgg, todayAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: 'deposit', status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { type: 'deposit', status: 'success', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return res.json({
    success: true,
    stats: {
      totalGrandInvestment: totalAgg[0]?.total || 0,
      todayTotalInvestment: todayAgg[0]?.total || 0,
    },
    deposits: data,
  });
}

async function globalCommunity(_req, res) {
  const users = await User.find({ isJoined: true })
    .select('userId name country joiningAmount joinedAt createdAt')
    .sort({ joinedAt: -1 })
    .limit(100);

  const data = users.map((u) => ({
    userId: u.userId,
    name: u.name,
    country: u.country,
    amount: u.joiningAmount || 1,
    date: u.joinedAt || u.createdAt,
    isActive: true,
    type: 'real',
  }));

  return res.json({ success: true, count: data.length, data });
}

module.exports = { liveDeposits, globalCommunity };
