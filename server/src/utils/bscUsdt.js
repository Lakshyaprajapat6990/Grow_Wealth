const https = require('https');

const USDT_BEP20 = '0x55d398326f99059ff775485246999027b3197955';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function rpc(method, params) {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: process.env.BSC_RPC_HOST || 'bsc-dataseed.binance.org',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 15000,
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

function padAddress(addr) {
  return `0x${String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
}

/**
 * Read USDT (BEP-20) transfer amount from a tx hash.
 * Returns { amount, from, to, txHash } or null.
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

/**
 * Scan recent blocks for USDT transfer from → to with amount >= minAmount.
 * No Tx Hash required from the user.
 */
async function findRecentUsdtTransfer({ from, to, minAmount = 10, lookbackBlocks = 8000 } = {}) {
  if (!from || !to) return null;
  try {
    const latestRes = await rpc('eth_blockNumber', []);
    const latest = parseInt(latestRes.result, 16);
    const fromBlock = Math.max(0, latest - lookbackBlocks);
    const topics = [TRANSFER_TOPIC, padAddress(from), padAddress(to)];
    const logsRes = await rpc('eth_getLogs', [
      {
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: 'latest',
        address: USDT_BEP20,
        topics,
      },
    ]);
    const logs = logsRes.result || [];
    if (!logs.length) return null;

    // newest first
    for (let i = logs.length - 1; i >= 0; i -= 1) {
      const log = logs[i];
      const amount = Number(BigInt(log.data)) / 1e18;
      if (amount + 0.0000001 < Number(minAmount)) continue;
      return {
        amount: Number(amount.toFixed(8)),
        from: `0x${log.topics[1].slice(26)}`,
        to: `0x${log.topics[2].slice(26)}`,
        txHash: log.transactionHash,
        blockNumber: parseInt(log.blockNumber, 16),
      };
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = {
  getUsdtTransferFromTx,
  findRecentUsdtTransfer,
  USDT_BEP20,
  TRANSFER_TOPIC,
};
