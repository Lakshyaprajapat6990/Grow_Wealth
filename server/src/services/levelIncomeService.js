const User = require('../models/User');
const Transaction = require('../models/Transaction');

/** Level % of downline daily ROI (ROI ka ROI) · unlock by own total ROI */
const LEVEL_PLAN = [
  { level: 1, percent: 10, target: 500 },
  { level: 2, percent: 12, target: 1000 },
  { level: 3, percent: 15, target: 1500 },
  { level: 4, percent: 17, target: 2500 },
  { level: 5, percent: 20, target: 4000 },
  { level: 6, percent: 23, target: 7500 },
  { level: 7, percent: 25, target: 0 }, // no target
];

function qualifiesForLevel(upline, levelCfg) {
  if (!upline || upline.role === 'admin' || upline.isBlocked || !upline.isJoined) return false;
  const earnedRoi = Number(upline.totalRoiIncome || 0);
  return earnedRoi >= Number(levelCfg.target || 0);
}

/**
 * Walk sponsor chain: L1 = direct sponsor … L7
 */
async function getUplineChain(startUserId, maxLevels = 7) {
  const chain = [];
  const seen = new Set([startUserId]);
  let currentId = startUserId;

  for (let i = 0; i < maxLevels; i += 1) {
    const current = await User.findOne({ userId: currentId }).select('sponsorId');
    if (!current?.sponsorId) break;
    const sid = String(current.sponsorId).toUpperCase();
    if (!sid || sid === 'ADMIN' || sid === 'GW0000001' || seen.has(sid)) break;
    seen.add(sid);

    const upline = await User.findOne({ userId: sid });
    if (!upline) break;
    chain.push(upline);
    currentId = sid;
  }

  return chain;
}

/**
 * Distribute L1–L7 income from a member's ROI credit (ROI ka ROI).
 * Upline must meet ROI / TARGET for that level.
 */
async function creditLevelIncomeFromRoi({
  fromUserId,
  roiAmount,
  roiDay = null,
  createdBy = 'system',
} = {}) {
  const amount = Number(roiAmount);
  if (!fromUserId || !amount || amount <= 0) {
    return { credited: 0, totalAmount: 0, details: [] };
  }

  const chain = await getUplineChain(fromUserId, LEVEL_PLAN.length);
  let credited = 0;
  let totalAmount = 0;
  const details = [];

  for (let i = 0; i < chain.length; i += 1) {
    const levelCfg = LEVEL_PLAN[i];
    if (!levelCfg) break;

    const upline = chain[i];
    if (!qualifiesForLevel(upline, levelCfg)) {
      details.push({
        level: levelCfg.level,
        userId: upline.userId,
        skipped: true,
        reason: `ROI target $${levelCfg.target} not met (has $${Number(upline.totalRoiIncome || 0).toFixed(2)})`,
      });
      continue;
    }

    const pay = Number(((amount * levelCfg.percent) / 100).toFixed(8));
    if (pay <= 0) continue;

    upline.levelIncome = Number(((upline.levelIncome || 0) + pay).toFixed(8));
    upline.totalLevelIncome = Number(((upline.totalLevelIncome || 0) + pay).toFixed(8));
    upline.incomeBalance = Number((upline.incomeBalance + pay).toFixed(8));
    upline.totalEarnings = Number((upline.totalEarnings + pay).toFixed(8));
    await upline.save();

    await Transaction.create({
      userId: upline.userId,
      type: 'level_income',
      amount: pay,
      balanceAfter: upline.incomeBalance,
      status: 'success',
      description: `L${levelCfg.level} income ${levelCfg.percent}% of ROI $${amount} from ${fromUserId}`,
      meta: {
        level: levelCfg.level,
        percent: levelCfg.percent,
        target: levelCfg.target,
        fromUserId,
        roiAmount: amount,
        roiDay,
        type: 'roi_ka_roi',
      },
      createdBy,
    });

    credited += 1;
    totalAmount += pay;
    details.push({
      level: levelCfg.level,
      userId: upline.userId,
      amount: pay,
      percent: levelCfg.percent,
    });
  }

  return {
    credited,
    totalAmount: Number(totalAmount.toFixed(8)),
    details,
  };
}

module.exports = {
  LEVEL_PLAN,
  getUplineChain,
  creditLevelIncomeFromRoi,
  qualifiesForLevel,
};
