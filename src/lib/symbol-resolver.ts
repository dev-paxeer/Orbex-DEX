/*
 Utility to resolve external market symbols for Paxeer pairs and token addresses.
 - Maps local base symbols (e.g., WETH, WBTC) to external vendor base symbols (e.g., ETH, BTC)
 - Produces prioritized candidate symbols for Binance (e.g., ETHUSDC, ETHUSDT)
 - Can be extended to include CoinGecko, Pyth, Chainlink identifiers
*/

export type VendorCandidates = {
  candidates: string[]; // e.g. ["ETHUSDC", "ETHUSDT"]
  baseAlias: string;    // e.g. "ETH"
  quote: string;        // e.g. "USDC"
};

const BASE_ALIAS_MAP: Record<string, string> = {
  // Wrapped/common aliases
  WETH: 'ETH',
  WBTC: 'BTC',
  CBTC: 'BTC',
  // LSTs approximated to ETH prices for charting purposes
  STETH: 'ETH',
  WSTETH: 'ETH',
  // Paxeer-native (approx to stablecoin USDP if ever needed)
  WPAX: 'USDP',
};

// Some tokens have special vendor tickers on Binance
const BINANCE_BASE_OVERRIDES: Record<string, string[]> = {
  // Lido staked ETH is represented as WBETH on Binance
  STETH: ['WBETH', 'ETH'],
  WSTETH: ['WBETH', 'ETH'],
  // Paxos: PAX rebranded to USDP
  WPAX: ['USDP'],
};

function aliasBaseForVendors(base: string): string[] {
  const upper = base.toUpperCase();
  if (BINANCE_BASE_OVERRIDES[upper]) return BINANCE_BASE_OVERRIDES[upper];
  const aliased = BASE_ALIAS_MAP[upper] || upper;
  return [aliased];
}

export function parsePairSymbol(symbol: string): { base: string; quote: string } {
  const clean = (symbol || '').replace(/\s+/g, '').toUpperCase();
  if (clean.includes('/')) {
    const [base, quote] = clean.split('/') as [string, string];
    return { base, quote };
  }
  // Fallback: try to split last 3-4 letters as quote; default to USDC
  if (clean.endsWith('USDC')) return { base: clean.slice(0, -4), quote: 'USDC' };
  if (clean.endsWith('USDT')) return { base: clean.slice(0, -4), quote: 'USDT' };
  if (clean.endsWith('USD')) return { base: clean.slice(0, -3), quote: 'USD' };
  return { base: clean, quote: 'USDC' };
}

/**
 * Build prioritized Binance symbol candidates for a pair.
 * Example: WETH/USDC -> ["ETHUSDC", "ETHUSDT"]
 */
export function getBinanceCandidatesForPair(pair: string): VendorCandidates {
  const { base, quote } = parsePairSymbol(pair);
  const baseCandidates = aliasBaseForVendors(base);
  const quoteUpper = quote.toUpperCase();

  const candidates: string[] = [];
  for (const b of baseCandidates) {
    if (quoteUpper === 'USDC') {
      candidates.push(`${b}USDC`);
      candidates.push(`${b}USDT`);
    } else if (quoteUpper === 'USD') {
      candidates.push(`${b}USD`);
      candidates.push(`${b}USDT`);
    } else if (quoteUpper === 'USDT') {
      candidates.push(`${b}USDT`);
      candidates.push(`${b}USDC`);
    } else {
      // Unknown quote: still try common quotes
      candidates.push(`${b}${quoteUpper}`);
      candidates.push(`${b}USDC`);
      candidates.push(`${b}USDT`);
    }
  }
  // Ensure uniqueness preserving order
  const deduped = Array.from(new Set(candidates));
  return { candidates: deduped, baseAlias: baseCandidates[0], quote: quoteUpper };
}

/**
 * Convenience resolver that accepts either a pair like "WETH/USDC" or separate parts.
 */
export function resolveBinanceSymbols(baseOrPair: string, maybeQuote?: string): VendorCandidates {
  if (maybeQuote) {
    return getBinanceCandidatesForPair(`${baseOrPair}/${maybeQuote}`);
  }
  return getBinanceCandidatesForPair(baseOrPair);
}

// --- Address-based resolution ---
import { ADDRESS_SYMBOL_MAP, getVendorBasesForSymbol } from '@/constants/market/address-symbol-map';

/**
 * Resolve Binance symbol candidates from on-chain addresses.
 * If quoteAddress is omitted, default to USDC.
 */
export function resolveBinanceSymbolsFromAddresses(
  baseAddress?: string | null,
  quoteAddress?: string | null
): VendorCandidates {
  const defaultQuote = 'USDC';
  if (!baseAddress) {
    return { candidates: [], baseAlias: '', quote: defaultQuote };
  }
  const baseEntry = ADDRESS_SYMBOL_MAP[baseAddress];
  const baseUpper = (baseEntry?.baseSymbol || '').toUpperCase();
  const vendorBases = baseUpper ? getVendorBasesForSymbol(baseUpper) : [];

  let quote = defaultQuote;
  if (quoteAddress) {
    const quoteEntry = ADDRESS_SYMBOL_MAP[quoteAddress];
    if (quoteEntry?.baseSymbol) {
      quote = quoteEntry.baseSymbol.toUpperCase();
      if (quote === 'USD') quote = 'USDC';
    }
  }

  const candidates: string[] = [];
  for (const b of vendorBases) {
    if (quote === 'USDC') {
      candidates.push(`${b}USDC`, `${b}USDT`);
    } else if (quote === 'USD') {
      candidates.push(`${b}USD`, `${b}USDT`);
    } else if (quote === 'USDT') {
      candidates.push(`${b}USDT`, `${b}USDC`);
    } else {
      candidates.push(`${b}${quote}`, `${b}USDC`, `${b}USDT`);
    }
  }
  const deduped = Array.from(new Set(candidates));
  return { candidates: deduped, baseAlias: vendorBases[0] || baseUpper, quote };
}

// --- CEX (Paxeer) pair resolver ---
const CEX_BASE_ALIAS_MAP: Record<string, string> = {
  WETH: 'ETH',
  WBTC: 'BTC',
  CBTC: 'BTC',
  STETH: 'ETH',
  WSTETH: 'ETH',
};

function aliasBaseForCex(base: string): string {
  const upper = base.toUpperCase();
  return CEX_BASE_ALIAS_MAP[upper] || upper;
}

/**
 * Convert internal pair (e.g., "weth/usdc" or "WETH/USDC") to CEX format (e.g., "ETH/USDC").
 */
export function resolveCexPairSymbol(pair: string): string {
  const { base, quote } = parsePairSymbol(pair);
  const baseAliased = aliasBaseForCex(base);
  let q = quote.toUpperCase();
  if (q === 'USD') q = 'USDC';
  return `${baseAliased}/${q}`;
}
