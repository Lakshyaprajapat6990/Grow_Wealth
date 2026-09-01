const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'replied', 'closed'], default: 'open' },
    adminReply: { type: String, default: '' },
    repliedAt: { type: Date, default: null },
    repliedBy: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Support', supportSchema);
