const User = require('../models/User');

/**
 * Level plan removed — L1–L7 ROI-ka-ROI is disabled.
 * Kept as empty stub so existing imports/callers do not break.
 */
const LEVEL_PLAN = [];

function qualifiesForLevel() {
  return false;
}

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

/** No-op: level income plan removed from backend. */
async function creditLevelIncomeFromRoi() {
  return { credited: 0, totalAmount: 0, details: [], disabled: true };
}

module.exports = {
  LEVEL_PLAN,
  getUplineChain,
  creditLevelIncomeFromRoi,
  qualifiesForLevel,
};
