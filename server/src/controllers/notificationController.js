const Notification = require('../models/Notification');

async function myNotifications(req, res) {
  const list = await Notification.find({
    $or: [{ userId: req.user.userId }, { isGlobal: true }],
  })
    .sort({ createdAt: -1 })
    .limit(50);

  const unread = list.filter((n) => !n.isRead).length;
  return res.json({ success: true, notifications: list, unread });
}

async function markRead(req, res) {
  await Notification.updateMany(
    { $or: [{ userId: req.user.userId }, { isGlobal: true }], isRead: false },
    { $set: { isRead: true } }
  );
  return res.json({ success: true });
}

async function adminCreate(req, res) {
  const { title, message, userId, isGlobal } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message required' });
  }

  const notification = await Notification.create({
    title,
    message,
    userId: isGlobal ? null : userId || null,
    isGlobal: !!isGlobal,
    createdBy: req.user.userId,
  });

  return res.status(201).json({ success: true, notification });
}

module.exports = { myNotifications, markRead, adminCreate };
