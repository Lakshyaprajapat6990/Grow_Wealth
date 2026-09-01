const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const User = require('./models/User');

const DEMO = {
  userId: 'GW9999999',
  password: 'Client@123',
  transactionPassword: '123456',
  name: 'Demo Client',
  email: 'demo.client@growwealth.local',
  mobile: '8888888888',
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  sponsorId: 'GW0000001',
  fundBalance: 50,
  totalDeposited: 50,
  isJoined: true,
  joiningAmount: 1,
};

async function seed() {
  await connectDB();

  let client = await User.findOne({ userId: DEMO.userId });
  if (client) {
    console.log('Demo client already exists:', DEMO.userId);
  } else {
    const password = await bcrypt.hash(DEMO.password, 10);
    const trx = await bcrypt.hash(DEMO.transactionPassword, 10);

    client = await User.create({
      userId: DEMO.userId,
      name: DEMO.name,
      email: DEMO.email,
      mobile: DEMO.mobile,
      password,
      transactionPassword: trx,
      country: 'INDIA',
      role: 'user',
      sponsorId: DEMO.sponsorId,
      walletAddress: DEMO.walletAddress,
      fundBalance: DEMO.fundBalance,
      totalDeposited: DEMO.totalDeposited,
      isJoined: DEMO.isJoined,
      joiningAmount: DEMO.joiningAmount,
      joinedAt: new Date(),
    });

    const admin = await User.findOne({ userId: DEMO.sponsorId });
    if (admin) {
      admin.directCount += 1;
      admin.teamCount += 1;
      await admin.save();
    }

    console.log('Demo client created');
  }

  console.log('');
  console.log('=== Demo Client Login ===');
  console.log('User ID:              ', DEMO.userId);
  console.log('Password:             ', DEMO.password);
  console.log('Transaction Password: ', DEMO.transactionPassword);
  console.log('Fund Balance:         ', `$${DEMO.fundBalance}`);
  console.log('Status:               ', DEMO.isJoined ? 'Joined' : 'Not Joined');
  console.log('Login at:             ', process.env.CLIENT_URL || 'http://localhost:5173', '/login');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
