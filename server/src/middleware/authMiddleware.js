const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      res.status(401);
      throw new Error('Not authorized, token missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.isBlocked) {
      res.status(401);
      throw new Error('Not authorized');
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
