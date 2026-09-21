const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const User = require('./models/User');

const ADMIN_PASSWORD = 'dev.lakshya@6990?<>';

async function seed() {
  await connectDB();

  const userId = 'GW0000001';
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  let admin = await User.findOne({ userId });

  if (admin) {
    admin.password = passwordHash;
    admin.role = 'admin';
    // Invalidate all existing JWT sessions on every device
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();
    console.log('Admin password updated:', userId);
    console.log('Logged out of all devices (tokenVersion=%s)', admin.tokenVersion);
  } else {
    const trx = await bcrypt.hash('123456', 10);
    admin = await User.create({
      userId,
      name: 'Grow Wealth Admin',
      email: 'admin@growwealth.local',
      mobile: '9999999999',
      password: passwordHash,
      transactionPassword: trx,
      country: 'INDIA',
      role: 'admin',
      sponsorId: null,
      walletAddress: '0x0000000000000000000000000000000000000001',
      isJoined: true,
      joiningAmount: 1,
      joinedAt: new Date(),
      tokenVersion: 1,
    });
    console.log('Admin created');
  }

  console.log('Login → User ID: GW0000001 | Password: ' + ADMIN_PASSWORD);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
