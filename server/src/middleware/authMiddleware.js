const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ensureMemberGift } = require('../services/leaderIncentiveService');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      res.status(401);
      throw new Error('Not authorized, token missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.id);
    if (!user || user.isBlocked) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const tokenVersion = user.tokenVersion || 0;
    if ((decoded.tv ?? 0) !== tokenVersion) {
      res.status(401);
      throw new Error('Session expired. Please login again.');
    }

    // Auto-grant locked 100 USDT Navratri gift to every member (non-withdrawable)
    if (user.role !== 'admin' && !(user.leaderIncentiveAmount > 0)) {
      try {
        const gift = await ensureMemberGift(user.userId);
        if (gift?.user) user = gift.user;
      } catch (e) {
        console.error('[ensureMemberGift]', e.message);
      }
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    next(new Error(err.message || 'Not authorized'));
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    res.status(403);
    return next(new Error('Access denied. Admins only.'));
  }
  next();
}

module.exports = { protect, adminOnly };
