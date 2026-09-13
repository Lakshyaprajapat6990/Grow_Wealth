const https = require('https');

const USDT_BEP20 = '0x55d398326f99059ff775485246999027b3197955';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function rpc(method, params) {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'bsc-dataseed.binance.org',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 12000,
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('BSC RPC timeout'));
    });
    req.write(body);
    req.end();
  });
}

/**
 * Read USDT (BEP-20) transfer amount from a tx hash.
 * Returns { amount, from, to } or null if not found / RPC fail.
 */
async function getUsdtTransferFromTx(txHash, expectedTo = '') {
  if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) return null;
  try {
    const j = await rpc('eth_getTransactionReceipt', [txHash.trim()]);
    if (!j.result) return null;
    const wantTo = String(expectedTo || '').toLowerCase();
    for (const log of j.result.logs || []) {
      if ((log.address || '').toLowerCase() !== USDT_BEP20) continue;
      if ((log.topics || [])[0] !== TRANSFER_TOPIC) continue;
      const from = `0x${log.topics[1].slice(26)}`;
      const to = `0x${log.topics[2].slice(26)}`;
      if (wantTo && to.toLowerCase() !== wantTo) continue;
      const amount = Number(BigInt(log.data)) / 1e18;
      return { amount: Number(amount.toFixed(8)), from, to, txHash: txHash.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { getUsdtTransferFromTx, USDT_BEP20 };
