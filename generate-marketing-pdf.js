/**
 * Grow Wealth Client Marketing Brochure (5-6 colorful pages)
 * Explains how to invest and how earnings work in plain language.
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'GrowWealth_Marketing_Guide.pdf');
const downloadsPath = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'Downloads',
  'GrowWealth_Marketing_Guide.pdf'
);

const BLUE = '#1d4ed8';
const SKY = '#0ea5e9';
const NAVY = '#0b1f3a';
const GOLD = '#f59e0b';
const GREEN = '#16a34a';
const ORANGE = '#f97316';
const WHITE = '#ffffff';
const MUTED = '#64748b';
const LIGHT = '#e0f2fe';

const cert1 = path.join(__dirname, 'client/public/certificates/certificate-digital-asset-professional.png');
const cert2 = path.join(__dirname, 'client/public/certificates/certificate-crypto-trader.png');
const planImg = path.join(__dirname, 'client/public/plan.png');

const doc = new PDFDocument({
  size: 'A4',
  margin: 0,
  info: {
    Title: 'Grow Wealth: How to Invest and Earn',
    Author: 'Grow Wealth',
    Subject: 'Simple client guide for USDT BEP-20 staking and team earnings',
  },
});

const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

function pageBg(color = WHITE) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(color);
}

function roundedRect(x, y, w, h, r, fill, stroke) {
  doc.save();
  doc.roundedRect(x, y, w, h, r);
  if (fill) doc.fill(fill);
  if (stroke) doc.strokeColor(stroke).lineWidth(1).stroke();
  doc.restore();
}

function headerBar(title, subtitle) {
  doc.rect(0, 0, 595, 110).fill(NAVY);
  doc.circle(520, 30, 60).fillOpacity(0.12).fill(SKY).fillOpacity(1);
  doc.circle(80, 90, 40).fillOpacity(0.1).fill(ORANGE).fillOpacity(1);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22).text('GROW WEALTH', 40, 28);
  doc.fillColor(SKY).font('Helvetica').fontSize(11).text('USDT on BEP-20 | Staking and Referral Platform', 40, 54);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16).text(title, 40, 78);
  if (subtitle) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(10).text(subtitle, 40, 98, { width: 500 });
  }
}

function footer(pageNo) {
  doc.rect(0, 820, 595, 22).fill(NAVY);
  doc
    .fillColor('#94a3b8')
    .font('Helvetica')
    .fontSize(8)
    .text('grow-wealth-neon.vercel.app  |  Member guide  |  Page ' + pageNo, 40, 826, {
      width: 515,
      align: 'center',
    });
}

function card(x, y, w, h, color, title, body) {
  roundedRect(x, y, w, h, 12, color);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(12).text(title, x + 14, y + 14, { width: w - 28 });
  doc.fillColor('#e2e8f0').font('Helvetica').fontSize(9).text(body, x + 14, y + 36, { width: w - 28, lineGap: 2 });
}

// PAGE 1 COVER
pageBg(NAVY);
doc.circle(480, 120, 140).fillOpacity(0.15).fill(SKY).fillOpacity(1);
doc.circle(80, 700, 120).fillOpacity(0.12).fill(ORANGE).fillOpacity(1);
doc.circle(300, 400, 200).fillOpacity(0.08).fill(BLUE).fillOpacity(1);

doc.fillColor(SKY).font('Helvetica-Bold').fontSize(12).text('A SIMPLE GUIDE FOR MEMBERS', 50, 90, {
  align: 'center',
  width: 495,
});
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(42).text('GROW', 50, 140, { align: 'center', width: 495 });
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(42).text('WEALTH', 50, 188, { align: 'center', width: 495 });
doc
  .fillColor('#cbd5e1')
  .font('Helvetica')
  .fontSize(14)
  .text('Learn how to invest, earn daily returns, and grow with your team', 50, 250, {
    align: 'center',
    width: 495,
  });

roundedRect(90, 300, 415, 70, 16, '#102a4a');
doc
  .fillColor(WHITE)
  .font('Helvetica-Bold')
  .fontSize(12)
  .text('Start with just $1. Earn 1% daily. Grow with your team.', 100, 328, {
    width: 395,
    align: 'center',
  });

const coverCards = [
  { t: 'Join $1', c: GREEN, d: 'Easy to begin' },
  { t: '1% Daily', c: SKY, d: 'Auto ROI credit' },
  { t: '2x Cap', c: ORANGE, d: 'Clear ROI limit' },
  { t: 'L1 to L7', c: GOLD, d: 'Team rewards' },
];
coverCards.forEach((item, i) => {
  const x = 55 + i * 125;
  roundedRect(x, 420, 115, 90, 14, item.c);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16).text(item.t, x + 8, 442, { width: 99, align: 'center' });
  doc.font('Helvetica').fontSize(9).text(item.d, x + 8, 472, { width: 99, align: 'center' });
});

doc
  .fillColor('#94a3b8')
  .font('Helvetica')
  .fontSize(11)
  .text('You invest with USDT on BNB Smart Chain (BEP-20)', 50, 560, { align: 'center', width: 495 });
doc
  .fillColor(WHITE)
  .font('Helvetica-Bold')
  .fontSize(12)
  .text('Website: https://grow-wealth-neon.vercel.app', 50, 590, { align: 'center', width: 495 });

if (fs.existsSync(cert2)) {
  try {
    doc.image(cert2, 120, 640, { width: 355, height: 140, fit: [355, 140], align: 'center' });
  } catch (_) {
    /* ignore */
  }
}
footer(1);

// PAGE 2
doc.addPage();
pageBg('#f8fafc');
headerBar('1. What is Grow Wealth?', 'A clear way to stake USDT and earn daily income');
footer(2);

doc
  .fillColor(NAVY)
  .font('Helvetica')
  .fontSize(11)
  .text(
    'Grow Wealth is a crypto platform where you deposit USDT on the BEP-20 network, activate your account, and earn every day. You can also invite friends with your referral link and earn from your team.',
    40,
    130,
    { width: 515, lineGap: 3 }
  );

doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(14).text('Getting started in 4 simple steps', 40, 190);

const steps = [
  {
    n: '01',
    t: 'Create your account',
    d: 'Sign up with your name, mobile, email, password, and BEP-20 wallet. If someone referred you, enter their sponsor ID.',
  },
  {
    n: '02',
    t: 'Deposit USDT',
    d: 'Send USDT on BEP-20 (BSC) to the company address or QR. Then submit your Tx Hash. Admin checks it and adds fund to your account.',
  },
  {
    n: '03',
    t: 'You get joined automatically',
    d: 'After a payment of $1 or more is approved, your status becomes Joined. No extra click needed. ROI and withdraw unlock from here.',
  },
  {
    n: '04',
    t: 'Earn and withdraw',
    d: 'Get 1% daily ROI on autopilot. Grow more with Direct and Level income. Withdraw to the wallet saved in your profile.',
  },
];
steps.forEach((s, i) => {
  const y = 220 + i * 95;
  roundedRect(40, y, 515, 85, 14, WHITE, '#dbeafe');
  doc.circle(75, y + 42, 24).fill(i % 2 === 0 ? BLUE : SKY);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(12).text(s.n, 63, y + 35);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text(s.t, 115, y + 18);
  doc.fillColor(MUTED).font('Helvetica').fontSize(10).text(s.d, 115, y + 40, { width: 420, lineGap: 2 });
});

// PAGE 3
doc.addPage();
pageBg('#f8fafc');
headerBar('2. How you make money', 'Four ways your balance can grow');
footer(3);

const incomes = [
  {
    title: 'A) Daily ROI (1%)',
    color: BLUE,
    lines: [
      'You get 1% credited every day, all 7 days of the week.',
      'It is based on your deposit or joining amount.',
      'Total ROI stops when you reach 2 times your investment.',
      'Example: if you stake $100, you get about $1 each day until $200 total ROI.',
    ],
  },
  {
    title: 'B) Direct Income (5%)',
    color: GREEN,
    lines: [
      'When a new member joins under your ID, you earn 5%.',
      'This is paid on the joining amount (minimum $1).',
      'Example: one direct join can give you $0.05.',
      'More direct members means more direct income.',
    ],
  },
  {
    title: 'C) Level Income L1 to L7 (ROI ka ROI)',
    color: ORANGE,
    lines: [
      'When someone in your team receives daily ROI, you can earn a share of that ROI.',
      'Each level unlocks after your own ROI reaches that level target.',
      'Rates: L1 10%, L2 12%, L3 15%, L4 17%, L5 20%, L6 23%, L7 25%.',
      'So you earn from your own stake and from team growth together.',
    ],
  },
  {
    title: 'D) Manual Compound',
    color: SKY,
    lines: [
      'You can move money from income balance back into fund balance.',
      'That increases the base used for your daily ROI.',
      'Compounding is manual. You decide when to do it.',
      'This helps you grow your stake over time.',
    ],
  },
];
incomes.forEach((block, i) => {
  const y = 125 + i * 155;
  roundedRect(40, y, 515, 145, 14, WHITE, '#e2e8f0');
  doc.rect(40, y, 8, 145).fill(block.color);
  doc.fillColor(block.color).font('Helvetica-Bold').fontSize(13).text(block.title, 60, y + 14);
  block.lines.forEach((line, li) => {
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text('•  ' + line, 60, y + 40 + li * 22, { width: 475 });
  });
});

// PAGE 4
doc.addPage();
pageBg('#f8fafc');
headerBar('3. Team level rewards', 'Unlock each level with your ROI target, then earn from team ROI');
footer(4);

doc
  .fillColor(NAVY)
  .font('Helvetica')
  .fontSize(10)
  .text(
    'Before you earn from a level, your own total ROI should reach that level target. After that, you earn the level % from your downline daily ROI.',
    40,
    125,
    { width: 515 }
  );

const levels = [
  ['Level', 'Your share', 'Your ROI target'],
  ['L-1', '10%', '$500'],
  ['L-2', '12%', '$1,000'],
  ['L-3', '15%', '$1,500'],
  ['L-4', '17%', '$2,500'],
  ['L-5', '20%', '$4,000'],
  ['L-6', '23%', '$7,500'],
  ['L-7', '25%', 'No target'],
];
const colW = [120, 160, 180];
const startX = 70;
let ty = 165;
levels.forEach((row, ri) => {
  const bg = ri === 0 ? NAVY : ri % 2 === 0 ? LIGHT : WHITE;
  doc.roundedRect(startX, ty, 460, 32, 6).fill(bg);
  let x = startX + 12;
  row.forEach((cell, ci) => {
    doc
      .fillColor(ri === 0 ? WHITE : NAVY)
      .font(ri === 0 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(11)
      .text(cell, x, ty + 10, { width: colW[ci] - 10 });
    x += colW[ci];
  });
  ty += 36;
});

roundedRect(40, 480, 515, 150, 14, NAVY);
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(13).text('Easy example', 60, 500);
doc
  .fillColor('#e2e8f0')
  .font('Helvetica')
  .fontSize(10)
  .text(
    'Someone in your team earns $5 ROI today.\n' +
      'If your L-1 is open (your own ROI is $500 or more), you get 10% of $5 = $0.50.\n' +
      'If deeper levels are also open, you can earn from those team levels too.\n' +
      'Your own 1% daily ROI still runs separately on your stake.',
    60,
    525,
    { width: 475, lineGap: 4 }
  );

doc
  .fillColor(MUTED)
  .font('Helvetica-Oblique')
  .fontSize(9)
  .text('Note: Your personal ROI cannot go beyond 2 times your investment.', 40, 660, { width: 515 });

if (fs.existsSync(planImg)) {
  try {
    doc.image(planImg, 150, 685, { width: 295, height: 120, fit: [295, 120] });
  } catch (_) {
    /* ignore */
  }
}

// PAGE 5
doc.addPage();
pageBg('#f8fafc');
headerBar('4. Deposit, withdraw, and key rules', 'How money comes in and how you take it out');
footer(5);

card(
  40,
  130,
  250,
  160,
  BLUE,
  'Deposit rules',
  '• Use USDT only\n• Network must be BEP-20 / BSC\n• Min $1 to join\n• Submit Tx Hash after sending\n• Admin checks the real on-chain amount\n• Wrong network can mean lost funds'
);
card(
  305,
  130,
  250,
  160,
  GREEN,
  'Withdraw rules',
  '• Minimum withdraw is $10\n• Fee is 10% on every withdraw\n• Amount goes to your saved BEP-20 wallet\n• You must be Joined first\n• Admin processes the payout\n• Withdraw from income balance'
);

roundedRect(40, 310, 515, 130, 14, WHITE, '#fed7aa');
doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(13).text('Quick plan snapshot', 60, 328);
doc
  .fillColor(MUTED)
  .font('Helvetica')
  .fontSize(10)
  .text(
    'Join from $1. Daily ROI 1% every day. ROI cap is 2x. Compound is manual. Direct income is 5%. Level income is L1 to L7. Withdraw minimum is $10 with 10% fee. Network is USDT on BEP-20.',
    60,
    355,
    { width: 475, lineGap: 3 }
  );

roundedRect(40, 460, 515, 200, 14, NAVY);
doc.fillColor(SKY).font('Helvetica-Bold').fontSize(13).text('Helpful tips before you start', 60, 480);
const tips = [
  'Send USDT only on BEP-20 (BSC). Do not use ERC-20 or TRC-20 for this address.',
  'Check your wallet address carefully before you request a withdraw.',
  'Keep your Transaction Password private.',
  'Remember the 2x ROI cap when you plan withdraws and compounding.',
  'Use only the official site: grow-wealth-neon.vercel.app',
];
tips.forEach((t, i) => {
  doc
    .fillColor('#e2e8f0')
    .font('Helvetica')
    .fontSize(10)
    .text(i + 1 + '.  ' + t, 60, 510 + i * 26, { width: 475 });
});

// PAGE 6
doc.addPage();
pageBg('#f8fafc');
headerBar('5. Trust signals and your next step', 'Certificates, support, and how to begin today');
footer(6);

doc
  .fillColor(NAVY)
  .font('Helvetica')
  .fontSize(11)
  .text(
    'We keep the plan open and easy to read, so you can understand the earning structure before you join. Below are platform certificate visuals and your next steps.',
    40,
    125,
    { width: 515 }
  );

if (fs.existsSync(cert1)) {
  try {
    doc.image(cert1, 40, 160, { width: 250, height: 170, fit: [250, 170] });
  } catch (_) {
    /* ignore */
  }
}
if (fs.existsSync(cert2)) {
  try {
    doc.image(cert2, 305, 160, { width: 250, height: 170, fit: [250, 170] });
  } catch (_) {
    /* ignore */
  }
}

doc.fillColor(MUTED).font('Helvetica').fontSize(9).text('Digital Asset Professional', 40, 340, {
  width: 250,
  align: 'center',
});
doc.text('Certified Crypto Trader', 305, 340, { width: 250, align: 'center' });

roundedRect(40, 380, 515, 180, 16, NAVY);
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(16).text('Want to begin?', 60, 410);
doc
  .fillColor(WHITE)
  .font('Helvetica')
  .fontSize(11)
  .text(
    '1) Open the website\n2) Create your free account\n3) Deposit USDT on BEP-20\n4) Get joined automatically from $1\n5) Start earning daily ROI and build your team',
    60,
    445,
    { lineGap: 4 }
  );
doc.fillColor(SKY).font('Helvetica-Bold').fontSize(13).text('https://grow-wealth-neon.vercel.app', 60, 560);

roundedRect(40, 580, 515, 90, 14, WHITE, '#bfdbfe');
doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(12).text('Need help?', 60, 600);
doc
  .fillColor(MUTED)
  .font('Helvetica')
  .fontSize(10)
  .text(
    'After login, open Support Ticket in your member panel. Keep your User ID ready so we can help you faster.',
    60,
    625,
    { width: 475 }
  );

doc
  .fillColor('#94a3b8')
  .font('Helvetica-Oblique')
  .fontSize(8)
  .text(
    'This guide is for education. Results depend on your activity, team growth, and plan rules. Invest only what you can comfortably afford.',
    40,
    700,
    { width: 515, align: 'center' }
  );

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
