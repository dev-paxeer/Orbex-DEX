const PYTH_TV_BASE = 'https://benchmarks.pyth.network/v1/shims/tradingview';

export function aliasBaseToPyth(base: string): string {
  const u = (base || '').toUpperCase();
  if (u === 'WETH') return 'ETH';
  if (u === 'WBTC' || u === 'CBBTC' || u === 'CBTC' || u === 'BTCB') return 'BTC';
  if (u === 'STETH' || u === 'WSTETH') return 'ETH';
  return u;
}

export function mapPairToPythSymbol(pair: string): string {
  // pair like 'WETH/USDC'
  const [baseRaw, quoteRaw] = pair.split('/') as [string, string];
  const base = aliasBaseToPyth(baseRaw);
  // normalize quote to USD for Pyth TradingView shim
  const q = (quoteRaw || 'USD').toUpperCase();
  const quote = q === 'USDT' || q === 'USDC' ? 'USD' : q;
  return `Crypto.${base}/${quote}`;
}

export async function fetchPythHistory(symbol: string, fromSec: number, toSec: number, resolution: string): Promise<{ t: number[]; o: number[]; h: number[]; l: number[]; c: number[] }> {
  const url = `${PYTH_TV_BASE}/history?symbol=${encodeURIComponent(symbol)}&from=${fromSec}&to=${toSec}&resolution=${encodeURIComponent(resolution)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pyth history error ${res.status}`);
  const data = await res.json();
  return data;
}

export async function fetchPythLatestClose(pair: string): Promise<number | null> {
  try {
    const symbol = mapPairToPythSymbol(pair);
    const nowSec = Math.floor(Date.now() / 1000);
    const from = nowSec - 10 * 60; // last 10 minutes
    const data = await fetchPythHistory(symbol, from, nowSec, '1');
    if (Array.isArray(data?.c) && data.c.length > 0) {
      const close = Number(data.c[data.c.length - 1]);
      return Number.isFinite(close) ? close : null;
    }
    return null;
  } catch (e) {
    console.error('fetchPythLatestClose error', e);
    return null;
  }
}
