/**
 * Grow Wealth - Full Client Features Guide
 * One colorful PDF that explains every live feature in plain language.
 * No em dashes. Human, clear copy for client handover.
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'GrowWealth_Client_Features.pdf');
const downloadsPath = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'Downloads',
  'GrowWealth_Client_Features.pdf'
);

const assetsDir = path.join(__dirname, 'client/public/marketing');
const fallbackAssetsDir = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'e-freelancher-Project-live-BEP-20',
  'assets'
);

const BLUE = '#1d4ed8';
const SKY = '#0ea5e9';
const NAVY = '#0b1f3a';
const GOLD = '#f59e0b';
const GREEN = '#16a34a';
const ORANGE = '#f97316';
const TEAL = '#0d9488';
const WHITE = '#ffffff';
const MUTED = '#64748b';
const LIGHT = '#e0f2fe';
const SOFT = '#f8fafc';

function pickImg(name) {
  const a = path.join(assetsDir, name);
  const b = path.join(fallbackAssetsDir, name);
  if (fs.existsSync(a)) return a;
  if (fs.existsSync(b)) return b;
  return a;
}

const coverImg = pickImg('gw-features-cover.png');
const earnImg = pickImg('gw-features-earn.png');
const adminImg = pickImg('gw-features-admin.png');
const cert1 = path.join(__dirname, 'client/public/certificates/certificate-digital-asset-professional.png');
const cert2 = path.join(__dirname, 'client/public/certificates/certificate-crypto-trader.png');
const planImg = path.join(__dirname, 'client/public/plan.png');

const doc = new PDFDocument({
  size: 'A4',
  margin: 0,
  info: {
    Title: 'Grow Wealth Client Features Guide',
    Author: 'Grow Wealth',
    Subject: 'Complete feature list of the live USDT BEP-20 staking and team platform',
  },
});

const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

function pageBg(color = SOFT) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(color);
}

function roundedRect(x, y, w, h, r, fill, stroke) {
  doc.save();
  doc.roundedRect(x, y, w, h, r);
  if (fill) doc.fill(fill);
  if (stroke) {
    doc.strokeColor(stroke).lineWidth(1).stroke();
  }
  doc.restore();
}

function safeImage(file, x, y, opts) {
  if (!file || !fs.existsSync(file)) return false;
  try {
    doc.image(file, x, y, opts);
    return true;
  } catch (_) {
    return false;
  }
}

function headerBar(title, subtitle) {
  doc.rect(0, 0, 595, 100).fill(NAVY);
  doc.circle(530, 20, 55).fillOpacity(0.14).fill(SKY).fillOpacity(1);
  doc.circle(70, 85, 36).fillOpacity(0.12).fill(ORANGE).fillOpacity(1);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(20).text('GROW WEALTH', 40, 22);
  doc.fillColor(SKY).font('Helvetica').fontSize(10).text('Client Features Guide  |  USDT BEP-20 Platform', 40, 46);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(14).text(title, 40, 68);
  if (subtitle) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text(subtitle, 40, 86, { width: 510 });
  }
}

function footer(pageNo, total) {
  doc.rect(0, 820, 595, 22).fill(NAVY);
  doc
    .fillColor('#94a3b8')
    .font('Helvetica')
    .fontSize(8)
    .text(
      'grow-wealth-neon.vercel.app  |  Full system features for client  |  Page ' + pageNo + ' of ' + total,
      40,
      826,
      { width: 515, align: 'center' }
    );
}

function bulletBlock(x, y, width, title, color, lines) {
  const h = 28 + lines.length * 18;
  roundedRect(x, y, width, h, 10, WHITE, '#e2e8f0');
  doc.rect(x, y, 6, h).fill(color);
  doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(title, x + 16, y + 10);
  lines.forEach((line, i) => {
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text('•  ' + line, x + 16, y + 30 + i * 18, { width: width - 28 });
  });
  return h;
}

function featureChip(x, y, w, h, color, title, body) {
  roundedRect(x, y, w, h, 12, color);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text(title, x + 12, y + 14, { width: w - 24 });
  doc.fillColor('#e2e8f0').font('Helvetica').fontSize(8).text(body, x + 12, y + 34, { width: w - 24, lineGap: 1 });
}

const TOTAL = 9;

// ===================== PAGE 1 COVER =====================
pageBg(NAVY);
doc.circle(480, 100, 130).fillOpacity(0.16).fill(SKY).fillOpacity(1);
doc.circle(60, 720, 110).fillOpacity(0.12).fill(ORANGE).fillOpacity(1);

doc.fillColor(SKY).font('Helvetica-Bold').fontSize(11).text('BUILT FOR YOUR BUSINESS', 50, 48, {
  align: 'center',
  width: 495,
});
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(36).text('GROW WEALTH', 50, 78, {
  align: 'center',
  width: 495,
});
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('Complete Client Features Guide', 50, 124, {
  align: 'center',
  width: 495,
});
doc
  .fillColor('#cbd5e1')
  .font('Helvetica')
  .fontSize(11)
  .text(
    'A clear walkthrough of every live feature in your USDT BEP-20 staking and team platform.',
    70,
    156,
    { align: 'center', width: 455, lineGap: 2 }
  );

safeImage(coverImg, 50, 195, { width: 495, height: 220, fit: [495, 220], align: 'center' });

const chips = [
  { t: 'Join from $1', c: GREEN, d: 'Auto join after payment' },
  { t: '1% Daily ROI', c: SKY, d: 'Runs every day on autopilot' },
  { t: '2x ROI Cap', c: ORANGE, d: 'Clear earning limit' },
  { t: 'L1 to L7', c: TEAL, d: 'Team income levels' },
];
chips.forEach((c, i) => {
  const x = 40 + i * 130;
  roundedRect(x, 440, 120, 72, 12, c.c);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(12).text(c.t, x + 8, 456, { width: 104, align: 'center' });
  doc.font('Helvetica').fontSize(8).text(c.d, x + 8, 480, { width: 104, align: 'center' });
});

roundedRect(50, 535, 495, 110, 14, '#102a4a');
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(12).text('What this PDF covers', 70, 555);
doc
  .fillColor('#cbd5e1')
  .font('Helvetica')
  .fontSize(9)
  .text(
    'Member signup and joining, deposits with Tx Hash and on-chain check, daily ROI, compound, withdraw, direct and level income, team tools, certificates, support, admin panel, and live website details.',
    70,
    580,
    { width: 455, lineGap: 3 }
  );

doc
  .fillColor(SKY)
  .font('Helvetica-Bold')
  .fontSize(11)
  .text('Live site: https://grow-wealth-neon.vercel.app', 50, 680, { align: 'center', width: 495 });
doc
  .fillColor('#94a3b8')
  .font('Helvetica')
  .fontSize(9)
  .text('Prepared as a client handover document for the full Grow Wealth system.', 50, 705, {
    align: 'center',
    width: 495,
  });
footer(1, TOTAL);

// ===================== PAGE 2 OVERVIEW =====================
doc.addPage();
pageBg(SOFT);
headerBar('1. Platform overview', 'What your system does in simple words');
footer(2, TOTAL);

doc
  .fillColor(NAVY)
  .font('Helvetica')
  .fontSize(10)
  .text(
    'Grow Wealth is a live web platform where members deposit USDT on BNB Smart Chain (BEP-20), join the plan, earn daily returns, invite people with a referral link, and withdraw income to their own wallet. You also get a full admin panel to approve payments, manage users, and run daily ROI.',
    40,
    118,
    { width: 515, lineGap: 3 }
  );

const overview = [
  { t: 'Member app', c: BLUE, d: 'Register, deposit, join, ROI reports, team, compound, withdraw, support, notifications' },
  { t: 'Admin panel', c: GREEN, d: 'Approve deposits, credit or debit funds, pay withdrawals, run ROI, view history and team tree' },
  { t: 'Automation', c: ORANGE, d: 'Daily ROI cron at midnight UTC, auto join after approved payment of $1 or more' },
  { t: 'Trust assets', c: TEAL, d: 'Plan image viewer, certificates on landing page, live deposit feed, referral links' },
];
overview.forEach((o, i) => {
  const y = 185 + i * 78;
  roundedRect(40, y, 515, 68, 12, WHITE, '#e2e8f0');
  doc.circle(68, y + 34, 18).fill(o.c);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10).text(String(i + 1), 62, y + 28);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text(o.t, 100, y + 16);
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(o.d, 100, y + 36, { width: 430 });
});

roundedRect(40, 510, 515, 130, 14, NAVY);
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12).text('Live business rules (as running now)', 60, 530);
const rules = [
  'Joining and min deposit: $1  |  Max deposit: $50,000',
  'Daily ROI: 1% every day  |  ROI cap: 2 times investment',
  'Direct income: 5% on joining  |  Levels: L1 to L7 (ROI ka ROI)',
  'Withdraw: min $10 with 10% fee  |  Network: USDT BEP-20 only',
];
rules.forEach((r, i) => {
  doc.fillColor('#e2e8f0').font('Helvetica').fontSize(9).text('•  ' + r, 60, 555 + i * 18, { width: 475 });
});

// ===================== PAGE 3 MEMBER START =====================
doc.addPage();
pageBg(SOFT);
headerBar('2. How a member starts', 'Signup, wallet, deposit, and auto join');
footer(3, TOTAL);

bulletBlock(40, 118, 515, 'A) Create account', BLUE, [
  'Fields: full name, mobile, email, password, BEP-20 wallet address, country.',
  'Optional sponsor ID. Referral link format: /register?ref=GWxxxxxxx',
  'If sponsor is blank, company root GW0000001 is used.',
  'System creates User ID like GW1234567 and a 6 digit Transaction Password.',
  'Member can log in with User ID and password. Session lasts 7 days.',
]);

bulletBlock(40, 248, 515, 'B) Deposit USDT (BEP-20)', GREEN, [
  'Member sends USDT on BSC to the company address or QR code.',
  'They can also connect MetaMask on BSC and send from the app.',
  'Then they submit Amount + Tx Hash. Duplicate Tx Hash is blocked.',
  'Admin approves. System reads the real on-chain USDT amount when possible.',
  'Fund balance and total deposited update from the verified amount.',
]);

bulletBlock(40, 378, 515, 'C) Joining (activation)', ORANGE, [
  'Min join amount is $1.',
  'After an approved payment of $1 or more, the member is joined automatically.',
  'There is also a manual Join page that can use existing fund balance.',
  'On join, the direct sponsor gets 5% direct income on the $1 joining amount.',
  'Company root GW0000001 does not take direct income.',
]);

roundedRect(40, 520, 250, 120, 12, BLUE);
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('Balances explained', 56, 540);
doc
  .fillColor('#e2e8f0')
  .font('Helvetica')
  .fontSize(8)
  .text(
    'Fund Balance: deposits and compound.\nIncome Balance: ROI, direct, level, salary credits. This is what they withdraw.\nUSDT BEP-20 Balance: tracks deposit credits.',
    56,
    565,
    { width: 218, lineGap: 3 }
  );

roundedRect(305, 520, 250, 120, 12, TEAL);
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('Safety checks', 321, 540);
doc
  .fillColor('#e2e8f0')
  .font('Helvetica')
  .fontSize(8)
  .text(
    'Wrong network risk is shown in UI.\nOn-chain amount override stops wrong typed amounts.\nBlocked users cannot log in or earn.\nTransaction Password protects withdraw and transfer.',
    321,
    565,
    { width: 218, lineGap: 3 }
  );

// ===================== PAGE 4 EARNINGS =====================
doc.addPage();
pageBg(SOFT);
headerBar('3. How members earn', 'Daily ROI, direct, levels, and compound');
footer(4, TOTAL);

safeImage(earnImg, 40, 115, { width: 515, height: 150, fit: [515, 150], align: 'center' });

featureChip(
  40,
  285,
  250,
  145,
  BLUE,
  'Daily ROI (1%)',
  'Credited once per UTC day for joined members.\nBased on max of total deposited and joining amount.\nStops at 2x investment.\nRuns by cron every midnight UTC.\nAdmin can also Run Daily ROI now.'
);
featureChip(
  305,
  285,
  250,
  145,
  GREEN,
  'Direct Income (5%)',
  'Paid when a direct referral joins.\nBased on $1 joining amount.\nGoes to sponsor income balance.\nShown in Direct Income report.\nNot paid to company root or blocked accounts.'
);
featureChip(
  40,
  450,
  250,
  145,
  ORANGE,
  'Level Income L1 to L7',
  'Also called ROI ka ROI.\nWhen a downline gets daily ROI, open uplines earn a share of that ROI.\nEach level needs its own ROI target first.\nL7 has no target.\nFull table on the next page.'
);
featureChip(
  305,
  450,
  250,
  145,
  TEAL,
  'Manual Compound',
  'Member moves money from income to fund.\nThis raises the ROI base.\nMust be joined and have enough income.\nNo auto compound. Member chooses when.\nShown in wallet history as compound.'
);

doc
  .fillColor(MUTED)
  .font('Helvetica-Oblique')
  .fontSize(8)
  .text('Example: $100 stake can earn about $1 ROI per day until total ROI reaches $200.', 40, 620, {
    width: 515,
  });

roundedRect(40, 645, 515, 95, 12, NAVY);
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(11).text('Extra income types (admin credit)', 60, 665);
doc
  .fillColor('#e2e8f0')
  .font('Helvetica')
  .fontSize(9)
  .text(
    'Admin can manually credit Monthly Salary and Fast Track income. Member reports for these exist. There is no auto salary ladder in code yet. Use admin Other Income when you want to pay these by hand.',
    60,
    690,
    { width: 475, lineGap: 3 }
  );

// ===================== PAGE 5 LEVEL TABLE =====================
doc.addPage();
pageBg(SOFT);
headerBar('4. Team level table', 'Unlock with your own ROI, then earn from team ROI');
footer(5, TOTAL);

doc
  .fillColor(NAVY)
  .font('Helvetica')
  .fontSize(10)
  .text(
    'Before earning from a level, the member needs their own total ROI to reach that level target. After unlock, they earn the level % from their downline daily ROI amount.',
    40,
    118,
    { width: 515, lineGap: 2 }
  );

const levels = [
  ['Level', 'Share of team ROI', 'Own ROI needed'],
  ['L-1', '10%', '$500'],
  ['L-2', '12%', '$1,000'],
  ['L-3', '15%', '$1,500'],
  ['L-4', '17%', '$2,500'],
  ['L-5', '20%', '$4,000'],
  ['L-6', '23%', '$7,500'],
  ['L-7', '25%', 'No target'],
];
const colW = [120, 180, 180];
const startX = 60;
let ty = 160;
levels.forEach((row, ri) => {
  const bg = ri === 0 ? NAVY : ri % 2 === 0 ? LIGHT : WHITE;
  doc.roundedRect(startX, ty, 475, 34, 6).fill(bg);
  let x = startX + 14;
  row.forEach((cell, ci) => {
    doc
      .fillColor(ri === 0 ? WHITE : NAVY)
      .font(ri === 0 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(11)
      .text(cell, x, ty + 11, { width: colW[ci] - 10 });
    x += colW[ci];
  });
  ty += 38;
});

roundedRect(40, 490, 515, 140, 14, NAVY);
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12).text('Easy example', 60, 510);
doc
  .fillColor('#e2e8f0')
  .font('Helvetica')
  .fontSize(10)
  .text(
    'A person in your team gets $5 ROI today.\nIf your L-1 is open (your own ROI is $500 or more), you get 10% of $5 = $0.50.\nIf deeper levels are open, you can earn from those too.\nYour own 1% daily ROI still runs on your stake at the same time.',
    60,
    535,
    { width: 475, lineGap: 4 }
  );

doc
  .fillColor(MUTED)
  .font('Helvetica')
  .fontSize(9)
  .text('Team pages for members: Direct Team, Level Team (full downline), referral link copy on Dashboard.', 40, 660, {
    width: 515,
  });

if (fs.existsSync(planImg)) {
  safeImage(planImg, 140, 690, { width: 315, height: 110, fit: [315, 110] });
}

// ===================== PAGE 6 WITHDRAW + MORE =====================
doc.addPage();
pageBg(SOFT);
headerBar('5. Withdraw, transfer, and member tools', 'Taking money out and day to day panel features');
footer(6, TOTAL);

featureChip(
  40,
  118,
  250,
  160,
  BLUE,
  'Withdraw',
  'Min $10 from income balance.\nAlways 10% fee.\nNeeds Transaction Password.\nPaid to saved BEP-20 wallet.\nAdmin marks request as Paid.\nHistory on Withdrawals page.'
);
featureChip(
  305,
  118,
  250,
  160,
  GREEN,
  'P2P Transfer',
  'Move fund balance to another member.\nMinimum $5.\nNeeds Transaction Password.\nUseful for internal fund move.\nShows in wallet history.\nBoth sides stay on platform.'
);

const memberTools = [
  { t: 'Dashboard', d: 'Balances, join status, referral link, quick actions, recent transactions' },
  { t: 'My Account / Profile', d: 'Status, balances, profile details, account delete with password confirm' },
  { t: 'Income reports', d: 'ROI Income, Direct Income, Level Income, Salary Income pages' },
  { t: 'History pages', d: 'Deposit History, Wallet History, Withdrawals list' },
  { t: 'Plan Details', d: 'Shows the official plan image clearly inside the app' },
  { t: 'Support Ticket', d: 'Member opens subject + message. Sees admin reply and status' },
  { t: 'Notifications', d: 'Platform announcements with unread badge in sidebar' },
  { t: 'System Live Feed', d: 'Live successful deposits refresh about every 15 seconds' },
  { t: 'Trading page', d: 'Mock crypto price board for look and feel (not live exchange trading)' },
  { t: 'Certificates', d: 'Public certificate images on landing with enlarge and download' },
];

memberTools.forEach((m, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 40 + col * 265;
  const y = 300 + row * 52;
  roundedRect(x, y, 250, 44, 8, WHITE, '#e2e8f0');
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(m.t, x + 12, y + 8, { width: 226 });
  doc.fillColor(MUTED).font('Helvetica').fontSize(7).text(m.d, x + 12, y + 24, { width: 226 });
});

// ===================== PAGE 7 ADMIN =====================
doc.addPage();
pageBg(SOFT);
headerBar('6. Admin panel features', 'Everything you control from /admin');
footer(7, TOTAL);

safeImage(adminImg, 40, 115, { width: 515, height: 145, fit: [515, 145], align: 'center' });

const adminFeatures = [
  {
    t: 'Dashboard stats',
    d: 'Total users, joined users, pending withdrawals, total deposited at a glance.',
  },
  {
    t: 'Pending payments',
    d: 'Approve or reject joining and deposit requests. Approve uses on-chain amount when readable and can auto join.',
  },
  {
    t: 'Fund credit / debit',
    d: 'Add or remove member fund with a remark. Credit of $1 or more can auto join.',
  },
  {
    t: 'Daily ROI tools',
    d: 'Run Daily ROI Now for everyone, or credit 1% ROI for one user with 2x cap check.',
  },
  {
    t: 'Other income',
    d: 'Manual credit for Direct, Level, Monthly Salary, or Fast Track income types.',
  },
  {
    t: 'Withdrawals',
    d: 'See pending requests and mark them Paid after you send USDT.',
  },
  {
    t: 'Users table',
    d: 'Search members, open History, open Team Tree, or delete a user (directs move to their sponsor).',
  },
  {
    t: 'User history',
    d: 'Deposits, credits, ROI, level/direct income, compound, withdraw, transfers (recent activity).',
  },
  {
    t: 'Team hierarchy',
    d: 'Expandable tree with name, ID, join status, counts, fund and deposited. Search by User ID.',
  },
  {
    t: 'Force join API',
    d: 'Backend support to force join paid users (script/API). Useful for migration fixes.',
  },
];

adminFeatures.forEach((a, i) => {
  const y = 280 + i * 48;
  roundedRect(40, y, 515, 42, 8, WHITE, '#e2e8f0');
  doc.circle(58, y + 21, 8).fill(i % 2 === 0 ? BLUE : TEAL);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(a.t, 78, y + 7, { width: 460 });
  doc.fillColor(MUTED).font('Helvetica').fontSize(7).text(a.d, 78, y + 22, { width: 460 });
});

// ===================== PAGE 8 CERTS + PLAN =====================
doc.addPage();
pageBg(SOFT);
headerBar('7. Certificates, plan, and public pages', 'What visitors and members see outside the wallet flow');
footer(8, TOTAL);

doc
  .fillColor(NAVY)
  .font('Helvetica')
  .fontSize(10)
  .text(
    'The landing page shows brand story, plan viewer, certificates, FAQ, and clear call to action. Members also see the same plan image inside Plan Details.',
    40,
    118,
    { width: 515, lineGap: 2 }
  );

safeImage(cert1, 40, 155, { width: 250, height: 170, fit: [250, 170] });
safeImage(cert2, 305, 155, { width: 250, height: 170, fit: [250, 170] });
doc.fillColor(MUTED).font('Helvetica').fontSize(8).text('Digital Asset Professional', 40, 335, {
  width: 250,
  align: 'center',
});
doc.text('Certified Crypto Trader', 305, 335, { width: 250, align: 'center' });

roundedRect(40, 360, 515, 95, 12, WHITE, '#bfdbfe');
doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(11).text('Public and member extras', 60, 378);
doc
  .fillColor(MUTED)
  .font('Helvetica')
  .fontSize(9)
  .text(
    '• Landing page with plan image (no PDF chrome) and certificate lightbox + download\n• Live deposit feed with total and today investment style stats\n• Notifications system for announcements\n• Support tickets for member help requests',
    60,
    400,
    { width: 475, lineGap: 2 }
  );

roundedRect(40, 475, 515, 160, 14, NAVY);
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12).text('Quick feature checklist', 60, 495);
const checklist = [
  'Auth: register, login, sponsor check, GW User ID, Transaction Password',
  'Money in: USDT BEP-20 deposit, QR/address, MetaMask, Tx Hash, on-chain verify',
  'Earn: 1% daily ROI, 2x cap, 5% direct, L1 to L7, manual compound',
  'Money out: withdraw min $10 + 10% fee, P2P transfer min $5',
  'Team: referral link, direct team, full downline, admin hierarchy tree',
  'Admin: approve, fund credit/debit, ROI run, history, mark paid, user tools',
];
checklist.forEach((c, i) => {
  doc.fillColor('#e2e8f0').font('Helvetica').fontSize(8).text('✓  ' + c, 60, 520 + i * 16, { width: 475 });
});

safeImage(planImg, 170, 680, { width: 255, height: 100, fit: [255, 100] });

// ===================== PAGE 9 HANDOVER =====================
doc.addPage();
pageBg(SOFT);
headerBar('8. Client handover notes', 'How to use and present this system');
footer(9, TOTAL);

roundedRect(40, 118, 515, 150, 14, WHITE, '#e2e8f0');
doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text('Suggested demo flow for your client', 60, 138);
const demo = [
  '1. Open the live site and show landing, plan, and certificates.',
  '2. Register a demo member with a sponsor ID and show the new GW ID.',
  '3. Show Deposit page (address/QR + Tx Hash submit).',
  '4. From Admin, approve a deposit and show auto join + fund credit.',
  '5. Show Dashboard balances, referral link, and income report pages.',
  '6. Run Daily ROI (or wait for cron) and show ROI + level income path.',
  '7. Show Withdraw request and Admin Mark Paid step.',
];
demo.forEach((d, i) => {
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(d, 60, 165 + i * 14, { width: 475 });
});

roundedRect(40, 290, 250, 175, 12, BLUE);
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('Tech snapshot', 56, 310);
doc
  .fillColor('#e2e8f0')
  .font('Helvetica')
  .fontSize(8)
  .text(
    'Frontend: React (Vite)\nBackend: Express API\nDatabase: MongoDB\nHosting: Vercel (full stack)\nCron: daily ROI at 00:00 UTC\nChain: BSC / USDT BEP-20\nLive: grow-wealth-neon.vercel.app',
    56,
    335,
    { width: 218, lineGap: 3 }
  );

roundedRect(305, 290, 250, 175, 12, TEAL);
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('Good to know', 321, 310);
doc
  .fillColor('#e2e8f0')
  .font('Helvetica')
  .fontSize(8)
  .text(
    'Salary and Fast Track are manual admin credits for now.\nTrading page uses mock prices.\nSupport API exists; reply from admin tools/API.\nAlways use BEP-20 USDT only for deposits and payouts.\nROI never goes past 2x of investment.',
    321,
    335,
    { width: 218, lineGap: 3 }
  );

roundedRect(40, 490, 515, 140, 14, NAVY);
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(13).text('You are ready to present', 60, 515);
doc
  .fillColor(WHITE)
  .font('Helvetica')
  .fontSize(10)
  .text(
    'This PDF is the full feature map of the system you built. Share it with your client so they can see member features, earning rules, admin control, and the live website in one place.',
    60,
    545,
    { width: 475, lineGap: 3 }
  );
doc
  .fillColor(SKY)
  .font('Helvetica-Bold')
  .fontSize(12)
  .text('https://grow-wealth-neon.vercel.app', 60, 595);

doc
  .fillColor('#94a3b8')
  .font('Helvetica-Oblique')
  .fontSize(8)
  .text(
    'This guide is for client understanding of delivered features. Actual earnings depend on deposits, activity, team growth, and plan rules.',
    40,
    670,
    { width: 515, align: 'center' }
  );

doc
  .fillColor(MUTED)
  .font('Helvetica')
  .fontSize(9)
  .text('Thank you for choosing Grow Wealth.', 40, 710, { width: 515, align: 'center' });

doc.end();

stream.on('finish', () => {
  try {
    if (downloadsPath) {
      fs.copyFileSync(outPath, downloadsPath);
      console.log('Saved:', outPath);
      console.log('Copied:', downloadsPath);
    } else {
      console.log('Saved:', outPath);
    }
  } catch (e) {
    console.log('Saved:', outPath);
    console.warn('Download copy skipped:', e.message);
  }
});
