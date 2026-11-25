const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Rank & Rewards — dual qualification:
 * 1. Team business volume (sum of downline totalDeposited).
 * 2. Direct referral business volume (deposits from direct sponsors, ~13% formula).
 * One-time USDT bonus per rank when both targets are reached.
 */
const RANK_PLAN = [
  { rank: 1, target: 5000, directTarget: 650, reward: 150, sharePercent: 3.0 },
  { rank: 2, target: 8000, directTarget: 1040, reward: 250, sharePercent: 3.1 },
  { rank: 3, target: 12000, directTarget: 1560, reward: 400, sharePercent: 3.3 },
  { rank: 4, target: 16000, directTarget: 2080, reward: 600, sharePercent: 3.7 },
  { rank: 5, target: 20000, directTarget: 2600, reward: 900, sharePercent: 4.5 },
  { rank: 6, target: 25000, directTarget: 3250, reward: 1250, sharePercent: 5.0 },
  { rank: 7, target: 31000, directTarget: 4030, reward: 1600, sharePercent: 5.1 },
  { rank: 8, target: 37000, directTarget: 4810, reward: 2100, sharePercent: 5.6 },
  { rank: 9, target: 43000, directTarget: 5590, reward: 2600, sharePercent: 6.0 },
  { rank: 10, target: 50000, directTarget: 6500, reward: 3500, sharePercent: 7.0 },
];

async function getDownlineIds(rootUserId) {
  const all = await User.find({ sponsorId: { $ne: null }, role: { $ne: 'admin' } })
    .select('userId sponsorId totalDeposited')
    .lean();

  const bySponsor = new Map();
  for (const u of all) {
    if (!bySponsor.has(u.sponsorId)) bySponsor.set(u.sponsorId, []);
    bySponsor.get(u.sponsorId).push(u);
  }

  const downline = [];
  const queue = [rootUserId];
  const seen = new Set([rootUserId]);

  while (queue.length) {
    const current = queue.shift();
    const kids = bySponsor.get(current) || [];
    for (const kid of kids) {
      if (seen.has(kid.userId)) continue;
      seen.add(kid.userId);
      downline.push(kid);
      queue.push(kid.userId);
    }
  }

  return downline;
}

/** Team volume = sum of totalDeposited of full downline (not including self). */
async function getTeamVolume(userId) {
  const downline = await getDownlineIds(userId);
  const volume = downline.reduce((sum, u) => sum + Number(u.totalDeposited || 0), 0);
  return {
    volume: Number(volume.toFixed(8)),
    teamSize: downline.length,
  };
}

/** Direct volume = sum of totalDeposited of directly sponsored members. */
async function getDirectVolume(userId) {
  const directs = await User.find({ sponsorId: userId, role: { $ne: 'admin' } })
    .select('userId totalDeposited isJoined')
    .lean();
  const volume = directs.reduce((sum, u) => sum + Number(u.totalDeposited || 0), 0);
  return {
    volume: Number(volume.toFixed(8)),
    directCount: directs.length,
    activeDirectCount: directs.filter((u) => u.isJoined && Number(u.totalDeposited || 0) > 0).length,
  };
}

async function creditRankReward(user, rankCfg, teamVolume, directVolume = 0) {
  const amt = Number(rankCfg.reward);
  if (amt <= 0) return null;

  user.rankReward = Number(((user.rankReward || 0) + amt).toFixed(8));
  user.totalRankReward = Number(((user.totalRankReward || 0) + amt).toFixed(8));
  user.incomeBalance = Number((user.incomeBalance + amt).toFixed(8));
  user.totalEarnings = Number((user.totalEarnings + amt).toFixed(8));
  user.currentRank = Math.max(Number(user.currentRank || 0), rankCfg.rank);
  user.ranksClaimed = [...new Set([...(user.ranksClaimed || []), rankCfg.rank])].sort((a, b) => a - b);
  await user.save();

  await Transaction.create({
    userId: user.userId,
    type: 'rank_reward',
    amount: amt,
    balanceAfter: user.incomeBalance,
    status: 'success',
    description: `Rank ${rankCfg.rank} reward ${amt} USDT (team volume $${teamVolume}, direct volume $${directVolume})`,
    meta: {
      rank: rankCfg.rank,
      target: rankCfg.target,
      directTarget: rankCfg.directTarget,
      reward: amt,
      teamVolume,
      directVolume,
      sharePercent: rankCfg.sharePercent,
    },
    createdBy: 'system',
  });

  return { rank: rankCfg.rank, reward: amt, teamVolume, directVolume };
}

/**
 * Check one user: unlock any unclaimed ranks whose team target AND direct target are met.
 */
async function evaluateRanksForUser(userId) {
  if (!userId || userId === 'GW0000001' || userId === 'ADMIN') {
    return { awarded: [], volume: 0, directVolume: 0 };
  }

  const user = await User.findOne({ userId, isBlocked: false });
  if (!user || user.role === 'admin') {
    return { awarded: [], volume: 0, directVolume: 0 };
  }

  const { volume, teamSize } = await getTeamVolume(userId);
  const { volume: directVolume, directCount } = await getDirectVolume(userId);
  const claimed = new Set(user.ranksClaimed || []);
  const awarded = [];

  for (const cfg of RANK_PLAN) {
    const teamHit = volume >= cfg.target;
    const directHit = directVolume >= (cfg.directTarget || 0);
    if (teamHit && directHit && !claimed.has(cfg.rank)) {
      const result = await creditRankReward(user, cfg, volume, directVolume);
      if (result) {
        awarded.push(result);
        claimed.add(cfg.rank);
      }
    }
  }

  return {
    awarded,
    volume,
    teamSize,
    directVolume,
    directCount,
    currentRank: user.currentRank || 0,
    ranksClaimed: user.ranksClaimed || [],
  };
}

/**
 * After a member's deposit/join increases volume, re-check all uplines (sponsors).
 */
async function evaluateRanksUpChain(memberUserId) {
  const member = await User.findOne({ userId: memberUserId }).select('sponsorId');
  if (!member?.sponsorId) return { chain: [] };

  const chain = [];
  let sid = member.sponsorId;
  const seen = new Set();

  while (sid && sid !== 'GW0000001' && sid !== 'ADMIN' && !seen.has(sid)) {
    seen.add(sid);
    const result = await evaluateRanksForUser(sid);
    chain.push({ userId: sid, ...result });
    const up = await User.findOne({ userId: sid }).select('sponsorId');
    sid = up?.sponsorId || null;
  }

  return { chain };
}

async function getRankStatus(userId) {
  const user = await User.findOne({ userId });
  if (!user) return null;

  const { volume, teamSize } = await getTeamVolume(userId);
  const { volume: directVolume, directCount } = await getDirectVolume(userId);
  const claimed = user.ranksClaimed || [];
  const currentRank = user.currentRank || 0;

  const ranks = RANK_PLAN.map((r) => {
    const teamHit = volume >= r.target;
    const directHit = directVolume >= (r.directTarget || 0);
    const paid = claimed.includes(r.rank);
    const unlocked = paid || (teamHit && directHit);
    const pendingDirect = teamHit && !directHit && !paid;
    return {
      ...r,
      unlocked,
      paid,
      teamHit,
      directHit,
      pendingDirect,
      directRemaining: Math.max(0, Number(((r.directTarget || 0) - directVolume).toFixed(2))),
      progressPercent: Math.min(100, Number(((volume / r.target) * 100).toFixed(2))),
      directProgressPercent: r.directTarget
        ? Math.min(100, Number(((directVolume / r.directTarget) * 100).toFixed(2)))
        : 100,
    };
  });

  const next = RANK_PLAN.find((r) => !claimed.includes(r.rank));

  return {
    currentRank,
    ranksClaimed: claimed,
    teamVolume: volume,
    teamSize,
    directVolume,
    directCount,
    totalRankReward: user.totalRankReward || 0,
    nextRank: next || null,
    remainingToNext: next ? Math.max(0, Number((next.target - volume).toFixed(2))) : 0,
    remainingDirectToNext: next ? Math.max(0, Number(((next.directTarget || 0) - directVolume).toFixed(2))) : 0,
    ranks,
  };
}

module.exports = {
  RANK_PLAN,
  getTeamVolume,
  getDirectVolume,
  getDownlineIds,
  evaluateRanksForUser,
  evaluateRanksUpChain,
  getRankStatus,
};
