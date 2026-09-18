const https = require('https');

const USDT_BEP20 = '0x55d398326f99059ff775485246999027b3197955';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/** Public endpoints — bsc-dataseed often rejects eth_getLogs with "limit exceeded". */
const DEFAULT_RPC_HOSTS = [
  process.env.BSC_RPC_HOST,
  'bsc.publicnode.com',
  'bsc-dataseed1.binance.org',
  'bsc-dataseed2.binance.org',
  'bsc-dataseed.binance.org',
].filter(Boolean);

function rpcOnHost(hostname, method, params, path = '/') {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        method: 'POST',
        path,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 20000,
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
      reject(new Error(`BSC RPC timeout (${hostname})`));
    });
    req.write(body);
    req.end();
  });
}

async function rpc(method, params) {
  let lastErr = null;
  for (const host of DEFAULT_RPC_HOSTS) {
    try {
      const j = await rpcOnHost(host, method, params);
      if (j.error) {
        lastErr = new Error(j.error.message || 'RPC error');
        continue;
      }
      return j;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All BSC RPC hosts failed');
}

function padAddress(addr) {
  return `0x${String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
}

function parseTransferLog(log, txHashFallback = '') {
  const from = `0x${log.topics[1].slice(26)}`;
  const to = `0x${log.topics[2].slice(26)}`;
  const amount = Number(BigInt(log.data)) / 1e18;
  return {
    amount: Number(amount.toFixed(8)),
    from,
    to,
    txHash: log.transactionHash || txHashFallback,
    blockNumber: log.blockNumber ? parseInt(log.blockNumber, 16) : undefined,
  };
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
      const transfer = parseTransferLog(log, txHash.trim());
      if (wantTo && transfer.to.toLowerCase() !== wantTo) continue;
      return transfer;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Scan recent blocks for USDT transfer from → to with amount >= minAmount.
 * Uses small chunked eth_getLogs (public RPCs reject large ranges).
 */
async function findRecentUsdtTransfer({
  from,
  to,
  minAmount = 10,
  lookbackBlocks = 6000,
  chunkSize = 40,
} = {}) {
  if (!from || !to) return null;

  const topics = [TRANSFER_TOPIC, padAddress(from), padAddress(to)];
  let lastError = null;

  for (const host of DEFAULT_RPC_HOSTS) {
    try {
      const latestRes = await rpcOnHost(host, 'eth_blockNumber', []);
      if (latestRes.error || !latestRes.result) {
        lastError = latestRes.error?.message || 'no block number';
        continue;
      }
      const latest = parseInt(latestRes.result, 16);
      const oldest = Math.max(0, latest - lookbackBlocks);

      for (let end = latest; end > oldest; end -= chunkSize) {
        const start = Math.max(oldest, end - chunkSize + 1);
        const logsRes = await rpcOnHost(host, 'eth_getLogs', [
          {
            fromBlock: `0x${start.toString(16)}`,
            toBlock: `0x${end.toString(16)}`,
            address: USDT_BEP20,
            topics,
          },
        ]);

        if (logsRes.error) {
          lastError = logsRes.error.message || 'getLogs error';
          // try next host if this one rejects ranges
          if (/limit|range|exceed/i.test(lastError)) break;
          continue;
        }

        const logs = logsRes.result || [];
        for (let i = logs.length - 1; i >= 0; i -= 1) {
          const transfer = parseTransferLog(logs[i]);
          if (transfer.amount + 0.0000001 < Number(minAmount)) continue;
          return transfer;
        }
      }

      // finished this host with no match — try next host anyway once
      // (no match is not an error)
      return null;
    } catch (e) {
      lastError = e.message || String(e);
    }
  }

  if (lastError) {
    const err = new Error(`BSC scan failed: ${lastError}`);
    err.code = 'BSC_SCAN_FAILED';
    throw err;
  }
  return null;
}

/**
 * Find recent USDT received by company wallet (any sender).
 * Used to give a clearer "wrong wallet" message.
 */
async function findRecentIncomingUsdt({
  to,
  minAmount = 10,
  lookbackBlocks = 2000,
  chunkSize = 40,
  maxResults = 15,
} = {}) {
  if (!to) return [];
  const topics = [TRANSFER_TOPIC, null, padAddress(to)];
  const found = [];

  for (const host of DEFAULT_RPC_HOSTS) {
    try {
      const latestRes = await rpcOnHost(host, 'eth_blockNumber', []);
      if (latestRes.error || !latestRes.result) continue;
      const latest = parseInt(latestRes.result, 16);
      const oldest = Math.max(0, latest - lookbackBlocks);

      for (let end = latest; end > oldest && found.length < maxResults; end -= chunkSize) {
        const start = Math.max(oldest, end - chunkSize + 1);
        const logsRes = await rpcOnHost(host, 'eth_getLogs', [
          {
            fromBlock: `0x${start.toString(16)}`,
            toBlock: `0x${end.toString(16)}`,
            address: USDT_BEP20,
            topics,
          },
        ]);
        if (logsRes.error) {
          if (/limit|range|exceed/i.test(logsRes.error.message || '')) break;
          continue;
        }
        const logs = logsRes.result || [];
        for (let i = logs.length - 1; i >= 0; i -= 1) {
          const transfer = parseTransferLog(logs[i]);
          if (transfer.amount + 0.0000001 < Number(minAmount)) continue;
          found.push(transfer);
          if (found.length >= maxResults) break;
        }
      }
      return found;
    } catch {
      /* try next host */
    }
  }
  return found;
}

module.exports = {
  getUsdtTransferFromTx,
  findRecentUsdtTransfer,
  findRecentIncomingUsdt,
  USDT_BEP20,
  TRANSFER_TOPIC,
};
