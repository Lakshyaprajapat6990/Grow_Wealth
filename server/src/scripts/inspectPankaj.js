require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

async function dumpUser(userId) {
  const u = await User.findOne({ userId }).select('-password -transactionPassword');
  console.log('\n==== USER', userId, '====');
  if (!u) {
    console.log('NOT FOUND');
    return;
  }
  console.log({
    name: u.name,
    mobile: u.mobile,
    email: u.email,
    sponsorId: u.sponsorId,
    isJoined: u.isJoined,
    fundBalance: u.fundBalance,
    incomeBalance: u.incomeBalance,
    totalDeposited: u.totalDeposited,
    joiningAmount: u.joiningAmount,
    totalRoiIncome: u.totalRoiIncome,
    wallet: u.walletAddress,
  });
  const txs = await Transaction.find({ userId }).sort({ createdAt: 1 });
  console.log('TX COUNT', txs.length);
  for (const t of txs) {
    console.log(
      JSON.stringify({
        at: t.createdAt,
        type: t.type,
        amount: t.amount,
        status: t.status,
        balAfter: t.balanceAfter,
        desc: t.description,
        meta: t.meta,
        createdBy: t.createdBy,
      })
    );
  }
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await dumpUser('GW8907293');
  await dumpUser('GW8656884');
  const byEmail = await User.find({
    $or: [{ email: /pankajkr\.singh125/i }, { mobile: '9548171470' }, { name: /pankaj/i }],
  }).select('userId name mobile email fundBalance totalDeposited isJoined joiningAmount');
  console.log('\n==== SEARCH Pankaj ====');
  console.log(byEmail);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
