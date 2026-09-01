const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    isGlobal: { type: Boolean, default: false },
    createdBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
