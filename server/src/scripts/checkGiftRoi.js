require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { roiBase } = require('../services/roiService');
const { getTeamVolume } = require('../services/rankRewardService');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User');
  const users = await User.find({ role: { $ne: 'admin' }, isJoined: true });

  console.log('How ROI base works:');
  console.log('- Base = max(totalDeposited, joiningAmount)');
  console.log('- +100 gift ONLY if leaderIncentiveActive === true (unlocked at $500 team business)');
  console.log('- If gift still locked (active=false), ROI does NOT include the 100\n');

  let unlocked = 0;
  let locked = 0;
  for (const u of users) {
    const gift = Number(u.leaderIncentiveAmount || 0);
    const active = !!u.leaderIncentiveActive;
    const base = roiBase(u);
    const stake = Math.max(Number(u.totalDeposited || 0), Number(u.joiningAmount || 0), 0);
    const includesGift = active && gift > 0;
    if (includesGift) unlocked += 1;
    else if (gift > 0) locked += 1;

    if (includesGift || gift > 0) {
      const { volume } = await getTeamVolume(u.userId);
      if (includesGift || volume >= 400) {
        console.log(
          `${u.userId} | gift $${gift} | unlocked=${active} | stake $${stake} | ROI base $${base} | teamBiz $${volume} | gift in ROI? ${includesGift ? 'YES' : 'NO'}`
        );
      }
    }
  }

  console.log(`\nJoined members with gift locked (ROI excludes 100): ${locked}`);
  console.log(`Joined members with gift unlocked (ROI includes 100): ${unlocked}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
