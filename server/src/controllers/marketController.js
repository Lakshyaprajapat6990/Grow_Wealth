const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT',
  'TRXUSDT', 'LINKUSDT', 'DOTUSDT', 'LTCUSDT', 'AVAXUSDT', 'MATICUSDT', 'SHIBUSDT',
];

function mockPrice(symbol) {
  const base = symbol.charCodeAt(0) * 17 + symbol.length * 3;
  return Number((base + Math.random() * 500).toFixed(4));
}

async function getSymbols(_req, res) {
  return res.json({ success: true, symbols: SYMBOLS });
}

async function getPrices(_req, res) {
  const prices = SYMBOLS.map((symbol) => ({
    symbol,
    price: mockPrice(symbol),
    change24h: Number((Math.random() * 10 - 5).toFixed(2)),
  }));
  return res.json({ success: true, prices });
}

module.exports = { getSymbols, getPrices };
