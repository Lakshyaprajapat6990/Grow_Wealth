const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const {
  JOINING_AMOUNT,
  REFER_EARN_RATES,
  activateJoiningFromFund,
} = require('../services/joiningService');

const WITHDRAW_MIN = Number(process.env.WITHDRAW_MIN || 10);
const WITHDRAW_FEE_PERCENT = Number(process.env.WITHDRAW_FEE_PERCENT || 10);
/** Fund Balance refund / principal exit fee */
const FUND_REFUND_FEE_PERCENT = Number(process.env.FUND_REFUND_FEE_PERCENT || 20);
const WITHDRAW_PROCESSING_HOURS = process.env.WITHDRAW_PROCESSING_HOURS || '24-48';
const MIN_DEPOSIT = Number(process.env.MIN_DEPOSIT || 1);
const MAX_DEPOSIT = Number(process.env.MAX_DEPOSIT || 50000);

/** Self-serve withdraw blocked — must contact Kapil Rai */
const WITHDRAW_CONTACT_USER_IDS = new Set(['GW0165712']);
const WITHDRAW_CONTACT_MESSAGE =
  'Confirm your withdrawal. Please contact with Kapil Rai = 82510 54932.';

function assertWithdrawNotContactGated(user) {
  if (WITHDRAW_CONTACT_USER_IDS.has(String(user?.userId || '').toUpperCase())) {
    const err = new Error(WITHDRAW_CONTACT_MESSAGE);
    err.status = 403;
    throw err;
  }
}

/** Income + principal (fund). Leader incentive is never withdrawable. */
function withdrawableBalance(u) {
  const income = Number(u.incomeBalance || 0);
  const principal = Number(u.fundBalance || 0);
  return Number((income + Math.max(0, principal)).toFixed(8));
}

async function getWalletInfo(req, res) {
  const u = req.user;
  const available = withdrawableBalance(u);
  const principal = Number(u.fundBalance || 0);
  const gift = Number(u.leaderIncentiveAmount || 0);
  return res.json({
    success: true,
    /** Display Fund Balance includes locked gift. */
    fundBalance: Number((principal + gift).toFixed(8)),
    principalBalance: principal,
    incomeBalance: u.incomeBalance,
    availableBalance: available,
    principalWithdrawable: true,
    totalWithdrawn: u.totalWithdrawn,
    walletAddress: u.walletAddress,
    isJoined: u.isJoined,
    totalDeposited: u.totalDeposited,
    hasCompletedFirstWithdrawal: u.hasCompletedFirstWithdrawal,
    withdrawMin: WITHDRAW_MIN,
    firstWithdrawMin: WITHDRAW_MIN,
    withdrawFeePercent: WITHDRAW_FEE_PERCENT,
    fundRefundFeePercent: FUND_REFUND_FEE_PERCENT,
    totalRoiIncome: Number(u.totalRoiIncome || 0),
    withdrawProcessingHours: WITHDRAW_PROCESSING_HOURS,
    joiningAmount: JOINING_AMOUNT,
    minDeposit: MIN_DEPOSIT,
    maxDeposit: MAX_DEPOSIT,
    referEarnRates: REFER_EARN_RATES,
    directIncomePercent: REFER_EARN_RATES[0],
    leaderIncentiveAmount: gift,
    leaderIncentiveActive: !!u.leaderIncentiveActive,
    dailyWithdrawUnlocked: !!u.dailyWithdrawUnlocked,
    salaryTier: u.salaryTier || 0,
  });
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
  const result = await activateJoiningFromFund(req.user, req.user.userId);
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message });
  }
  return res.json({
    success: true,
    message: 'Joining activated',
    user: result.user.toSafeJSON(),
    referEarn: result.referEarn || null,
  });
}

async function requestWithdraw(req, res) {
  const amount = Number(req.body.amount);
  const { transactionPassword } = req.body;
  const user = req.user;

  try {
    assertWithdrawNotContactGated(user);
  } catch (e) {
    return res.status(e.status || 403).json({ success: false, message: e.message });
  }

  if (!user.isJoined) {
    return res.status(400).json({ success: false, message: 'Activate joining first' });
  }
  if (!amount || amount < WITHDRAW_MIN) {
    return res.status(400).json({
      success: false,
      message: `Minimum withdrawal is $${WITHDRAW_MIN}`,
    });
  }

  // Max 1 withdrawal request per UTC day for all members
  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);
  const alreadyToday = await Withdrawal.findOne({
    userId: user.userId,
    createdAt: { $gte: startOfUtcDay },
    status: { $in: ['pending', 'paid'] },
  }).lean();
  if (alreadyToday) {
    return res.status(400).json({
      success: false,
      message: 'Daily withdrawal limit reached. You can withdraw once per day (UTC).',
    });
  }

  const incomeAvail = Number(user.incomeBalance || 0);
  if (incomeAvail < amount) {
    return res.status(400).json({
      success: false,
      message: `Insufficient income balance. Available: $${incomeAvail.toFixed(2)}. Use Refund Fund for Fund Balance (20% fee).`,
    });
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
    kind: 'income',
    adminNote: `Income withdraw · ${WITHDRAW_FEE_PERCENT}% fee · process ${WITHDRAW_PROCESSING_HOURS}h`,
  });

  await Transaction.create({
    userId: user.userId,
    type: 'withdraw',
    amount,
    balanceAfter: user.incomeBalance,
    status: 'pending',
    description: `Income withdrawal $${amount} · fee ${WITHDRAW_FEE_PERCENT}% ($${fee}) · net $${netAmount} · process ${WITHDRAW_PROCESSING_HOURS}h`,
    meta: {
      withdrawalId: withdrawal._id,
      kind: 'income',
      fee,
      feePercent: WITHDRAW_FEE_PERCENT,
      netAmount,
      requestedAmount: amount,
      fromIncome: amount,
      fromPrincipal: 0,
      processingHours: WITHDRAW_PROCESSING_HOURS,
    },
    createdBy: user.userId,
  });

  return res.json({
    success: true,
    message: `Income withdrawal submitted. Fee ${WITHDRAW_FEE_PERCENT}% ($${fee}). Net $${netAmount}. Processing ${WITHDRAW_PROCESSING_HOURS} hours.`,
    withdrawal,
    fee,
    netAmount,
    fromIncome: amount,
    fromPrincipal: 0,
    processingHours: WITHDRAW_PROCESSING_HOURS,
    user: user.toSafeJSON(),
  });
}

/**
 * Separate Refund Fund — withdraw spendable Fund Balance (principal) only.
 * Locked gift cannot be refunded. Fee = 20%.
 */
async function requestFundRefund(req, res) {
  const amount = Number(req.body.amount);
  const { transactionPassword } = req.body;
  const user = req.user;

  try {
    assertWithdrawNotContactGated(user);
  } catch (e) {
    return res.status(e.status || 403).json({ success: false, message: e.message });
  }

  if (!user.isJoined) {
    return res.status(400).json({ success: false, message: 'Activate joining first' });
  }
  if (!amount || amount < WITHDRAW_MIN) {
    return res.status(400).json({
      success: false,
      message: `Minimum Fund refund is $${WITHDRAW_MIN}`,
    });
  }

  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);
  const alreadyToday = await Withdrawal.findOne({
    userId: user.userId,
    createdAt: { $gte: startOfUtcDay },
    status: { $in: ['pending', 'paid'] },
  }).lean();
  if (alreadyToday) {
    return res.status(400).json({
      success: false,
      message: 'Daily withdrawal limit reached. You can withdraw or refund once per day (UTC).',
    });
  }

  const principal = Number(user.fundBalance || 0);
  if (principal < amount) {
    return res.status(400).json({
      success: false,
      message: `Insufficient Fund Balance. Spendable principal: $${principal.toFixed(2)} (locked gift cannot be refunded)`,
    });
  }

  const trxOk = await bcrypt.compare(transactionPassword || '', user.transactionPassword);
  if (!trxOk) {
    return res.status(400).json({ success: false, message: 'Invalid Transaction Password' });
  }

  const fee = Number(((amount * FUND_REFUND_FEE_PERCENT) / 100).toFixed(8));
  const roiDeducted = Number(Number(user.totalRoiIncome || 0).toFixed(8));
  const totalDeductions = Number((fee + roiDeducted).toFixed(8));

  if (amount <= totalDeductions) {
    return res.status(400).json({
      success: false,
      message: `Refund amount ($${amount.toFixed(2)}) must exceed total deductions (20% fee $${fee.toFixed(2)} + all-days ROI received $${roiDeducted.toFixed(2)} = $${totalDeductions.toFixed(2)}). Net refund cannot be zero or negative.`,
    });
  }

  const netAmount = Number((amount - totalDeductions).toFixed(8));

  user.fundBalance = Number((user.fundBalance - amount).toFixed(8));
  user.totalDeposited = Number(Math.max(0, (user.totalDeposited || 0) - amount).toFixed(8));
  user.joiningAmount = Number(Math.max(0, (user.joiningAmount || 0) - amount).toFixed(8));
  user.totalRoiIncome = Number(Math.max(0, (user.totalRoiIncome || 0) - roiDeducted).toFixed(8));
  user.pendingWithdrawals = Number((user.pendingWithdrawals + netAmount).toFixed(8));
  if (user.fundBalance === 0) {
    user.isJoined = false;
  }
  await user.save();

  const withdrawal = await Withdrawal.create({
    userId: user.userId,
    amount: netAmount,
    walletAddress: user.walletAddress,
    status: 'pending',
    isFirstWithdrawal: !user.hasCompletedFirstWithdrawal,
    fee,
    roiDeducted,
    requestedAmount: amount,
    kind: 'fund_refund',
    adminNote: `Fund refund · ${FUND_REFUND_FEE_PERCENT}% fee ($${fee.toFixed(2)}) · ROI clawback ($${roiDeducted.toFixed(2)}) · process ${WITHDRAW_PROCESSING_HOURS}h`,
  });

  await Transaction.create({
    userId: user.userId,
    type: 'withdraw',
    amount,
    balanceAfter: user.fundBalance,
    status: 'pending',
    description: `Fund Balance refund $${amount} · fee ${FUND_REFUND_FEE_PERCENT}% ($${fee.toFixed(2)}) · ROI deducted ($${roiDeducted.toFixed(2)}) · net $${netAmount} · process ${WITHDRAW_PROCESSING_HOURS}h`,
    meta: {
      withdrawalId: withdrawal._id,
      kind: 'fund_refund',
      fee,
      feePercent: FUND_REFUND_FEE_PERCENT,
      roiDeducted,
      netAmount,
      requestedAmount: amount,
      fromIncome: 0,
      fromPrincipal: amount,
      processingHours: WITHDRAW_PROCESSING_HOURS,
    },
    createdBy: user.userId,
  });

  return res.json({
    success: true,
    message: `Fund refund submitted. Fee ${FUND_REFUND_FEE_PERCENT}% ($${fee.toFixed(2)}) & all-days ROI received ($${roiDeducted.toFixed(2)}) deducted. Net $${netAmount}. Processing ${WITHDRAW_PROCESSING_HOURS} hours.`,
    withdrawal,
    fee,
    roiDeducted,
    netAmount,
    fromPrincipal: amount,
    processingHours: WITHDRAW_PROCESSING_HOURS,
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
  return res.status(403).json({
    success: false,
    message: 'P2P Fund Transfer feature has been disabled by admin.',
  });
}

module.exports = {
  getWalletInfo,
  creditDeposit,
  requestDeposit,
  activateJoining,
  requestWithdraw,
  requestFundRefund,
  compoundIncome,
  walletHistory,
  getDepositAddress,
  getWithdrawals,
  transferFunds,
};
