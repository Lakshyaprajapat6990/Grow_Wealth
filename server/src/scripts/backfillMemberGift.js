require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { connectDB } = require('../config/db');
const { grantGiftToAllMembers } = require('../services/leaderIncentiveService');

async function run() {
  await connectDB();
  const out = await grantGiftToAllMembers({ createdBy: 'system_backfill' });
  console.log(`Processed ${out.count} members`);
  const granted = out.results.filter((r) => r.ok && !r.already).length;
  const failed = out.results.filter((r) => !r.ok && !r.already).length;
  console.log(`Newly granted: ${granted} · Failed: ${failed}`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
