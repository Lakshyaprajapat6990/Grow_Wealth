const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  const isAdmin = user.role === 'admin';
  const expiresIn = isAdmin
    ? process.env.ADMIN_JWT_EXPIRES || '24h'
    : process.env.JWT_EXPIRES || '7d';

  return jwt.sign(
    {
      id: user._id,
      userId: user.userId,
      role: user.role,
      tv: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function randomDigits(len = 7) {
  let s = '';
  for (let i = 0; i < len; i += 1) s += Math.floor(Math.random() * 10);
  return s;
}

async function generateUniqueUserId() {
  for (let i = 0; i < 20; i += 1) {
    const userId = `GW${randomDigits(7)}`;
    const exists = await User.exists({ userId });
    if (!exists) return userId;
  }
  throw new Error('Could not generate unique User ID');
}

function generateTrxPassword() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function isValidBep20Address(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address || '');
}

module.exports = {
  signToken,
  generateUniqueUserId,
  generateTrxPassword,
  isValidBep20Address,
};
