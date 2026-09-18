const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema(
  {
    pendingId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true },
    mobile: { type: String, required: true },
    passwordHash: { type: String, required: true },
    trxPasswordPlain: { type: String, default: '' },
    country: { type: String, default: 'INDIA' },
    walletAddress: { type: String, required: true, lowercase: true, index: true },
    sponsorId: { type: String, default: 'GW0000001' },
    userId: { type: String, required: true, unique: true },
    amountDue: { type: Number, default: 10 },
    status: {
      type: String,
      enum: ['pending_payment', 'completed', 'expired'],
      default: 'pending_payment',
      index: true,
    },
    paymentTxHash: { type: String, default: '' },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
