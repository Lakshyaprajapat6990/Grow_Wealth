require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { connectDB } = require('../config/db');
const { runDailyRoi } = require('../services/roiService');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const DAYS = process.argv.slice(2);
const targetDays = DAYS.length ? DAYS : ['2026-10-17', '2026-10-19'];

(async () => {
  await connectDB();

  for (const day of targetDays) {
    console.log('\n=== Backfill', day, '===');
    const before = await Transaction.countDocuments({
      type: 'roi',
      status: 'success',
      'meta.autoDaily': true,
      'meta.roiDay': day,
    });
    const result = await runDailyRoi({ createdBy: 'system_roi_backfill', day });
    const after = await Transaction.countDocuments({
      type: 'roi',
      status: 'success',
      'meta.autoDaily': true,
      'meta.roiDay': day,
    });
    const eligible = await User.countDocuments({
      role: { $ne: 'admin' },
      isJoined: true,
      isBlocked: false,
    });
    console.log(result.message);
    console.log(`Count ${before} → ${after} (eligible ${eligible})`);
    if (result.details?.length) {
      result.details.forEach((d) => console.log(' +', d.userId, '$' + d.amount, 'base', d.base));
    }
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
