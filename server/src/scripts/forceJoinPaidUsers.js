/**
 * One-off: mark paid members as Joined.
 * Usage: node server/src/scripts/forceJoinPaidUsers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { forceJoinUsers } = require('../services/joiningService');

const IDS = ['GW7417286', 'GW8656884'];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const results = await forceJoinUsers(IDS, 'system-migration');
  console.log(JSON.stringify(results, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
