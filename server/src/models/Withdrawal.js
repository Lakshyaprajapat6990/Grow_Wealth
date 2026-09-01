const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    walletAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
    },
    isFirstWithdrawal: { type: Boolean, default: false },
    adminNote: { type: String, default: '' },
    processedAt: { type: Date, default: null },
    processedBy: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
