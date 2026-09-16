/** Client plan display + docs */

export const PLAN_CORE = [
  { rule: 'Network', value: 'BEP-20 Standard (USDT · BSC)' },
  { rule: 'Package / Stake', value: 'Min $10 · Increments of $1 · up to $50,000' },
  { rule: 'Daily ROI', value: '1% Daily (All 7 Days)' },
  { rule: 'ROI Cap', value: 'Maximum 2X of the investment' },
  { rule: 'Compounding Mode', value: 'Manual Compounding' },
  { rule: 'Withdrawal', value: 'Min $10 (Unlimited subsequent withdrawals)' },
  { rule: 'Withdrawal Fee', value: '10%' },
  {
    rule: 'Refer & Earn',
    value: '1st direct 5% · 2nd 3% · 3rd 2% · 4th 1.5% · 5th 1% · 6th–10th 0.5% (on joining amount)',
  },
];

export const PLAN_LEVELS = [
  { level: 'Level 1 (L-1)', income: '10%', target: '$500' },
  { level: 'Level 2 (L-2)', income: '12%', target: '$1,000' },
  { level: 'Level 3 (L-3)', income: '15%', target: '$1,500' },
  { level: 'Level 4 (L-4)', income: '17%', target: '$2,500' },
  { level: 'Level 5 (L-5)', income: '20%', target: '$4,000' },
  { level: 'Level 6 (L-6)', income: '23%', target: '$7,500' },
  { level: 'Level 7 (L-7)', income: '25%', target: '—' },
];

export const REFER_EARN_TABLE = [
  { order: '1st direct', rate: '5%' },
  { order: '2nd direct', rate: '3%' },
  { order: '3rd direct', rate: '2%' },
  { order: '4th direct', rate: '1.5%' },
  { order: '5th direct', rate: '1%' },
  { order: '6th–10th direct', rate: '0.5% each' },
];

export const PLAN_DISCLAIMER =
  'Disclaimer: The maximum ROI is capped at 2X of the investment.';

export const PLAN_LEVEL_NOTE =
  'Level income is ROI ka ROI: when a downline receives daily ROI, uplines L1–L7 earn the Level Income % — only if their own total ROI has reached that level’s ROI / TARGET. L-7 has no target.';

export const REFER_EARN_NOTE =
  'Refer & Earn: only the direct sponsor earns. Rate depends on how many joined directs they already have (1st→5%, 2nd→3%, …). Paid on the new member’s joining/investment amount. No upline chain share.';

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

