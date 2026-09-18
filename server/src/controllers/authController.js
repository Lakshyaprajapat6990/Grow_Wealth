const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const PendingRegistration = require('../models/PendingRegistration');
const {
  signToken,
  generateUniqueUserId,
  generateTrxPassword,
  isValidBep20Address,
} = require('../utils/helpers');
const { getUsdtTransferFromTx, findRecentUsdtTransfer, USDT_BEP20 } = require('../utils/bscUsdt');
const { autoJoinOnPayment } = require('../services/joiningService');
const { evaluateRanksUpChain } = require('../services/rankRewardService');

const JOINING_AMOUNT = Number(process.env.JOINING_AMOUNT || 1);
const REGISTRATION_PAYMENT = Number(process.env.REGISTRATION_PAYMENT || 10);
const DEPOSIT_ADDRESS = (
  process.env.DEPOSIT_ADDRESS || '0xA73EEAd1C853deF37F3B3bE1701e240d74770D8e'
).toLowerCase();

async function registerInfo(_req, res) {
  return res.json({
    success: true,
    joiningAmount: JOINING_AMOUNT,
    registrationPayment: REGISTRATION_PAYMENT,
    depositAddress: DEPOSIT_ADDRESS,
    usdtContract: USDT_BEP20,
    network: 'BEP-20 (BSC)',
    chainId: '0x38',
    token: 'USDT',
    autoTrack: true,
  });
}

async function checkSponsor(req, res) {
  const { sponsorId } = req.params;
  if (!sponsorId) {
    return res.status(400).json({ success: false, message: 'Sponsor ID required', valid: false });
  }

  if (sponsorId.toUpperCase() === 'ADMIN' || sponsorId.toUpperCase() === 'GW0000001') {
    return res.json({ success: true, valid: true, name: 'Company' });
  }

  const sponsor = await User.findOne({ userId: sponsorId.toUpperCase(), isBlocked: false });
  if (!sponsor) {
    return res.json({ success: false, valid: false, message: 'Invalid Sponsor ID' });
  }

  return res.json({ success: true, valid: true, name: sponsor.name, userId: sponsor.userId });
}

/** Step 1 entry (also used by legacy /register). */
async function register(req, res) {
  return registerStart(req, res);
}

/**
 * Step 1: save details as pending. Credentials shown only after $10 payment.
 */
async function registerStart(req, res) {
  const { name, email, mobile, password, country, walletAddress, sponsorId, agreeTerms } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields' });
  }
  if (!agreeTerms) {
    return res.status(400).json({ success: false, message: 'Please agree to the terms of service.' });
  }
  if (!walletAddress || !isValidBep20Address(walletAddress)) {
    return res.status(400).json({ success: false, message: 'Valid USDT BEP-20 Wallet Address is required.' });
  }

  let resolvedSponsor = null;
  const sid = (sponsorId || '').trim().toUpperCase();
  if (sid && sid !== 'ADMIN' && sid !== 'GW0000001') {
    resolvedSponsor = await User.findOne({ userId: sid, isBlocked: false });
    if (!resolvedSponsor) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Sponsor ID.' });
    }
  }

  const emailLower = email.toLowerCase().trim();
  const emailExists = await User.findOne({ email: emailLower });
  if (emailExists) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const pendingEmail = await PendingRegistration.findOne({
    email: emailLower,
    status: 'pending_payment',
    expiresAt: { $gt: new Date() },
  });
  if (pendingEmail) {
    return res.json({
      success: true,
      step: 2,
      message: 'Continue payment for your pending registration',
      pendingId: pendingEmail.pendingId,
      amountDue: pendingEmail.amountDue,
      depositAddress: DEPOSIT_ADDRESS,
      usdtContract: USDT_BEP20,
      network: 'BEP-20 (BSC)',
      chainId: '0x38',
      walletAddress: pendingEmail.walletAddress,
    });
  }

  const userId = await generateUniqueUserId();
  const trxPassword = generateTrxPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  const pendingId = crypto.randomBytes(16).toString('hex');

  await PendingRegistration.create({
    pendingId,
    name: name.trim(),
    email: emailLower,
    mobile: String(mobile).trim(),
    passwordHash,
    trxPasswordPlain: trxPassword,
    country: country || 'INDIA',
    walletAddress: walletAddress.trim().toLowerCase(),
    sponsorId: resolvedSponsor ? resolvedSponsor.userId : 'GW0000001',
    userId,
    amountDue: REGISTRATION_PAYMENT,
    status: 'pending_payment',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  return res.status(201).json({
    success: true,
    step: 2,
    message: `Details saved. Pay $${REGISTRATION_PAYMENT} USDT (BEP-20) to finish registration.`,
    pendingId,
    amountDue: REGISTRATION_PAYMENT,
    depositAddress: DEPOSIT_ADDRESS,
    usdtContract: USDT_BEP20,
    network: 'BEP-20 (BSC)',
    chainId: '0x38',
    walletAddress: walletAddress.trim().toLowerCase(),
  });
}

async function getPendingStatus(req, res) {
  const pendingId = String(req.params.pendingId || '').trim();
  const pending = await PendingRegistration.findOne({ pendingId });
  if (!pending) {
    return res.status(404).json({ success: false, message: 'Pending registration not found' });
  }
  if (pending.status === 'completed') {
    return res.json({ success: true, status: 'completed', userId: pending.userId });
  }
  if (pending.expiresAt < new Date()) {
    pending.status = 'expired';
    await pending.save();
    return res.status(410).json({ success: false, message: 'Registration expired. Please start again.' });
  }
  return res.json({
    success: true,
    status: pending.status,
    pendingId: pending.pendingId,
    amountDue: pending.amountDue,
    depositAddress: DEPOSIT_ADDRESS,
    usdtContract: USDT_BEP20,
    walletAddress: pending.walletAddress,
    chainId: '0x38',
  });
}

/**
 * Step 2: confirm payment.
 * txHash optional — if provided (from wallet send), verify that tx.
 * If omitted, auto-scan chain for transfer from registered wallet → company.
 */
async function registerConfirmPayment(req, res) {
  const pendingId = String(req.body.pendingId || '').trim();
  const txHashInput = String(req.body.txHash || '').trim();

  const pending = await PendingRegistration.findOne({ pendingId, status: 'pending_payment' });
  if (!pending) {
    return res.status(404).json({
      success: false,
      message: 'Pending registration not found or already completed',
    });
  }
  if (pending.expiresAt < new Date()) {
    pending.status = 'expired';
    await pending.save();
    return res.status(410).json({ success: false, message: 'Registration expired. Please start again.' });
  }

  let transfer = null;
  if (txHashInput) {
    transfer = await getUsdtTransferFromTx(txHashInput, DEPOSIT_ADDRESS);
    if (!transfer) {
      return res.status(400).json({
        success: false,
        waiting: true,
        message: 'Payment not found on BSC yet. Wait a few seconds and try again.',
      });
    }
    if (transfer.from.toLowerCase() !== pending.walletAddress.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Payment must come from your registered BEP-20 wallet address.',
      });
    }
  } else {
    transfer = await findRecentUsdtTransfer({
      from: pending.walletAddress,
      to: DEPOSIT_ADDRESS,
      minAmount: pending.amountDue,
      lookbackBlocks: 12000,
    });
    if (!transfer) {
      return res.status(400).json({
        success: false,
        waiting: true,
        message: `No $${pending.amountDue} USDT found yet from your wallet. Pay, wait ~15s, then Check Payment.`,
      });
    }
  }

  if (transfer.amount + 0.0001 < pending.amountDue) {
    return res.status(400).json({
      success: false,
      message: `Payment too low. Need $${pending.amountDue} USDT, found $${transfer.amount}.`,
    });
  }

  const usedTx = await Transaction.findOne({
    'meta.txHash': transfer.txHash,
    status: { $in: ['pending', 'success'] },
  });
  if (usedTx) {
    return res.status(400).json({ success: false, message: 'This payment was already used.' });
  }
  const usedPending = await PendingRegistration.findOne({
    paymentTxHash: transfer.txHash,
    status: 'completed',
  });
  if (usedPending) {
    return res.status(400).json({ success: false, message: 'This payment was already used.' });
  }

  const emailExists = await User.findOne({ email: pending.email });
  if (emailExists) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const trxPlain = pending.trxPasswordPlain;
  let user = await User.findOne({ userId: pending.userId });
  if (!user) {
    user = await User.create({
      userId: pending.userId,
      name: pending.name,
      email: pending.email,
      mobile: pending.mobile,
      password: pending.passwordHash,
      transactionPassword: await bcrypt.hash(trxPlain, 10),
      country: pending.country,
      sponsorId: pending.sponsorId,
      walletAddress: pending.walletAddress,
      isJoined: false,
      registrationPaid: true,
    });

    if (pending.sponsorId && pending.sponsorId !== 'GW0000001' && pending.sponsorId !== 'ADMIN') {
      const sponsor = await User.findOne({ userId: pending.sponsorId });
      if (sponsor) {
        sponsor.directCount = (sponsor.directCount || 0) + 1;
        sponsor.teamCount = (sponsor.teamCount || 0) + 1;
        await sponsor.save();
      }
    }
  }

  user.fundBalance = Number((user.fundBalance + transfer.amount).toFixed(8));
  user.usdtBep20Balance = Number(((user.usdtBep20Balance || 0) + transfer.amount).toFixed(8));
  user.totalDeposited = Number(((user.totalDeposited || 0) + transfer.amount).toFixed(8));
  user.registrationPaid = true;
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'deposit',
    amount: transfer.amount,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: `Registration payment $${transfer.amount} USDT auto-verified`,
    meta: {
      txHash: transfer.txHash,
      method: txHashInput ? 'wallet_auto' : 'chain_scan',
      network: 'BEP-20',
      purpose: 'registration',
      from: transfer.from,
      to: transfer.to,
      autoTracked: true,
    },
    createdBy: 'system',
  });

  const joinResult = await autoJoinOnPayment(user, {
    paymentAmount: transfer.amount,
    createdBy: 'system',
    source: 'registration_payment',
  });
  await evaluateRanksUpChain(user.userId);

  pending.status = 'completed';
  pending.paymentTxHash = transfer.txHash;
  pending.trxPasswordPlain = '';
  await pending.save();

  const fresh = joinResult.user || (await User.findOne({ userId: user.userId }));
  const token = signToken(fresh);

  return res.json({
    success: true,
    message: 'Payment verified. Registration complete.',
    token,
    userId: fresh.userId,
    transactionPassword: trxPlain,
    paidAmount: transfer.amount,
    txHash: transfer.txHash,
    user: fresh.toSafeJSON(),
    autoJoined: !!joinResult.joined,
  });
}

async function login(req, res) {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ success: false, message: 'User ID and password required' });
  }

  const user = await User.findOne({ userId: String(userId).trim().toUpperCase() });
  if (!user) {
    // Maybe still pending payment
    const pending = await PendingRegistration.findOne({
      userId: String(userId).trim().toUpperCase(),
      status: 'pending_payment',
      expiresAt: { $gt: new Date() },
    });
    if (pending) {
      return res.status(403).json({
        success: false,
        message: `Pay $${pending.amountDue} USDT to finish registration, then login.`,
        pendingId: pending.pendingId,
        needsPayment: true,
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid User ID or password' });
  }
  if (user.isBlocked) {
    return res.status(403).json({ success: false, message: 'Account blocked by admin' });
  }
  if (user.registrationPaid === false) {
    return res.status(403).json({
      success: false,
      message: 'Complete USDT registration payment before login.',
      needsPayment: true,
    });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ success: false, message: 'Invalid User ID or password' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: user.toSafeJSON(),
  });
}

async function me(req, res) {
  return res.json({ success: true, user: req.user.toSafeJSON() });
}

module.exports = {
  checkSponsor,
  register,
  registerStart,
  registerConfirmPayment,
  getPendingStatus,
  login,
  me,
  registerInfo,
};
