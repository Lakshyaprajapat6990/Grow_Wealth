/**
 * Grow Wealth - System Understanding Document (PDF)
 * Reference analysis: https://worldfinance24.online/ | Product brand: Grow Wealth
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'GrowWealth_System_Understanding.pdf');
const doc = new PDFDocument({
  margin: 50,
  size: 'A4',
  info: {
    Title: 'Grow Wealth – System Understanding & Build Spec',
    Author: 'Project Analysis',
    Subject: 'Feature / UI / Business logic documentation for Grow Wealth (reference: World Finance 24)',
  },
});

doc.pipe(fs.createWriteStream(outPath));

const GOLD = '#b8860b';
const DARK = '#0b101e';
const GRAY = '#444444';
const MUTED = '#666666';

function hr() {
  doc.moveDown(0.3);
  doc.strokeColor('#d4af37').lineWidth(1)
    .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.6);
}

function ensureSpace(need = 80) {
  if (doc.y > 770 - need) doc.addPage();
}

function h1(text) {
  ensureSpace(60);
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(16).text(text, { underline: false });
  doc.moveDown(0.35);
  doc.strokeColor(GOLD).lineWidth(2).moveTo(50, doc.y).lineTo(180, doc.y).stroke();
  doc.moveDown(0.55);
}

function h2(text) {
  ensureSpace(50);
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(12).text(text);
  doc.moveDown(0.35);
}

function p(text) {
  ensureSpace(40);
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(text, { align: 'justify', lineGap: 2 });
  doc.moveDown(0.45);
}

function bullet(text) {
  ensureSpace(28);
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text('•  ' + text, { indent: 8, lineGap: 1 });
  doc.moveDown(0.2);
}

function table(headers, rows, colWidths) {
  ensureSpace(40 + rows.length * 16);
  const startX = 50;
  const rowH = 16;
  const y0 = doc.y;
  let x = startX;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK);
  headers.forEach((h, i) => {
    doc.text(h, x, y0, { width: colWidths[i] });
    x += colWidths[i];
  });
  doc.y = y0 + rowH;
  doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8).fillColor(GRAY);
  rows.forEach((row) => {
    ensureSpace(20);
    const y = doc.y;
    let xx = startX;
    row.forEach((cell, i) => {
      doc.text(String(cell), xx, y, { width: colWidths[i] });
      xx += colWidths[i];
    });
    doc.y = y + rowH;
  });
  doc.moveDown(0.5);
}

// ===================== COVER =====================
doc.rect(0, 0, 595, 842).fill(DARK);
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(28)
  .text('GROW WEALTH', 50, 220, { align: 'center' });
doc.fillColor('#ffffff').font('Helvetica').fontSize(14)
  .text('System Understanding Document', { align: 'center' });
doc.moveDown(1);
doc.fillColor('#e4c568').fontSize(11)
  .text('Product Build Spec (Reference UI: World Finance 24)', { align: 'center' });
doc.moveDown(2);
doc.fillColor('#aaaaaa').fontSize(10)
  .text('Product name: Grow Wealth', { align: 'center' });
doc.text('Reference URL: https://worldfinance24.online/', { align: 'center' });
doc.text('Dashboard: https://worldfinance24.online/dashboard', { align: 'center' });
doc.moveDown(1);
doc.text('Prepared: 21 August 2026', { align: 'center' });
doc.text('Purpose: Document features, UI, flows & client business rules', { align: 'center' });
doc.moveDown(3);
doc.fillColor('#888888').fontSize(8)
  .text('Based on live reference-site analysis + client-confirmed product rules for Grow Wealth.', 70, 700, { align: 'center', width: 455 });

doc.addPage();

// ===================== TOC =====================
h1('1. Document Overview');
p('Product brand for this build is Grow Wealth. The client shared World Finance 24 (worldfinance24.online) as the UI/feature reference. This PDF captures the reference system plus Grow Wealth client rules (joining, ROI, wallet, database, brand).');
h2('What Grow Wealth is');
p('Grow Wealth is a web-based crypto investment / MLM platform (inspired by the reference site). Users register under a sponsor, deposit USDT on Binance Smart Chain (BEP-20) via crypto wallet, activate with $1 joining, earn 2% ROI (24/7, credited manually by admin) plus network incomes, and withdraw to their USDT wallet. Admin panel manages users, deposits, withdrawals, ROI credit, and settings.');
h2('Tech stack');
bullet('Frontend target: React SPA (Vite), dark/gold-style theme similar to reference');
bullet('Backend target: Node.js REST API + JWT auth');
bullet('Blockchain: BSC / USDT BEP-20 (Connect Wallet + Address/QR)');
bullet('Auth: User ID + password; Transaction Password for fund actions; Admin portal');
bullet('Database (client): MongoDB Atlas — MONGODB_URI in .env (db name: growwealth)');
bullet('Product name everywhere in UI: Grow Wealth');

hr();
h1('1A. CLIENT CONFIRMED RULES (Grow Wealth)');
p('These rules override the reference site package minimums and ROI marketing. Build Grow Wealth according to this:');
bullet('PRODUCT NAME = Grow Wealth');
bullet('JOINING AMOUNT = $1 ONLY (minimum activation / ID activation starts at $1)');
bullet('After joining with $1, user can deposit ANY amount they want (no upper lock to fixed package-only top-ups unless client adds caps later)');
bullet('Marketing / ROI = 2% (NOT the reference site 5%)');
bullet('ROI timing = 24/7 (no restricted ROI window)');
bullet('ROI credit mode = MANUALLY by Admin (not auto cron) — admin credits 2% ROI when due / as per operations');
bullet('WITHDRAWAL: First withdrawal minimum = $10; after first successful withdrawal, user can withdraw ANY amount');
bullet('PAYMENT METHOD = CRYPTO WALLET (USDT on BEP-20 / BSC) — MetaMask, Trust Wallet, TokenPocket, WalletConnect, etc.');
bullet('Wallet UX = OPTION C (BOTH): (1) Connect Wallet in-app pay + (2) Deposit address + QR for manual send from any wallet app');
bullet('Deposit & Withdraw both via user crypto wallet (not bank / UPI / fiat gateway)');
bullet('User must connect or save their BEP-20 wallet address; deposits sent as USDT (BEP-20); withdrawals paid to same/saved wallet');
bullet('Database = MongoDB Atlas (db: growwealth)');
bullet('Reference site used SAVING packages from $2 / landing from $10 / FAQ $30 / 5% daily — DO NOT copy those for Grow Wealth');
bullet('Recommended flow: Register → Connect Wallet and/or Deposit Address+QR → Deposit USDT ≥ $1 → Activate Joining ($1) → Further deposits anytime → Admin credits 2% ROI (24/7 manual) → Withdraw to crypto wallet');

hr();
h1('2. Branding & UI Design Language');
bullet('Brand (OUR PRODUCT): Grow Wealth — use this name on logo, title, emails, PDF, admin, landing');
bullet('Reference brand only: WORLD FINANCE24 (gold accent) — for layout inspiration, not final naming');
bullet('Primary palette target: deep navy/black backgrounds (#0b101e, #131927), gold accents (#e4c568 / #d4af37), green for positive money (#00ff88 / emerald)');
bullet('Landing: glass header, gold gradient text, dark cards, package/joining info, FAQ accordion, CTA');
bullet('Member area: left sidebar navigation (grouped sections), dark panels, metric cards, tables/lists for incomes & history');
bullet('Admin area: light theme sidebar (~260px), indigo active states, sectioned menus (Users, Security, Finance, etc.)');
bullet('Responsive: mobile-first grids (2-col cards), hamburger/drawer admin nav');

hr();
h1('3. Public / Marketing Website');
h2('Pages & navigation');
bullet('Home (/) – Hero, Ecosystem, How it works (3 steps), Packages, FAQ, CTA');
bullet('Login (/login) – Member login with User ID + Password + Forgot Password');
bullet('Register (/register) – Sponsor ID, personal details, country, BEP-20 wallet, terms');
bullet('Forgot / Reset password routes');
bullet('FAQ (/faq) and Community Access pages also exist in router');

h2('Landing value proposition (marketing copy)');
bullet('Claims deposits power HFT crypto trading + arbitrage + liquidity pooling');
bullet('Guaranteed 5% Daily ROI marketing message (REFERENCE site only — Grow Wealth uses 2% ROI, 24/7, Manual)');
bullet('3 steps: Deposit USDT (BEP-20) → Activate Package → Earn & Withdraw');

h2('Landing package table (marketing)');
table(
  ['#', 'Amount', 'Cycle', 'Daily ROI', 'Total Return'],
  [
    ['1', '$10', '25 Days', '5%', '$12.50'],
    ['2', '$50', '25 Days', '5%', '$62.50'],
    ['3', '$100', '25 Days', '5%', '$125.00'],
    ['4', '$250', '25 Days', '5%', '$312.50'],
    ['5', '$500', '25 Days', '5%', '$625.00'],
    ['6', '$1,000', '25 Days', '5%', '$1,250.00'],
  ],
  [40, 90, 90, 90, 120]
);
p('REFERENCE ONLY (World Finance 24): FAQ ~$30 min upgrade; SAVING from $2. GROW WEALTH (client): Joining $1 only; after that deposits flexible / any amount.');

h2('Landing FAQ highlights');
bullet('Platform: decentralized crypto investment + daily ROI + referral bonuses');
bullet('Activation: deposit USDT BEP-20, then activate package from dashboard');
bullet('ROI: reference site = 5% daily auto | GROW WEALTH = 2% ROI · 24/7 · Manually by Admin');
bullet('Withdrawals (landing FAQ): daily 10:00 AM – 12:00 PM IST; min ~$1–$2; active package required');

doc.addPage();
h1('4. Authentication & User Account');
h2('Registration fields (required)');
bullet('Sponsor ID (validated via API /auth/check-sponsor/:sponsorId)');
bullet('Name, Email, Mobile, Password, Confirm Password');
bullet('Country selector');
bullet('USDT BEP-20 Wallet Address (mandatory)');
bullet('Agree to Terms of Service');
bullet('On success: system returns generated User ID (format like WF#######) + Transaction Password (also emailed)');

h2('Login');
bullet('Credentials: User ID + Password → JWT token');
bullet('Sample analyzed member: WF7832865 (role: user), sponsor WF5678089');
bullet('Forgot password + reset-password/:token flows present');

h2('User profile data model (key fields)');
bullet('Identity: userId, name, email, mobile, role, sponsorId, createdAt, country');
bullet('Wallet: walletAddress + change history/limits; walletBalance; usdtBep20Balance');
bullet('Income buckets: directIncome, levelIncome, roiIncome, rewardIncome, fastTrackIncome, poolIncome (+ total* lifetime counters)');
bullet('Package state: isToppedUp, topUpAmount, packages[], activePools[]');
bullet('Network: directCount, globalTeamCount');
bullet('Flags: isTelegramJoined, pendingWithdrawals, totalWithdrawn, totalEarnings');

hr();
h1('5. Member Dashboard – Navigation Map');
p('Authenticated layout uses a grouped left sidebar. Exact menu structure rebuilt from frontend:');

h2('Main Menu');
bullet('Dashboard (/dashboard)');
bullet('System Live Feed (/system-live-feed) – live deposit/investment ticker + totals');
bullet('Live Trading (/user/trading) – market symbols / trading UI feed');
bullet('My Profile (/profile)');
bullet('Package Details (/topup-details)');
bullet('My Packages (/my-packages)');

h2('Network & History');
bullet('Deposit History (/deposit-history)');
bullet('Direct Team (/direct-team)');
bullet('Level Team / All Team (/all-team)');

h2('Income Reports');
bullet('Daily ROI Income (/roi-income)');
bullet('Direct Income (/direct-income)');
bullet('Daily Level Income (/level-income)');
bullet('Monthly Salary (/salary-income)');

h2('Financials & Support');
bullet('Wallet History (/wallet-history)');
bullet('Withdrawals (/withdrawals)');
bullet('Support and Raise Ticket (/support)');

h2('Additional member routes present in app');
bullet('Credit to Wallet (/credit-to-wallet), My Transfers (/my-transfers)');
bullet('Notifications (/notifications)');
bullet('Staking Program (/staking-program) + staking income pages');
bullet('Community Income / Global Community / Community Access');
bullet('Downline Business, Fast Track Income, Transaction Details');

doc.addPage();
h1('6. Core Business Flow (How the product works)');
h2('End-to-end user journey (GROW WEALTH)');
bullet('1) Register under a sponsor and set BEP-20 withdrawal wallet');
bullet('2) Login → Dashboard shows balances & status (joined / not joined)');
bullet('3) Deposit USDT BEP-20 (minimum needed for joining = $1; user may deposit more anytime)');
bullet('4) Activate Joining with $1 only → ID becomes active');
bullet('5) After joining: user can deposit / top-up any amount as they wish');
bullet('6) ROI 2% credited MANUALLY by Admin (available 24/7 — no auto cron required for v1)');
bullet('7) Build team → Direct / Level / Fast Track / Salary / Community incomes');
bullet('8) Withdraw income to USDT wallet (trx password; active joining required)');
bullet('9) Optional P2P fund transfer to another User ID');

h2('Joining & Deposit rule (CLIENT CONFIRMED — Grow Wealth)');
table(
  ['Rule', 'Value'],
  [
    ['Product name', 'Grow Wealth'],
    ['Joining / Activation amount', '$1 ONLY'],
    ['After joining – further deposit', 'Any amount (flexible)'],
    ['ROI rate', '2%'],
    ['ROI availability', '24/7'],
    ['ROI credit mode', 'Manually by Admin'],
    ['First withdrawal minimum', '$10'],
    ['After first withdrawal', 'Any amount'],
    ['Payment method', 'Crypto Wallet only'],
    ['Wallet UX mode', 'C = Connect Wallet + Address/QR'],
    ['Currency / Network', 'USDT BEP-20 (BSC)'],
    ['Database', 'MongoDB Atlas (growwealth)'],
    ['Supported wallets (typical)', 'MetaMask, Trust, TokenPocket, WC'],
    ['Purpose of $1', 'ID activation / market entry'],
  ],
  [220, 250]
);
p('Crypto Wallet flow (OPTION C – BOTH): (1) Connect Wallet (MetaMask / WalletConnect) and pay USDT in-app. (2) Also show unique deposit address + QR so user can send from Trust Wallet or any external wallet app. (3) On-chain USDT received → balance credited. (4) Withdrawals sent back to user’s crypto wallet on BSC. No fiat rails in v1 unless client asks later.');
p('Grow Wealth ROI: 2% · 24/7 · Manual admin credit (not automatic). Reference site 5%/day auto packages are NOT our model.');

h2('Crypto Wallet UX (CONFIRMED = Option C)');
bullet('Mode A: Connect Wallet button (WalletConnect / MetaMask) on deposit screen — in-app USDT transfer');
bullet('Mode B: Show unique deposit address + QR — user pays from any crypto wallet app');
bullet('Both modes available on the same Deposit page (tabs or side-by-side)');
bullet('Network guard: only BEP-20 / BSC — show “Wrong Network” if user is on Ethereum/TRC20');
bullet('Copy address, view on BscScan, deposit history with tx hash');
bullet('Withdraw to saved / connected wallet address with Transaction Password confirmation');
bullet('Admin: deposit watcher + manual verify fallback + withdrawal approve/payout');

h2('Reference site SAVING packages (for comparison only – NOT our joining rule)');
p('Live reference UI packages (roi $ = 5% of price / day). Do not use $2 as our minimum joining:');
table(
  ['Package', 'Price $', 'Daily ROI $', 'Days', 'Total Profit $'],
  [
    ['SAVING 1', '2', '0.10', '25', '2.50'],
    ['SAVING 2', '5', '0.25', '25', '6.25'],
    ['SAVING 3', '10', '0.50', '25', '12.50'],
    ['SAVING 4', '20', '1.00', '25', '25.00'],
    ['SAVING 5', '50', '2.50', '25', '62.50'],
    ['SAVING 6', '100', '5.00', '25', '125.00'],
    ['SAVING 7', '200', '10.00', '25', '250.00'],
    ['SAVING 8', '500', '25.00', '25', '625.00'],
    ['SAVING 9', '1000', '50.00', '25', '1250.00'],
  ],
  [90, 70, 90, 60, 100]
);

h2('Deposit module');
bullet('User requests deposit address; UI supports Copy Address + QR');
bullet('Network: USDT BEP-20 only (Wrong Network warnings exist)');
bullet('Verification endpoint: /deposit/verify-deposit');
bullet('Live feed aggregates platform deposits (sample live stats seen: ~$129,710 grand investment)');
bullet('Deposit history page lists user deposits / status / tx hash (BscScan link)');

h2('Wallets & balances');
bullet('Fund / Top-up Wallet (for activating packages & transfers)');
bullet('Income / Withdrawable balances (ROI, Direct, Level, etc. combined view)');
bullet('USDT BEP20 wallet balance');
bullet('CCT balance (staking token)');
bullet('Wallet History audit of credits/debits');

h2('Fund Transfer (P2P)');
bullet('Transfer from Available Fund Balance to another User ID');
bullet('Quick amount chips: $1, $5, $10, $20, $50');
bullet('Requires Transaction Password');
bullet('Rules shown: Min $1; irreversible; active package upgrade required');

h2('Withdrawals (GROW WEALTH – client confirmed)');
bullet('User requests withdrawal of withdrawable income to saved BEP-20 address');
bullet('Confirmation modal + Transaction Password');
bullet('FIRST withdrawal: minimum $10 required');
bullet('AFTER first successful withdrawal: user can withdraw ANY amount (no higher min)');
bullet('Track flag on user: hasCompletedFirstWithdrawal (or totalWithdrawn / withdrawalCount > 0)');
bullet('Admin approves/pays withdrawals to crypto wallet');
bullet('Reference site time windows (10 AM–12 PM) are NOT required unless client adds later');

doc.addPage();
h1('7. Income / MLM Modules');
h2('A) ROI Income (Grow Wealth)');
bullet('REFERENCE site: ~5%/day automatic package ROI');
bullet('GROW WEALTH (client confirmed): ROI = 2%');
bullet('Availability: 24/7 (no time-window restriction for ROI operations)');
bullet('Credit mode: MANUALLY by Admin from Admin Panel (select user / batch → credit 2% ROI)');
bullet('Member sees ROI history on /roi-income after admin credits');
bullet('No automatic ROI cron required for v1 (optional later if client wants automation)');

h2('B) Direct Income');
bullet('Commission from direct referrals’ business');
bullet('Report page: /direct-income');
bullet('Admin also has Direct Income management views');

h2('C) Level / Community Level Income');
bullet('Multi-level team income based on downline structure');
bullet('All Team report shows level-wise counts');
bullet('Report page: /level-income');

h2('D) Fast Track Offer (special promotion)');
bullet('Must complete minimum 6 direct referrals within 6 days of ID activation');
bullet('Rewards (paid for 10 days):');
bullet('   6 directs → $6/day → $60 total');
bullet('   10 directs → $10/day → $100 total');
bullet('   25 directs → $25/day → $250 total');
bullet('   100 directs → $100/day → $1,000 total');
bullet('Admin: Fast Track Report + Fast Track Tracker');

h2('E) Monthly Salary / Reward ladder');
p('Progression levels coded in UI (global team size + required directs unlock daily salary for N days):');
table(
  ['Lvl', 'Global Team', 'Directs', 'Daily $', 'Days', 'Total Earn $'],
  [
    ['1', '20', '1', '1', '10', '10'],
    ['2', '40', '2', '1', '20', '20'],
    ['3', '100', '3', '1', '40', '40'],
    ['4', '200', '4', '1', '80', '80'],
    ['5', '400', '5', '1', '150', '150'],
    ['6', '1600', '6', '1', '200', '200'],
    ['7', '2000', '8', '2', '250', '500'],
    ['8', '3000', '10', '2', '350', '700'],
    ['9', '4000', '12', '2', '500', '1000'],
    ['10', '5000', '14', '3', '500', '1500'],
    ['11', '7500', '16', '6', '500', '3000'],
    ['12', '10000', '18', '10', '500', '5000'],
  ],
  [40, 80, 60, 60, 50, 80]
);
p('API: /user/salary-progress/:userId returns qualification flags (hasSelf50, l1/l2 counts, months paid, etc.).');

h2('F) Profit distribution messaging (community docs)');
bullet('Mentioned split style: Direct & Level Income; 5% Rewards & Recognition; 70% Community Building & Fast Track');
bullet('Exact commission % tables for each level should be confirmed with client (not fully exposed as static % table in public UI)');

h2('G) Team / Genealogy');
bullet('Direct Team list');
bullet('All Team / Level Team with level-wise counts');
bullet('Downline business reports');
bullet('Tree view endpoints: /user/tree/:userId');
bullet('Referral link / copy User ID tools');

doc.addPage();
h1('8. CCT Airdrop & Staking Program');
p('Separate module from USDT packages. Member staking page shows:');
bullet('Available USDT BEP20 Balance');
bullet('Available CCT');
bullet('Total Staked / Total Staking Income');
bullet('Staking Direct Income & Staking Level Income');
bullet('Progress bar: Earned vs Max Cap when staked');
bullet('Actions observed: BUY, Convert ($→CCT), Stake/Reinvest Compound, CCT Transfer, Withdraw staking');
bullet('APIs: /staking/stats, /staking/convert, /staking/reinvest-compound, /staking/cct-transfer, /staking/withdraw');
bullet('Marketing mention: ~10% direct staking rewards (confirm exact staking ROI schedule with client)');
bullet('Community roadmap text: CC Token planned ~2027, CMC/DEX listing vision');

hr();
h1('9. Support, Notifications, Live Features');
bullet('Support tickets: create, list own tickets, admin reply/status/soft-delete');
bullet('Notifications: user list + mark-read; admin create/broadcast');
bullet('System Live Feed: scrolling/real-time style deposit feed + today/total investment stats');
bullet('Live Trading page: large symbol list (BTCUSDT, ETHUSDT, many pairs) + price hooks');
bullet('Device fingerprinting library present (anti-fraud / multi-account control)');

hr();
h1('10. Admin Super Panel (/super-panal)');
p('Hidden/secure admin portal (community-access key gate + admin login). Major modules:');

h2('Users');
bullet('Dashboard overview');
bullet('All Users (search/pagination)');
bullet('User Address History');
bullet('Manage Roles & Leaders');
bullet('Change Sponsor (+ history)');
bullet('Blocked Users');
bullet('Add User / Manual verify / Login-as-user capability appears in UI strings');

h2('Security');
bullet('IP Security rules / blocked countries');
bullet('Device Blocks (Fingerprint-based)');
bullet('Login Analytics');

h2('Finance & Growth');
bullet('Top-Ups, Deposit Log, Address Monitor');
bullet('India Boost campaign controls');
bullet('Fast Track Report & Tracker');
bullet('Wallet & Directs stats, Wallet Summary, Wallet Update History');
bullet('Staking Analytics');
bullet('User Fund Overview, Lifetime Tx Report, User Directs (0–18+)');
bullet('Manual Deposit / Credit to Wallet tools');
bullet('Withdrawals queue: list, approve, leader auto-withdraw');
bullet('Transactions + reverse transaction');
bullet('Direct Income / Level Income admin reports');
bullet('Booster offer / reward send');
bullet('Promo video manager');
bullet('System settings toggles: Allow Login, Registrations, Top-Ups, Withdrawals, Wallet Transfers, Credit-to-Wallet, Maintenance Mode, Site Title, Support Email, Whitelist User IDs, Blocked Countries');

doc.addPage();
h1('11. Key API Surface (for developers)');
p('Base URL: https://worldfinance24.online/api');
h2('Auth');
bullet('POST /auth/register, /auth/login, /auth/forgot-password, /auth/reset-password/:token');
bullet('GET /auth/check-sponsor/:sponsorId');
h2('User / Network');
bullet('GET /user/:userId, /user/direct-team/:userId, /user/all-team/:userId, /user/tree/:userId');
bullet('GET /user/downline-business/:userId, /user/salary-progress/:userId');
h2('Wallet / Package / Deposit');
bullet('GET /wallet/info, /wallet/history/:userId, /wallet/topup-history/:userId, /wallet/withdrawals/:userId');
bullet('POST /wallet/transfer, /wallet/withdraw, /wallet/credit-to-wallet');
bullet('POST /package/activate ; GET /package/user/:userId');
bullet('GET /deposit/get-address ; POST /deposit/verify-deposit');
h2('Income transactions');
bullet('GET /transaction/transactions/:userId?type=direct_income|level_income|fast_track|staking_*');
h2('Staking / Market / Support / Community');
bullet('Staking routes under /staking/*');
bullet('GET /market/prices, /market/symbols');
bullet('Support /support/* ; Community /community/global-list');
bullet('Admin namespace /admin/* (large set covering all super-panel features)');

hr();
h1('12. Grow Wealth Scope – What We Need to Build');
h2('Workstreams');
bullet('1) Landing website branded Grow Wealth (Home, Joining info, FAQ, Login/Register)');
bullet('2) Member panel with full sidebar modules listed in Section 5');
bullet('3) Backend: Auth, Users, Sponsors/MLM tree, $1 Joining, Manual 2% ROI credit (admin), Incomes, Wallets, Withdrawals');
bullet('4) BEP-20 USDT deposit watcher + Connect Wallet + Address/QR + BscScan linking');
bullet('5) Admin Super Panel (users, finance, security, settings, approvals)');
bullet('6) Staking/CCT module (if client wants parity with reference)');
bullet('7) Support tickets + notifications + live feed');
bullet('8) Role permissions & system toggles (maintenance, allow withdraw, etc.)');
bullet('9) MongoDB Atlas (growwealth) models & indexes');

hr();
h1('12A. BUILD PHASES (Grow Wealth) — How we build');
p('Recommended delivery order. Each phase is usable / demo-able before the next starts. Stack: React (Vite) frontend + Node/Express API + MongoDB Atlas (growwealth) + USDT BEP-20.');

h2('PHASE 0 — Project foundation (Day 1–2)');
bullet('Monorepo/folder: /client (React) + /server (Node API)');
bullet('Connect MongoDB Atlas growwealth; create base models skeleton');
bullet('Env config (.env): APP_NAME, MONGODB_URI, JWT_SECRET, BSC RPC, USDT contract');
bullet('Grow Wealth branding tokens (colors, logo placeholder, site title)');
bullet('Deliverable: empty apps run locally + DB connected');

h2('PHASE 1 — Auth & member shell (core login)');
bullet('Register (sponsor ID, name, email, mobile, password, country, BEP-20 wallet)');
bullet('Auto User ID (e.g. GW#######) + Transaction Password');
bullet('Login / Forgot password / JWT auth middleware');
bullet('Member layout: sidebar + Dashboard shell + Profile page');
bullet('Admin login + basic Admin layout');
bullet('Deliverable: Register → Login → see Grow Wealth dashboard');

h2('PHASE 2 — Deposit + $1 Joining (money in)');
bullet('Deposit page Option C: Connect Wallet (MetaMask/WC) + Address/QR');
bullet('BSC network guard (Wrong Network warning)');
bullet('Credit USDT deposits to Fund balance (watcher or verify tx)');
bullet('Activate Joining with $1 only; mark user as joined/active');
bullet('After joining: allow any further deposit / top-up amount');
bullet('Deposit history + BscScan tx links');
bullet('Deliverable: User can deposit and activate $1 joining');

h2('PHASE 3 — Manual ROI 2% (admin credit)');
bullet('Admin tool: credit 2% ROI to one user or selected users (24/7 manual)');
bullet('ROI ledger / history on member /roi-income page');
bullet('Income balance updates after admin credit');
bullet('Deliverable: Admin manually pays 2% ROI; member sees it');

h2('PHASE 4 — Withdrawals (money out)');
bullet('Withdraw request to saved/connected crypto wallet');
bullet('Rule: FIRST withdrawal minimum $10; AFTER first success → any amount');
bullet('Transaction Password confirmation');
bullet('Admin approve / reject / mark paid');
bullet('Withdrawal history for member + admin queue');
bullet('Deliverable: Full withdraw cycle with $10-first rule');

h2('PHASE 5 — Wallet extras');
bullet('Wallet history (all credits/debits)');
bullet('P2P Fund Transfer (User ID → User ID) + trx password');
bullet('Credit-to-wallet / internal balance views');
bullet('Deliverable: Transfer + full wallet audit trail');

h2('PHASE 6 — Team / MLM network');
bullet('Referral link + Copy User ID');
bullet('Direct Team + All Team / level-wise counts');
bullet('Direct Income + Level Income reports (after % table confirmed)');
bullet('Deliverable: Network tree + basic referral incomes');

h2('PHASE 7 — Growth incomes (optional / after % confirmed)');
bullet('Fast Track offer module');
bullet('Monthly Salary / reward ladder');
bullet('Community pages if needed');
bullet('Deliverable: Advanced MLM incomes live');

h2('PHASE 8 — Admin Super Panel (operations)');
bullet('All Users, search, block/unblock, change sponsor');
bullet('Deposits log, Address monitor, Top-ups');
bullet('Withdrawals queue, Manual ROI credit, Manual deposit verify');
bullet('System settings toggles (allow login/register/withdraw/transfer)');
bullet('Notifications + Support ticket reply');
bullet('Deliverable: Admin can run the platform day-to-day');

h2('PHASE 9 — Landing website + polish');
bullet('Public Home branded Grow Wealth ($1 join, 2% ROI, crypto wallet CTA)');
bullet('FAQ, Packages/Joining section, Login/Register CTAs');
bullet('Mobile responsive + UI polish matching reference dark/gold style');
bullet('Deliverable: Marketing site ready for demo');

h2('PHASE 10 — Hardening & launch');
bullet('Security: rate limits, validation, trx password checks, IP/device basics');
bullet('UAT checklist with client; fix bugs');
bullet('Deploy frontend + API + confirm MongoDB Atlas network access');
bullet('Optional later: Staking/CCT, Live trading feed, auto ROI cron');
bullet('Deliverable: Production-ready Grow Wealth v1');

h2('Phase priority for MVP (ship first)');
bullet('Must-have MVP = Phase 0 → 1 → 2 → 3 → 4 → 9 (Auth, Deposit, $1 Join, Manual ROI, Withdraw, Landing)');
bullet('Next = Phase 5 → 6 → 8 (Wallet transfer, Team, full Admin)');
bullet('Later = Phase 7 → 10 extras (Fast Track/Salary, staking, hardening)');

h2('Confirmed by client');
bullet('Product name = Grow Wealth');
bullet('Joining amount = $1 only');
bullet('After joining, deposit any amount (flexible top-up)');
bullet('ROI = 2% · 24/7 · Manually by Admin (not auto)');
bullet('Withdrawal: first min $10; after that any amount');
bullet('Payments via Crypto Wallet (USDT BEP-20) — deposit & withdraw');
bullet('Wallet UX = Option C: Connect Wallet (in-app) + Deposit Address/QR (both)');
bullet('Database = MongoDB Atlas (URI in .env; database name growwealth) — never commit credentials');

h2('Still open – confirm before coding');
bullet('Manual ROI base: 2% of which balance — joining only, total deposit, or active investment amount?');
bullet('Exact Direct % and Level % commission table (1..N levels)');
bullet('Withdrawal fee (if any) and whether admin approval is always required');
bullet('Whether Telegram join is mandatory');
bullet('Whether CCT staking is required in v1');
bullet('Deposit architecture: HD wallet per user vs shared hot wallet + memo/tag vs one address per user');
bullet('Admin roles (super admin vs leaders) and payout automation rules');
bullet('Legal/compliance expectations for the target jurisdiction');

hr();
h1('13. Risk / Compliance Note (for client discussion)');
p('The reference product markets ≈5%/day auto; Grow Wealth uses 2% ROI, 24/7, manual admin credit. Still confirm legal structure before public launch.');

hr();
h1('14. Summary');
p('Grow Wealth is the client product brand. It will be a full-stack USDT (BEP-20) investment + MLM platform inspired by World Finance 24: marketing site, member dashboard, multi-income engine, P2P transfers, withdrawals, live feed, support/notifications, and Admin panel.');
p('GROW WEALTH RULES: Brand = Grow Wealth · Joining $1 · flexible deposits · ROI 2% · 24/7 · Manual admin credit · First withdraw min $10 then any amount · Crypto Wallet USDT BEP-20 · Wallet UX Option C · MongoDB Atlas (growwealth).');
p('Build order: Phase 0 foundation → Auth → Deposit+$1 Join → Manual ROI → Withdraw → Wallet/Team → Admin → Landing polish → Launch.');
p('UI/feature reference: https://worldfinance24.online/ and https://worldfinance24.online/dashboard');

doc.moveDown(2);
doc.fillColor(MUTED).fontSize(9)
  .text('— End of System Understanding Document —', { align: 'center' });

doc.end();
console.log('PDF written to', outPath);
