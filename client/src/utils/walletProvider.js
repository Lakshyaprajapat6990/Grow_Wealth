/**
 * Resolve injected EVM provider (TokenPocket, Trust, SafePal, etc.).
 */
export function getEthereumProvider() {
  if (typeof window === 'undefined') return null;

  const eth = window.ethereum;
  if (eth) {
    if (Array.isArray(eth.providers) && eth.providers.length) {
      const preferred =
        eth.providers.find((p) => p.isTokenPocket || p.isTp) ||
        eth.providers.find((p) => p.isSafePal || p.isSafepal) ||
        eth.providers.find((p) => p.isTrust || p.isTrustWallet) ||
        eth.providers[0];
      return preferred || eth;
    }
    return eth;
  }

  if (window.tokenpocket?.ethereum) return window.tokenpocket.ethereum;
  if (window.tp?.ethereum) return window.tp.ethereum;
  if (window.safepal?.ethereum) return window.safepal.ethereum;
  if (window.safePal?.ethereum) return window.safePal.ethereum;
  if (window.trustwallet?.ethereum) return window.trustwallet.ethereum;

  return null;
}

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function getDappUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.href.split('#')[0];
}

const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955';
const BSC_CHAIN_ID = 56;
/** Trust Wallet UAI for USDT on BNB Smart Chain */
const TRUST_USDT_BSC = `c20000714_t${USDT_BSC}`;

function amountToWeiString(amountUsdt) {
  const n = Number(amountUsdt);
  if (!Number.isFinite(n) || n <= 0) return '0';
  return (BigInt(Math.round(n * 1e6)) * 10n ** 12n).toString();
}

function buildTokenPocketTransferLink({ toAddress, amountUsdt }) {
  const amount = Number(amountUsdt ?? 10);
  const param = {
    protocol: 'TokenPocket',
    version: '2.0',
    dappName: 'Grow Wealth',
    action: 'transfer',
    actionId: `gw-${Date.now()}`,
    to: String(toAddress || '').trim(),
    amount,
    contract: USDT_BSC,
    symbol: 'USDT',
    decimal: 18,
    precision: 18,
    desc: `Registration payment $${amount} USDT`,
    blockchains: [{ chainId: String(BSC_CHAIN_ID), network: 'ethereum' }],
  };
  return `tpoutside://pull.activity?param=${encodeURIComponent(JSON.stringify(param))}`;
}

function buildTokenPocketDappLink(pageUrl) {
  const params = {
    url: pageUrl,
    chain: 'BSC',
    source: 'GrowWealth',
  };
  return `tpdapp://open?params=${encodeURIComponent(JSON.stringify(params))}`;
}

/**
 * Deep links that open the wallet SEND screen with company address + amount.
 * Trust + TokenPocket support prefilled transfer.
 * SafePal: open DApp only (no public send+amount API).
 */
export function getPaymentDeepLinks({ toAddress, amountUsdt }) {
  const to = String(toAddress || '').trim();
  const amount = String(amountUsdt ?? 10);
  const wei = amountToWeiString(amount);
  const dapp = getDappUrl();
  const encodedDapp = encodeURIComponent(dapp);

  const trust = `https://link.trustwallet.com/send?asset=${TRUST_USDT_BSC}&address=${encodeURIComponent(
    to
  )}&amount=${encodeURIComponent(amount)}`;

  const tokenpocket = buildTokenPocketTransferLink({ toAddress: to, amountUsdt: amount });

  const eip681 = `ethereum:${USDT_BSC}@${BSC_CHAIN_ID}/transfer?address=${to}&uint256=${wei}`;
  const safepalDapp = `https://link.safepal.io/browser?url=${encodedDapp}`;

  return {
    trust,
    tokenpocket,
    safepal: safepalDapp,
    safepalEip681: eip681,
    eip681,
    dapp: {
      safepal: safepalDapp,
      trust: `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodedDapp}`,
      tokenpocket: buildTokenPocketDappLink(dapp),
    },
  };
}

/** Open wallet with prefilled $USDT send (where supported). */
export function openPaymentInWallet(walletKey, { toAddress, amountUsdt }) {
  const links = getPaymentDeepLinks({ toAddress, amountUsdt });
  if (walletKey === 'safepal') {
    try {
      window.location.href = links.safepalEip681;
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      window.location.href = links.safepal;
    }, 600);
    return true;
  }
  const href = links[walletKey];
  if (!href) return false;
  window.location.href = href;
  return true;
}

/** @deprecated prefer openPaymentInWallet for pay flow */
export function openInWallet(walletKey) {
  const dapp = getDappUrl();
  const encoded = encodeURIComponent(dapp);
  const map = {
    safepal: `https://link.safepal.io/browser?url=${encoded}`,
    trust: `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encoded}`,
    tokenpocket: buildTokenPocketDappLink(dapp),
  };
  const href = map[walletKey];
  if (!href) return false;
  window.location.href = href;
  return true;
}

export const WALLET_NOT_FOUND_MSG =
  'No wallet browser detected. Use Trust / TokenPocket for a prefilled $10 USDT send, or SafePal then Pay. Or send manually and tap Check Payment.';

export const WALLET_CONNECT_HINT =
  'Use TokenPocket, Trust Wallet, or SafePal on BSC (BEP-20). Trust & TokenPocket can open with address + amount filled.';
