const Transaction = require('../models/Transaction');

const TYPE_MAP = {
  roi: 'roi',
  direct_income: 'direct_income',
  level_income: 'level_income',
  salary: 'salary_income',
  fast_track: 'fast_track_income',
  deposit: 'deposit',
  withdraw: 'withdraw',
  transfer_in: 'transfer_in',
  transfer_out: 'transfer_out',
};

async function getTransactions(req, res) {
  const { userId } = req.params;
  const { type } = req.query;

  if (req.user.role !== 'admin' && req.user.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const filter = { userId };
  if (type && TYPE_MAP[type]) filter.type = TYPE_MAP[type];

  const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(200);
  const total = transactions.reduce((s, t) => s + (t.status === 'success' ? t.amount : 0), 0);

  return res.json({ success: true, transactions, total });
}

module.exports = { getTransactions };
