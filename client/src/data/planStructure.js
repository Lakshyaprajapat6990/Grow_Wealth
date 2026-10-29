/** Client plan display + docs */

export const PLAN_CORE = [
  { rule: 'Network', value: 'BEP-20 Standard (USDT · BSC)' },
  { rule: 'Package / Stake', value: 'Min $10 · Increments of $1 · up to $50,000' },
  { rule: 'Daily ROI', value: '1% Daily (All 7 Days)' },
  { rule: 'ROI Cap', value: 'Maximum 2X of the investment' },
  { rule: 'Compounding Mode', value: 'Manual Compounding' },
  { rule: 'Withdrawal', value: 'Min $10 · Principal + income allowed · Process 24–48 hours' },
  { rule: 'Withdrawal Fee', value: '10%' },
  {
    rule: 'Refer & Earn',
    value: 'L1 5% · L2 2% · L3 1% of joining amount (3 upline levels)',
  },
  { rule: 'Company share', value: '0.8% of joining amount' },
];

/** @deprecated Level Income (ROI-ka-ROI L1–L7) removed from product. */
export const PLAN_LEVELS = [];

export const REFER_EARN_TABLE = [
  { order: 'L1 (direct sponsor)', rate: '5%' },
  { order: 'L2', rate: '2%' },
  { order: 'L3', rate: '1%' },
];

export const PLAN_DISCLAIMER =
  'Disclaimer: The maximum ROI is capped at 2X of the investment. Leader incentives are non-withdrawable.';

/** @deprecated Level Income removed. */
export const PLAN_LEVEL_NOTE = 'Level Income (ROI-ka-ROI L1–L7) has been removed from the plan.';

export const REFER_EARN_NOTE =
  'Refer & Earn: on each join, L1 (sponsor) 5%, L2 2%, L3 1% of the joining amount. Company also receives 0.8%.';

export const RANK_REWARDS = [
  { rank: 1, target: '$5,000', reward: '150 USDT' },
  { rank: 2, target: '$8,000', reward: '250 USDT' },
  { rank: 3, target: '$12,000', reward: '400 USDT' },
  { rank: 4, target: '$16,000', reward: '600 USDT' },
  { rank: 5, target: '$20,000', reward: '900 USDT' },
  { rank: 6, target: '$25,000', reward: '1,250 USDT' },
  { rank: 7, target: '$31,000', reward: '1,600 USDT' },
  { rank: 8, target: '$37,000', reward: '2,100 USDT' },
  { rank: 9, target: '$43,000', reward: '2,600 USDT' },
  { rank: 10, target: '$50,000', reward: '3,500 USDT' },
];

export const RANK_REWARD_NOTE =
  'Rank & Rewards: when your team’s total deposited volume hits a rank target, you receive a one-time USDT bonus. Team headcount does not matter — only business volume.';

export const LEADER_INCENTIVE_NOTE =
  'Welcome gift for new joins is currently $0. Prior gifts (if any) stay locked on Fund Balance and do not earn ROI.';
