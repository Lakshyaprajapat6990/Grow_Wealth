require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateUniqueUserId, generateTrxPassword, isValidBep20Address } = require('../utils/helpers');
const { autoJoinOnPayment } = require('../services/joiningService');
const { evaluateRanksUpChain } = require('../services/rankRewardService');
const { ensureMemberGift } = require('../services/leaderIncentiveService');

const MEMBER = {
  name: 'Upendra Kumar Gupta',
  email: 'upendra547215@gmail.com',
  mobile: '9199547215',
  passwordPlain: 'upendra547',
  walletAddress: '0xE1E489c513A7929C81F818742Ba775457D2CC407'.toLowerCase(),
  sponsorId: 'GW9869420',
  deposit: 20,
  country: 'INDIA',
};

(async () => {
  await connectDB();

  if (!isValidBep20Address(MEMBER.walletAddress)) {
    throw new Error('Invalid wallet address');
  }

  const sponsor = await User.findOne({ userId: MEMBER.sponsorId });
  if (!sponsor) throw new Error(`Sponsor ${MEMBER.sponsorId} not found`);

  const emailExists = await User.findOne({ email: MEMBER.email.toLowerCase() });
  if (emailExists) throw new Error(`Email already registered as ${emailExists.userId}`);

  const walletExists = await User.findOne({ walletAddress: MEMBER.walletAddress });
  if (walletExists) throw new Error(`Wallet already used by ${walletExists.userId}`);

  const userId = await generateUniqueUserId();
  const trxPlain = generateTrxPassword();
  const passwordHash = await bcrypt.hash(MEMBER.passwordPlain, 10);
  const trxHash = await bcrypt.hash(trxPlain, 10);

  let user = await User.create({
    userId,
    name: MEMBER.name,
    email: MEMBER.email.toLowerCase(),
    mobile: MEMBER.mobile,
    password: passwordHash,
    transactionPassword: trxHash,
    country: MEMBER.country,
    role: 'user',
    sponsorId: MEMBER.sponsorId,
    walletAddress: MEMBER.walletAddress,
    isJoined: false,
    registrationPaid: true,
    fundBalance: 0,
    totalDeposited: 0,
  });

  sponsor.directCount = (sponsor.directCount || 0) + 1;
  sponsor.teamCount = (sponsor.teamCount || 0) + 1;
  await sponsor.save();

  user.fundBalance = Number(MEMBER.deposit.toFixed(8));
  user.usdtBep20Balance = Number(MEMBER.deposit.toFixed(8));
  user.totalDeposited = Number(MEMBER.deposit.toFixed(8));
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'deposit',
    amount: MEMBER.deposit,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: `Admin assisted deposit $${MEMBER.deposit} USDT (phone registration issue)`,
    meta: {
      method: 'admin_manual_create',
      network: 'BEP-20',
      purpose: 'package',
      note: 'Created by admin for real member unable to register on phone',
    },
    createdBy: 'GW0000001',
  });

  const joinResult = await autoJoinOnPayment(user, {
    paymentAmount: MEMBER.deposit,
    createdBy: 'GW0000001',
    source: 'admin_assisted_registration',
  });

  await evaluateRanksUpChain(user.userId);
  await ensureMemberGift(user.userId);

  const fresh = await User.findOne({ userId });

  console.log('');
  console.log('=== Member created successfully ===');
  console.log('User ID:               ', fresh.userId);
  console.log('Name:                  ', fresh.name);
  console.log('Login Password:        ', MEMBER.passwordPlain);
  console.log('Transaction Password:  ', trxPlain);
  console.log('Sponsor:               ', fresh.sponsorId, `(${sponsor.name})`);
  console.log('Email:                 ', fresh.email);
  console.log('Mobile:                ', fresh.mobile);
  console.log('Wallet:                ', fresh.walletAddress);
  console.log('Deposit / Joined:      ', `$${fresh.totalDeposited} · Joined=${fresh.isJoined}`);
  console.log('Fund (principal):      ', `$${fresh.fundBalance}`);
  console.log('Gift locked:           ', `$${fresh.leaderIncentiveAmount || 0}`);
  console.log('Refer chain:           ', JSON.stringify(joinResult.referChain || null));
  console.log('');

  process.exit(0);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
