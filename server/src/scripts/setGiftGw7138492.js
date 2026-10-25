require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { connectDB } = require('../config/db');
const User = require('../models/User');
const { setMemberGiftAmount } = require('../services/leaderIncentiveService');

(async () => {
  await connectDB();
  const id = 'GW7138492';
  const before = await User.findOne({ userId: id }).select(
    'userId name leaderIncentiveAmount leaderIncentiveCompanyPart leaderIncentiveLeaderPart fundBalance'
  );
  if (!before) {
    console.error('User not found:', id);
    process.exit(1);
  }
  console.log('Before:', {
    userId: before.userId,
    name: before.name,
    gift: before.leaderIncentiveAmount,
    company: before.leaderIncentiveCompanyPart,
    leader: before.leaderIncentiveLeaderPart,
  });

  const result = await setMemberGiftAmount(id, 100, {
    createdBy: 'GW0000001',
    source: 'admin_upgrade_10_to_100',
  });
  console.log('Result:', {
    ok: result.ok,
    already: result.already,
    message: result.message,
  });

  const after = await User.findOne({ userId: id }).select(
    'userId name leaderIncentiveAmount leaderIncentiveCompanyPart leaderIncentiveLeaderPart'
  );
  console.log('After:', {
    userId: after.userId,
    name: after.name,
    gift: after.leaderIncentiveAmount,
    company: after.leaderIncentiveCompanyPart,
    leader: after.leaderIncentiveLeaderPart,
  });
  process.exit(result.ok || result.already ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
