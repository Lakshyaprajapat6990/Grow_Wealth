require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateUniqueUserId, generateTrxPassword, isValidBep20Address } = require('../utils/helpers');
const { autoJoinOnPayment } = require('../services/joiningService');
const { evaluateRanksUpChain } = require('../services/rankRewardService');
const { evaluateSalaryUpChain } = require('../services/salaryIncomeService');

const SPONSOR_ID = 'GW9577099';
const DEPOSIT = 100;

/** Prefer real member from registration screenshot if email is free. */
const PREFERRED = {
  name: 'Sanjay Tandan',
  email: 'sanjaytandanw@gmail.com',
  mobile: '6261716187',
  passwordPlain: 'Sanjay6261',
};

function randomWallet() {
  return `0x${crypto.randomBytes(20).toString('hex')}`;
}

(async () => {
  await connectDB();

  const sponsor = await User.findOne({ userId: SPONSOR_ID });
  if (!sponsor) throw new Error(`Sponsor ${SPONSOR_ID} not found`);

  let name = PREFERRED.name;
  let email = PREFERRED.email.toLowerCase();
  let mobile = PREFERRED.mobile;
  let passwordPlain = PREFERRED.passwordPlain;

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    const stamp = Date.now().toString().slice(-6);
    name = `DI Member ${stamp}`;
    email = `di.${SPONSOR_ID.toLowerCase()}.${stamp}@growwealth.local`;
    mobile = `91${stamp}${String(Math.floor(Math.random() * 9000) + 1000).slice(0, 4)}`.slice(0, 12);
    passwordPlain = `Di${stamp}!`;
    console.log(`Preferred email already used by ${emailExists.userId} — creating placeholder DI instead.`);
  }

  let walletAddress = randomWallet();
  while (!isValidBep20Address(walletAddress) || (await User.findOne({ walletAddress }))) {
    walletAddress = randomWallet();
  }

  const userId = await generateUniqueUserId();
  const trxPlain = generateTrxPassword();
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  const trxHash = await bcrypt.hash(trxPlain, 10);

  const beforeDirect = Number(sponsor.totalDirectIncome || 0);
  const beforeIncome = Number(sponsor.incomeBalance || 0);

  let user = await User.create({
    userId,
    name,
    email,
    mobile,
    password: passwordHash,
    transactionPassword: trxHash,
    country: 'INDIA',
    role: 'user',
    sponsorId: SPONSOR_ID,
    walletAddress,
    isJoined: false,
    registrationPaid: true,
    fundBalance: 0,
    totalDeposited: 0,
  });

  sponsor.directCount = (sponsor.directCount || 0) + 1;
  sponsor.teamCount = (sponsor.teamCount || 0) + 1;
  await sponsor.save();

  user.fundBalance = Number(DEPOSIT.toFixed(8));
  user.usdtBep20Balance = Number(DEPOSIT.toFixed(8));
  user.totalDeposited = Number(DEPOSIT.toFixed(8));
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'deposit',
    amount: DEPOSIT,
    balanceAfter: user.fundBalance,
    status: 'success',
    description: `Admin assisted deposit $${DEPOSIT} USDT (DI under ${SPONSOR_ID})`,
    meta: {
      method: 'admin_manual_create',
      network: 'BEP-20',
      purpose: 'package',
      note: `Direct under ${SPONSOR_ID} with $${DEPOSIT}`,
    },
    createdBy: 'GW0000001',
  });

  const joinResult = await autoJoinOnPayment(user, {
    paymentAmount: DEPOSIT,
    createdBy: 'GW0000001',
    source: 'admin_assisted_di',
  });

  await evaluateRanksUpChain(user.userId);
  await evaluateSalaryUpChain(user.userId);

  const fresh = await User.findOne({ userId });
  const sponsorFresh = await User.findOne({ userId: SPONSOR_ID });
  const l1 = (joinResult.referChain?.levels || []).find((l) => l.level === 1);

  console.log('');
  console.log('=== DI created under', SPONSOR_ID, '===');
  console.log('New User ID:           ', fresh.userId);
  console.log('Name:                  ', fresh.name);
  console.log('Login Password:        ', passwordPlain);
  console.log('Transaction Password:  ', trxPlain);
  console.log('Sponsor:               ', fresh.sponsorId, `(${sponsorFresh.name})`);
  console.log('Email:                 ', fresh.email);
  console.log('Mobile:                ', fresh.mobile);
  console.log('Wallet:                ', fresh.walletAddress);
  console.log('Deposit / Joined:      ', `$${fresh.totalDeposited} · Joined=${fresh.isJoined}`);
  console.log('');
  console.log('=== Referral credit to', SPONSOR_ID, '===');
  console.log('L1 Direct Income:      ', l1 ? `$${l1.amount} (${l1.percent}% of $${DEPOSIT})` : 'NONE');
  console.log('Sponsor DI before→after:', `$${beforeDirect} → $${sponsorFresh.totalDirectIncome}`);
  console.log('Sponsor incomeBalance: ', `$${beforeIncome} → $${sponsorFresh.incomeBalance}`);
  console.log('Refer chain:           ', JSON.stringify(joinResult.referChain || null));
  console.log('');

  process.exit(0);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
