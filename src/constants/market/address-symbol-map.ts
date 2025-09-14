// Mapping of Paxeer on-chain token addresses to base symbols and external vendor tickers
// This is used to resolve external market data symbols (e.g., Binance, CoinGecko, Pyth, Chainlink)

export type VendorIds = {
  // Binance base tickers (no quote). Order = priority
  binance?: string[];
  // CoinGecko coin id(s)
  coingecko?: string[];
  // Optional Pyth price id
  pyth?: string;
  // Optional Chainlink feed address (if on same network)
  chainlinkFeed?: string;
};

export type AddressSymbolMap = Record<string, { baseSymbol: string; aliases?: string[]; vendors?: VendorIds }>;

// NOTE: Addresses are checksum as provided in .env.local
export const ADDRESS_SYMBOL_MAP: AddressSymbolMap = {
  // Core
  '0xD0C1a714c46c364DBDd4E0F7b0B6bA5354460dA7': { baseSymbol: 'WETH', aliases: ['ETH'], vendors: { binance: ['ETH'] } },
  '0x96465d06640aff1A00888d4b9217C9EaE708C419': { baseSymbol: 'WBTC', aliases: ['BTC'], vendors: { binance: ['BTC'] } },
  '0x29E1f94F6b209B57eCdc1fE87448a6d085a78a5a': { baseSymbol: 'USDC', aliases: ['USD'], vendors: { binance: ['USDC'] } },
  '0x7a6AC59351dc5fcE9c90E6568CB5CE25De19473C': { baseSymbol: 'LINK', vendors: { binance: ['LINK'] } },
  '0xEb2c4ae6fE90f9Bf25C94269236CB5408E00E188': { baseSymbol: 'WSTETH', aliases: ['STETH','ETH','WBETH'], vendors: { binance: ['WBETH', 'ETH'] } },
  '0xBbf11B964AC48bd11109b68dffe129b45671e34E': { baseSymbol: 'STETH', aliases: ['ETH','WBETH'], vendors: { binance: ['WBETH', 'ETH'] } },
  '0x1fa6cb491791B4785b7c5c1E3C11e0144eDc43a0': { baseSymbol: 'CBTC', aliases: ['BTC'], vendors: { binance: ['BTC'] } },
  '0xDCCeC2B62Dd102276B7Ba689405A5CD7504A8CD3': { baseSymbol: 'DOT', vendors: { binance: ['DOT'] } },
  '0x90A271d104aEA929b68867B3050EfACbc1A28E84': { baseSymbol: 'UNI', vendors: { binance: ['UNI'] } },
  '0x17D6592A6B27564F3D0810D79405D366a4aC69e5': { baseSymbol: 'WPAX', aliases: ['USDP'], vendors: { binance: ['USDP'] } },
  '0xA1956408cbeB4c0D2c257BE394b9bDF4c9e1a061': { baseSymbol: 'CRO', aliases: ['CRO'], vendors: { binance: ['CRO'] } },
  '0x9d60b394276e67A44f2d80e1AB7CFafA4e151F02': { baseSymbol: 'TON', vendors: { binance: ['TON'] } },
  '0x2a401fE7616c4AbA69B147B4B725cE48ca7Ec660': { baseSymbol: 'USDT', vendors: { binance: ['USDT'] } },
  '0xb947Bcd6bccE03846ac716fC39A3133c4bF0108e': { baseSymbol: 'BNB', vendors: { binance: ['BNB'] } },
  '0x7100cf39FF0E845D7751Fb56198b8Dd16C6Ecb2a': { baseSymbol: 'SOL', vendors: { binance: ['SOL'] } },
};

// Build a quick lookup from base symbol to vendor base tickers
export const BASE_TO_VENDOR: Record<string, VendorIds> = Object.values(ADDRESS_SYMBOL_MAP).reduce((acc, item) => {
  const key = item.baseSymbol.toUpperCase();
  acc[key] = item.vendors || {};
  return acc;
}, {} as Record<string, VendorIds>);

export function getBaseFromAddress(addr?: string): string | undefined {
  if (!addr) return undefined;
  const entry = ADDRESS_SYMBOL_MAP[addr];
  return entry?.baseSymbol;
}

export function getVendorBasesForSymbol(base: string): string[] {
  const upper = base.toUpperCase();
  const entry = BASE_TO_VENDOR[upper];
  if (entry?.binance && entry.binance.length) return entry.binance;
  return [upper];
}
