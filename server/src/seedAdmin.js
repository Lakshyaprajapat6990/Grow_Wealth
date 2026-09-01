const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const User = require('./models/User');

async function seed() {
  await connectDB();

  const userId = 'GW0000001';
  let admin = await User.findOne({ userId });
  if (admin) {
    console.log('Admin already exists:', userId);
  } else {
    const password = await bcrypt.hash('Admin@123', 10);
    const trx = await bcrypt.hash('123456', 10);
    admin = await User.create({
      userId,
      name: 'Grow Wealth Admin',
      email: 'admin@growwealth.local',
      mobile: '9999999999',
      password,
      transactionPassword: trx,
      country: 'INDIA',
      role: 'admin',
      sponsorId: null,
      walletAddress: '0x0000000000000000000000000000000000000001',
      isJoined: true,
      joiningAmount: 1,
      joinedAt: new Date(),
    });
    console.log('Admin created');
  }

  console.log('Login → User ID: GW0000001 | Password: Admin@123');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
