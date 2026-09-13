require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const https = require('https');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

function rpc(method, params) {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'bsc-dataseed.binance.org',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function onChainUsdtAmount(txHash) {
  if (!txHash || !txHash.startsWith('0x')) return null;
  const j = await rpc('eth_getTransactionReceipt', [txHash]);
  const logs = (j.result && j.result.logs) || [];
  const topic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const usdt = '0x55d398326f99059ff775485246999027b3197955';
  for (const log of logs) {
    if ((log.address || '').toLowerCase() !== usdt) continue;
    if ((log.topics || [])[0] !== topic) continue;
    const raw = BigInt(log.data);
    return Number(raw) / 1e18;
  }
  return null;
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const deposits = await Transaction.find({
    type: 'deposit',
    status: 'success',
    'meta.txHash': { $exists: true, $ne: '' },
  }).sort({ createdAt: -1 });

  const fixes = [];
  for (const dep of deposits) {
    const chainAmt = await onChainUsdtAmount(dep.meta.txHash);
    if (chainAmt == null) continue;
    const recorded = Number(dep.amount);
    if (Math.abs(recorded - chainAmt) < 0.0001) continue;

    const user = await User.findOne({ userId: dep.userId });
    if (!user) continue;

    const delta = recorded - chainAmt;
    console.log('MISMATCH', {
      userId: dep.userId,
      name: user.name,
      recorded,
      chainAmt,
      fundBefore: user.fundBalance,
      totalDepBefore: user.totalDeposited,
    });

    // Correct deposit tx
    dep.amount = chainAmt;
    dep.description = `USDT deposit corrected to on-chain $${chainAmt} (was $${recorded})`;
    dep.meta = {
      ...(dep.meta || {}),
      correctedFrom: recorded,
      correctedTo: chainAmt,
      correctedAt: new Date(),
      correctionReason: 'amount mismatched on-chain USDT transfer',
    };
    await dep.save();

    // Correct user balances
    user.fundBalance = Number(Math.max(0, (user.fundBalance || 0) - delta).toFixed(8));
    user.totalDeposited = Number(Math.max(0, (user.totalDeposited || 0) - delta).toFixed(8));
    user.usdtBep20Balance = Number(Math.max(0, (user.usdtBep20Balance || 0) - delta).toFixed(8));
    await user.save();

    await Transaction.create({
      userId: user.userId,
      type: 'admin_debit',
      amount: delta,
      balanceAfter: user.fundBalance,
      status: 'success',
      description: `Balance correction: deposit was $${recorded} but on-chain was $${chainAmt}`,
      meta: { depositId: dep._id, txHash: dep.meta.txHash, recorded, chainAmt },
      createdBy: 'system-correction',
    });

    fixes.push({
      userId: user.userId,
      name: user.name,
      recorded,
      chainAmt,
      fundAfter: user.fundBalance,
      totalDepAfter: user.totalDeposited,
    });
  }

  console.log('\nFIXED', JSON.stringify(fixes, null, 2));

  // Show Pankaj after
  const p = await User.findOne({ userId: 'GW8656884' }).select('name fundBalance totalDeposited isJoined');
  console.log('Pankaj after:', p);

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
