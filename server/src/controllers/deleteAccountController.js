const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Support = require('../models/Support');
const Notification = require('../models/Notification');

/**
 * Hard-delete a member account and related records.
 * Reassigns their directs to the deleted user's sponsor (or company admin).
 */
async function deleteUserAccount(targetUserId, { actorUserId, allowAdmin = false } = {}) {
  const user = await User.findOne({ userId: String(targetUserId).toUpperCase() });
  if (!user) {
    return { ok: false, status: 404, message: 'User not found' };
  }

  if (user.role === 'admin' && !allowAdmin) {
    return { ok: false, status: 400, message: 'Admin accounts cannot be deleted this way' };
  }

  if (user.userId === 'GW0000001') {
    return { ok: false, status: 400, message: 'Company admin account cannot be deleted' };
  }

  const fallbackSponsor = user.sponsorId && user.sponsorId !== user.userId ? user.sponsorId : 'GW0000001';

  // Move direct referrals under deleted user's sponsor
  await User.updateMany(
    { sponsorId: user.userId },
    { $set: { sponsorId: fallbackSponsor } }
  );

  if (user.sponsorId) {
    const sponsor = await User.findOne({ userId: user.sponsorId });
    if (sponsor) {
      sponsor.directCount = Math.max(0, (sponsor.directCount || 0) - 1);
      sponsor.teamCount = Math.max(0, (sponsor.teamCount || 0) - 1);
      await sponsor.save();
    }
  }

  await Promise.all([
    Transaction.deleteMany({ userId: user.userId }),
    Withdrawal.deleteMany({ userId: user.userId }),
    Support.deleteMany({ userId: user.userId }),
    Notification.deleteMany({ userId: user.userId }),
  ]);

  await User.deleteOne({ _id: user._id });

  return {
    ok: true,
    message: `Account ${user.userId} deleted`,
    deletedUserId: user.userId,
    actorUserId,
  };
}

async function deleteMyAccount(req, res) {
  const { password, confirmText } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required to delete account' });
  }
  if (String(confirmText || '').trim().toUpperCase() !== 'DELETE') {
    return res.status(400).json({
      success: false,
      message: 'Type DELETE to confirm account deletion',
    });
  }

  if (req.user.role === 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Admin cannot self-delete from member panel',
    });
  }

  const okPass = await bcrypt.compare(password, req.user.password);
  if (!okPass) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  const result = await deleteUserAccount(req.user.userId, { actorUserId: req.user.userId });
  if (!result.ok) {
    return res.status(result.status).json({ success: false, message: result.message });
  }

  return res.json({ success: true, message: result.message });
}

async function adminDeleteUser(req, res) {
  const userId = String(req.params.userId || '').toUpperCase();
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID required' });
  }
  if (userId === req.user.userId) {
    return res.status(400).json({ success: false, message: 'Use another admin to delete this account' });
  }

  const result = await deleteUserAccount(userId, { actorUserId: req.user.userId });
  if (!result.ok) {
    return res.status(result.status).json({ success: false, message: result.message });
  }

  return res.json({ success: true, message: result.message, deletedUserId: result.deletedUserId });
}

module.exports = { deleteMyAccount, adminDeleteUser, deleteUserAccount };
