const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');

const JOINING_AMOUNT = Number(process.env.JOINING_AMOUNT || 1);
const FIRST_WITHDRAW_MIN = Number(process.env.FIRST_WITHDRAW_MIN || 10);

async function getWalletInfo(req, res) {
  const u = req.user;
  return res.json({
    success: true,
    fundBalance: u.fundBalance,
    incomeBalance: u.incomeBalance,
    availableBalance: u.incomeBalance,
    totalWithdrawn: u.totalWithdrawn,
    walletAddress: u.walletAddress,
    isJoined: u.isJoined,
    totalDeposited: u.totalDeposited,
    hasCompletedFirstWithdrawal: u.hasCompletedFirstWithdrawal,
    firstWithdrawMin: u.hasCompletedFirstWithdrawal ? 0 : FIRST_WITHDRAW_MIN,
    joiningAmount: JOINING_AMOUNT,
  });
}

/** Temporary/manual deposit credit for Phase 2 scaffolding (admin or self-test) */
async function creditDeposit(req, res) {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  const user = req.user;
  user.fundBalance = Number((user.fundBalance + amount).toFixed(8));
  user.usdtBep20Balance = Number((user.usdtBep20Balance + amount).toFixed(8));
  user.totalDeposited = Number((user.totalDeposited + amount).toFixed(8));
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'deposit',
    amount,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: 'USDT BEP-20 deposit credited',
    meta: { txHash: req.body.txHash || null, method: req.body.method || 'manual' },
    createdBy: user.userId,
  });

  return res.json({ success: true, message: 'Deposit credited', user: user.toSafeJSON() });
}

async function activateJoining(req, res) {
  const user = req.user;
  if (user.isJoined) {
    return res.status(400).json({ success: false, message: 'Already joined' });
  }
  if (user.fundBalance < JOINING_AMOUNT) {
    return res.status(400).json({
      success: false,
      message: `Insufficient fund balance. Need $${JOINING_AMOUNT} to join.`,
    });
  }

  user.fundBalance = Number((user.fundBalance - JOINING_AMOUNT).toFixed(8));
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
    description: `Joining activated for $${JOINING_AMOUNT}`,
    createdBy: user.userId,
  });

  return res.json({ success: true, message: 'Joining activated', user: user.toSafeJSON() });
}

async function requestWithdraw(req, res) {
  const amount = Number(req.body.amount);
  const { transactionPassword } = req.body;
  const user = req.user;

  if (!user.isJoined) {
    return res.status(400).json({ success: false, message: 'Activate joining first' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  const minRequired = user.hasCompletedFirstWithdrawal ? 0.01 : FIRST_WITHDRAW_MIN;
  if (amount < minRequired) {
    return res.status(400).json({
      success: false,
      message: user.hasCompletedFirstWithdrawal
        ? 'Invalid amount'
        : `First withdrawal minimum is $${FIRST_WITHDRAW_MIN}`,
    });
  }

  if (user.incomeBalance < amount) {
    return res.status(400).json({ success: false, message: 'Insufficient income balance' });
  }

  const trxOk = await bcrypt.compare(transactionPassword || '', user.transactionPassword);
  if (!trxOk) {
    return res.status(400).json({ success: false, message: 'Invalid Transaction Password' });
  }

  user.incomeBalance = Number((user.incomeBalance - amount).toFixed(8));
  user.pendingWithdrawals = Number((user.pendingWithdrawals + amount).toFixed(8));
  await user.save();

  const withdrawal = await Withdrawal.create({
    userId: user.userId,
    amount,
    walletAddress: user.walletAddress,
    status: 'pending',
    isFirstWithdrawal: !user.hasCompletedFirstWithdrawal,
  });

  await Transaction.create({
    userId: user.userId,
    type: 'withdraw',
    amount,
    balanceAfter: user.incomeBalance,
    status: 'pending',
    description: 'Withdrawal requested',
    meta: { withdrawalId: withdrawal._id },
    createdBy: user.userId,
  });

  return res.json({
    success: true,
    message: 'Withdrawal submitted',
    withdrawal,
    user: user.toSafeJSON(),
  });
}

async function walletHistory(req, res) {
  const history = await Transaction.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(100);
  return res.json({ success: true, history });
}

async function getDepositAddress(req, res) {
  return res.json({
    success: true,
    address: process.env.DEPOSIT_ADDRESS || '0xGrowWealthDepositAddressReplaceMe00000001',
    network: 'BEP-20 (BSC)',
  });
}

async function getWithdrawals(req, res) {
  const withdrawals = await Withdrawal.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(50);
  return res.json({ success: true, withdrawals });
}

async function transferFunds(req, res) {
  const { receiverUserId, amount, transactionPassword } = req.body;
  const sender = req.user;

  if (!sender.isJoined) {
    return res.status(400).json({ success: false, message: 'Activate joining first' });
  }

  const amt = Number(amount);
  if (!receiverUserId || !amt || amt < 5) {
    return res.status(400).json({ success: false, message: 'Invalid transfer details. Min $5.' });
  }

  const receiver = await User.findOne({ userId: String(receiverUserId).trim().toUpperCase() });
  if (!receiver) return res.status(404).json({ success: false, message: 'Receiver User ID not found' });
  if (receiver.userId === sender.userId) {
    return res.status(400).json({ success: false, message: 'Cannot transfer to yourself' });
  }

  if (sender.fundBalance < amt) {
    return res.status(400).json({ success: false, message: 'Insufficient fund balance' });
  }

  const trxOk = await bcrypt.compare(transactionPassword || '', sender.transactionPassword);
  if (!trxOk) {
    return res.status(400).json({ success: false, message: 'Invalid Transaction Password' });
  }

  sender.fundBalance = Number((sender.fundBalance - amt).toFixed(8));
  receiver.fundBalance = Number((receiver.fundBalance + amt).toFixed(8));
  await sender.save();
  await receiver.save();

  await Transaction.create([
    {
      userId: sender.userId,
      type: 'transfer_out',
      amount: amt,
      balanceAfter: sender.fundBalance,
      status: 'success',
      description: `Transfer to ${receiver.userId}`,
      meta: { toUserId: receiver.userId },
      createdBy: sender.userId,
    },
    {
      userId: receiver.userId,
      type: 'transfer_in',
      amount: amt,
      balanceAfter: receiver.fundBalance,
      status: 'success',
      description: `Transfer from ${sender.userId}`,
      meta: { fromUserId: sender.userId },
      createdBy: sender.userId,
    },
  ]);

  return res.json({
    success: true,
    message: 'Transfer successful',
    user: sender.toSafeJSON(),
  });
}

module.exports = {
  getWalletInfo,
  creditDeposit,
  activateJoining,
  requestWithdraw,
  walletHistory,
  getDepositAddress,
  getWithdrawals,
  transferFunds,
};
