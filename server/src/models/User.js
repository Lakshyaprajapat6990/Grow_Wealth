const mongoose = require('mongoose');

const walletAddressHistorySchema = new mongoose.Schema(
  {
    address: String,
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    transactionPassword: { type: String, required: true },
    country: { type: String, default: 'INDIA' },
    role: { type: String, enum: ['user', 'admin', 'leader'], default: 'user' },
    sponsorId: { type: String, default: null, index: true },

    walletAddress: { type: String, default: '' },
    walletAddressHistory: [walletAddressHistorySchema],

    // Balances
    fundBalance: { type: Number, default: 0 },
    incomeBalance: { type: Number, default: 0 },
    usdtBep20Balance: { type: Number, default: 0 },

    // Income buckets
    directIncome: { type: Number, default: 0 },
    totalDirectIncome: { type: Number, default: 0 },
    levelIncome: { type: Number, default: 0 },
    totalLevelIncome: { type: Number, default: 0 },
    roiIncome: { type: Number, default: 0 },
    totalRoiIncome: { type: Number, default: 0 },
    fastTrackIncome: { type: Number, default: 0 },
    totalFastTrackIncome: { type: Number, default: 0 },
    salaryIncome: { type: Number, default: 0 },
    totalSalaryIncome: { type: Number, default: 0 },
    rankReward: { type: Number, default: 0 },
    totalRankReward: { type: Number, default: 0 },
    currentRank: { type: Number, default: 0 },
    ranksClaimed: { type: [Number], default: [] },
    totalEarnings: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    pendingWithdrawals: { type: Number, default: 0 },

    // Joining / activation
    isJoined: { type: Boolean, default: false },
    joiningAmount: { type: Number, default: 0 },
    joinedAt: { type: Date, default: null },
    totalDeposited: { type: Number, default: 0 },
    registrationPaid: { type: Boolean, default: true },

    // Withdraw rules
    hasCompletedFirstWithdrawal: { type: Boolean, default: false },
    withdrawalCount: { type: Number, default: 0 },

    // Network
    directCount: { type: Number, default: 0 },
    teamCount: { type: Number, default: 0 },

    isBlocked: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    userId: this.userId,
    name: this.name,
    email: this.email,
    mobile: this.mobile,
    country: this.country,
    role: this.role,
    sponsorId: this.sponsorId,
    walletAddress: this.walletAddress,
    fundBalance: this.fundBalance,
    incomeBalance: this.incomeBalance,
    usdtBep20Balance: this.usdtBep20Balance,
    directIncome: this.directIncome,
    totalDirectIncome: this.totalDirectIncome,
    levelIncome: this.levelIncome,
    totalLevelIncome: this.totalLevelIncome,
    roiIncome: this.roiIncome,
    totalRoiIncome: this.totalRoiIncome,
    fastTrackIncome: this.fastTrackIncome || 0,
    totalFastTrackIncome: this.totalFastTrackIncome || 0,
    salaryIncome: this.salaryIncome || 0,
    totalSalaryIncome: this.totalSalaryIncome || 0,
    rankReward: this.rankReward || 0,
    totalRankReward: this.totalRankReward || 0,
    currentRank: this.currentRank || 0,
    ranksClaimed: this.ranksClaimed || [],
    totalEarnings: this.totalEarnings,
    totalWithdrawn: this.totalWithdrawn,
    pendingWithdrawals: this.pendingWithdrawals,
    isJoined: this.isJoined,
    joiningAmount: this.joiningAmount,
    joinedAt: this.joinedAt,
    totalDeposited: this.totalDeposited,
    registrationPaid: this.registrationPaid !== false,
    hasCompletedFirstWithdrawal: this.hasCompletedFirstWithdrawal,
    withdrawalCount: this.withdrawalCount,
    directCount: this.directCount,
    teamCount: this.teamCount,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
