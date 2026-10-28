require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).project({ userId: 1 }).toArray();
  const allIds = new Set(users.map((u) => String(u.userId).toUpperCase()));
  console.log('Active users:', allIds.size);

  const pend = await db.collection('pendingregistrations').find({}).sort({ createdAt: -1 }).toArray();

  const deletedCompleted = [];
  const reservedNeverPaid = [];

  for (const p of pend) {
    const id = String(p.userId || '').toUpperCase();
    if (!id) continue;
    const exists = allIds.has(id);
    if (p.status === 'completed' && !exists) {
      deletedCompleted.push(p);
    } else if (!exists) {
      reservedNeverPaid.push(p);
    }
  }

  console.log('\n=== DELETED members (pending status=completed, user missing) ===');
  console.log('Count:', deletedCompleted.length);
  deletedCompleted.forEach((p) => {
    console.log(
      [
        p.userId,
        p.name,
        p.email,
        p.mobile,
        `sponsor ${p.sponsorId}`,
        `paid ${p.paymentTxHash || '-'}`,
        `created ${p.createdAt?.toISOString?.() || p.createdAt}`,
        `updated ${p.updatedAt?.toISOString?.() || p.updatedAt}`,
      ].join(' | ')
    );
  });

  // Also: any fromUserId orphans
  const fromIds = await db.collection('transactions').distinct('meta.fromUserId');
  const orphanFrom = (fromIds || []).filter((id) => id && !allIds.has(String(id).toUpperCase()));
  console.log('\nOrphan referral fromUserIds:', orphanFrom);

  console.log('\n=== Reserved IDs never completed (not deleted — unpaid/expired) ===');
  console.log('Count:', reservedNeverPaid.length);
  reservedNeverPaid
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .forEach((p) => {
      console.log(
        `${p.userId} | ${p.status} | ${p.name} | ${p.createdAt?.toISOString?.() || p.createdAt} | sponsor ${p.sponsorId}`
      );
    });

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
