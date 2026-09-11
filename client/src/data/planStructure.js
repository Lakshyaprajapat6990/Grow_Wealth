/** Client plan.pdf — single source for display + docs */

export const PLAN_CORE = [
  { rule: 'Network', value: 'BEP-20 Standard (USDT · BSC)' },
  { rule: 'Package / Stake', value: 'Min $10 · Increments of $1 · up to $50,000' },
  { rule: 'Daily ROI', value: '1% Daily (All 7 Days)' },
  { rule: 'ROI Cap', value: 'Maximum 2X of the investment' },
  { rule: 'Compounding Mode', value: 'Manual Compounding' },
  { rule: 'Withdrawal', value: 'Min $10 (Unlimited subsequent withdrawals)' },
  { rule: 'Withdrawal Fee', value: '10%' },
  { rule: 'Direct Income', value: '5%' },
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

export const PLAN_DISCLAIMER =
  'Disclaimer: The maximum ROI is capped at 2X of the investment.';

export const PLAN_LEVEL_NOTE =
  'Level income is ROI ka ROI: when a downline receives daily ROI, uplines L1–L7 earn the Level Income % — only if their own total ROI has reached that level’s ROI / TARGET. L-7 has no target.';
