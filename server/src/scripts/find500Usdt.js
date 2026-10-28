require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const users = await db
    .collection('users')
    .find({ role: { $ne: 'admin' } })
    .project({
      userId: 1,
      name: 1,
      fundBalance: 1,
      incomeBalance: 1,
      totalDeposited: 1,
      leaderIncentiveAmount: 1,
      isJoined: 1,
      sponsorId: 1,
    })
    .toArray();

  const rows = users.map((u) => {
    const fund = Number(u.fundBalance || 0);
    const gift = Number(u.leaderIncentiveAmount || 0);
    const income = Number(u.incomeBalance || 0);
    const dep = Number(u.totalDeposited || 0);
    return {
      userId: u.userId,
      name: u.name,
      fund,
      gift,
      fundDisplay: Number((fund + gift).toFixed(8)),
      income,
      totalDeposited: dep,
      isJoined: !!u.isJoined,
      sponsorId: u.sponsorId,
    };
  });

  const near500 = rows.filter(
    (r) =>
      (r.fund >= 490 && r.fund <= 510) ||
      (r.fundDisplay >= 490 && r.fundDisplay <= 510) ||
      (r.totalDeposited >= 490 && r.totalDeposited <= 510) ||
      (r.fund + r.income >= 490 && r.fund + r.income <= 510)
  );

  console.log('=== Members near 500 USDT ===');
  if (!near500.length) console.log('(none)');
  near500
    .sort((a, b) => b.fundDisplay - a.fundDisplay)
    .forEach((r) => {
      console.log(
        `${r.userId} | ${r.name} | fund $${r.fund} | gift $${r.gift} | Fund Balance(display) $${r.fundDisplay} | deposited $${r.totalDeposited} | income $${r.income} | sponsor ${r.sponsorId}`
      );
    });

  console.log('\n=== Exact / close hits on fund principal ===');
  rows
    .filter((r) => Math.abs(r.fund - 500) < 2 || Math.abs(r.fund - 500.5) < 0.01)
    .forEach((r) => console.log(r.userId, r.name, 'fund', r.fund, 'display', r.fundDisplay, 'deposited', r.totalDeposited));

  console.log('\n=== Top fund balances ===');
  rows
    .slice()
    .sort((a, b) => b.fund - a.fund)
    .slice(0, 15)
    .forEach((r) =>
      console.log(`${r.userId} | ${r.name} | fund $${r.fund} | display $${r.fundDisplay} | deposited $${r.totalDeposited}`)
    );

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
