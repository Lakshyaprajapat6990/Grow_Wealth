const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'deposit',
        'joining',
        'roi',
        'direct_income',
        'level_income',
        'salary_income',
        'fast_track_income',
        'transfer_in',
        'transfer_out',
        'withdraw',
        'withdraw_reject',
        'admin_credit',
        'admin_debit',
      ],
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'rejected'],
      default: 'success',
    },
    description: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: String, default: 'system' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
