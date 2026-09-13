const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  signToken,
  generateUniqueUserId,
  generateTrxPassword,
  isValidBep20Address,
} = require('../utils/helpers');

const JOINING_AMOUNT = Number(process.env.JOINING_AMOUNT || 1);

async function registerInfo(_req, res) {
  return res.json({
    success: true,
    joiningAmount: JOINING_AMOUNT,
    depositAddress: process.env.DEPOSIT_ADDRESS || '0xA73EEAd1C853deF37F3B3bE1701e240d74770D8e',
    network: 'BEP-20 (BSC)',
    token: 'USDT',
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
    return res.json({ success: false, valid: false, message: '❌ Invalid Sponsor ID' });
  }

  return res.json({ success: true, valid: true, name: sponsor.name, userId: sponsor.userId });
}

async function register(req, res) {
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

  const emailExists = await User.findOne({ email: email.toLowerCase() });
  if (emailExists) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const userId = await generateUniqueUserId();
  const trxPassword = generateTrxPassword();
  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedTrx = await bcrypt.hash(trxPassword, 10);

  const user = await User.create({
    userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    mobile: String(mobile).trim(),
    password: hashedPassword,
    transactionPassword: hashedTrx,
    country: country || 'INDIA',
    sponsorId: resolvedSponsor ? resolvedSponsor.userId : 'GW0000001',
    walletAddress: walletAddress.trim(),
    isJoined: false,
  });

  if (resolvedSponsor) {
    resolvedSponsor.directCount += 1;
    resolvedSponsor.teamCount += 1;
    await resolvedSponsor.save();
  }

  const token = signToken(user);
  return res.status(201).json({
    success: true,
    message: 'Registration successful. Login and activate $1 joining from dashboard.',
    token,
    userId: user.userId,
    transactionPassword: trxPassword,
    joiningAmount: JOINING_AMOUNT,
    user: user.toSafeJSON(),
  });
}

async function login(req, res) {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ success: false, message: 'User ID and password required' });
  }

  const user = await User.findOne({ userId: String(userId).trim().toUpperCase() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid User ID or password' });
  }
  if (user.isBlocked) {
    return res.status(403).json({ success: false, message: 'Account blocked by admin' });
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

module.exports = { checkSponsor, register, login, me, registerInfo };
