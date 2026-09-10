const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');

const JOINING_AMOUNT = Number(process.env.JOINING_AMOUNT || 10);
const FIRST_WITHDRAW_MIN = Number(process.env.FIRST_WITHDRAW_MIN || 10);
const WITHDRAW_MIN = Number(process.env.WITHDRAW_MIN || 10);
const WITHDRAW_FEE_PERCENT = Number(process.env.WITHDRAW_FEE_PERCENT || 10);
const DIRECT_INCOME_PERCENT = Number(process.env.DIRECT_INCOME_PERCENT || 5);
const MIN_DEPOSIT = Number(process.env.MIN_DEPOSIT || 10);
const MAX_DEPOSIT = Number(process.env.MAX_DEPOSIT || 50000);

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
    withdrawMin: WITHDRAW_MIN,
    firstWithdrawMin: WITHDRAW_MIN,
    withdrawFeePercent: WITHDRAW_FEE_PERCENT,
    joiningAmount: JOINING_AMOUNT,
    minDeposit: MIN_DEPOSIT,
    maxDeposit: MAX_DEPOSIT,
    directIncomePercent: DIRECT_INCOME_PERCENT,
  });
}

async function creditDirectIncome(sponsorId, fromUserId, baseAmount) {
  if (!sponsorId || sponsorId === 'GW0000001' || sponsorId === 'ADMIN') {
    const company = await User.findOne({ userId: 'GW0000001' });
    // still allow company admin to receive if they are a user-like sponsor; skip if no real sponsor member
    if (!company || company.role === 'admin') return null;
  }

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

/** Member submits deposit proof — admin must approve before fund credit */
async function requestDeposit(req, res) {
  const amount = Number(req.body.amount);
  const txHash = String(req.body.txHash || '').trim();

  if (!amount || amount < MIN_DEPOSIT) {
    return res.status(400).json({
      success: false,
      message: `Minimum deposit is $${MIN_DEPOSIT}`,
    });
  }
  if (amount > MAX_DEPOSIT) {
    return res.status(400).json({
      success: false,
      message: `Maximum deposit is $${MAX_DEPOSIT}`,
    });
  }
  // increments of $1
  if (!Number.isInteger(amount) && Math.abs(amount - Math.round(amount)) > 0.001) {
    return res.status(400).json({ success: false, message: 'Deposit amount must be in $1 increments' });
  }
  if (!txHash || txHash.length < 10) {
    return res.status(400).json({ success: false, message: 'Transaction hash (Tx Hash) is required' });
  }

  const existing = await Transaction.findOne({
    type: 'deposit',
    'meta.txHash': txHash,
    status: { $in: ['pending', 'success'] },
  });
  if (existing) {
    return res.status(400).json({ success: false, message: 'This Tx Hash was already submitted' });
  }

  const user = req.user;
  const deposit = await Transaction.create({
    userId: user.userId,
    type: 'deposit',
    amount,
    balanceAfter: user.fundBalance,
    status: 'pending',
    description: 'USDT BEP-20 deposit submitted — awaiting admin approval',
    meta: {
      txHash,
      method: req.body.method || 'address_qr',
      network: 'BEP-20',
      depositAddress: process.env.DEPOSIT_ADDRESS || '',
      purpose: req.body.purpose || null,
    },
    createdBy: user.userId,
  });

  return res.json({
    success: true,
    message: 'Deposit submitted. Admin will credit after verifying Tx Hash.',
    deposit,
    user: user.toSafeJSON(),
  });
}

async function creditDeposit(req, res) {
  return requestDeposit(req, res);
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
  if ((user.totalDeposited || 0) < JOINING_AMOUNT) {
    user.totalDeposited = Number((user.totalDeposited + JOINING_AMOUNT).toFixed(8));
  }
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

  if (user.sponsorId) {
    await creditDirectIncome(user.sponsorId, user.userId, JOINING_AMOUNT);
  }

  const fresh = await User.findOne({ userId: user.userId });
  return res.json({ success: true, message: 'Joining activated', user: fresh.toSafeJSON() });
}

async function requestWithdraw(req, res) {
  const amount = Number(req.body.amount);
  const { transactionPassword } = req.body;
  const user = req.user;

  if (!user.isJoined) {
    return res.status(400).json({ success: false, message: 'Activate joining first' });
  }
  if (!amount || amount < WITHDRAW_MIN) {
    return res.status(400).json({
      success: false,
      message: `Minimum withdrawal is $${WITHDRAW_MIN}`,
    });
  }

  if (user.incomeBalance < amount) {
    return res.status(400).json({ success: false, message: 'Insufficient income balance' });
  }

  const trxOk = await bcrypt.compare(transactionPassword || '', user.transactionPassword);
  if (!trxOk) {
    return res.status(400).json({ success: false, message: 'Invalid Transaction Password' });
  }

  const fee = Number(((amount * WITHDRAW_FEE_PERCENT) / 100).toFixed(8));
  const netAmount = Number((amount - fee).toFixed(8));

  user.incomeBalance = Number((user.incomeBalance - amount).toFixed(8));
  user.pendingWithdrawals = Number((user.pendingWithdrawals + netAmount).toFixed(8));
  await user.save();

  const withdrawal = await Withdrawal.create({
    userId: user.userId,
    amount: netAmount,
    walletAddress: user.walletAddress,
    status: 'pending',
    isFirstWithdrawal: !user.hasCompletedFirstWithdrawal,
    fee,
    requestedAmount: amount,
  });

  await Transaction.create({
    userId: user.userId,
    type: 'withdraw',
    amount,
    balanceAfter: user.incomeBalance,
    status: 'pending',
    description: `Withdrawal requested $${amount} · fee ${WITHDRAW_FEE_PERCENT}% ($${fee}) · net $${netAmount}`,
    meta: {
      withdrawalId: withdrawal._id,
      fee,
      feePercent: WITHDRAW_FEE_PERCENT,
      netAmount,
      requestedAmount: amount,
    },
    createdBy: user.userId,
  });

  return res.json({
    success: true,
    message: `Withdrawal submitted. Fee ${WITHDRAW_FEE_PERCENT}% ($${fee}). Net payout $${netAmount}`,
    withdrawal,
    fee,
    netAmount,
    user: user.toSafeJSON(),
  });
}

/** Manual compounding — move income balance to fund balance */
async function compoundIncome(req, res) {
  const amount = Number(req.body.amount);
  const user = req.user;

  if (!user.isJoined) {
    return res.status(400).json({ success: false, message: 'Activate joining first' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }
  if (user.incomeBalance < amount) {
    return res.status(400).json({ success: false, message: 'Insufficient income balance' });
  }

  user.incomeBalance = Number((user.incomeBalance - amount).toFixed(8));
  user.fundBalance = Number((user.fundBalance + amount).toFixed(8));
  user.totalDeposited = Number((user.totalDeposited + amount).toFixed(8));
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'compound',
    amount,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: `Manual compound $${amount} from income to fund`,
    createdBy: user.userId,
  });

  return res.json({
    success: true,
    message: `Compounded $${amount} to fund balance`,
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
    address: process.env.DEPOSIT_ADDRESS || '0xA73EEAd1C853deF37F3B3bE1701e240d74770D8e',
    network: 'BEP-20 (BSC)',
    token: 'USDT',
    minDeposit: MIN_DEPOSIT,
    maxDeposit: MAX_DEPOSIT,
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
  requestDeposit,
  activateJoining,
  requestWithdraw,
  compoundIncome,
  walletHistory,
  getDepositAddress,
  getWithdrawals,
  transferFunds,
};
