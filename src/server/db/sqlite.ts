import fs from 'fs';
import path from 'path';

export type UserSwap = {
  tx_hash: string;
  wallet: string;
  traded_pair: string;
  amount_quote: number;
  amount_base: number;
  usd_value: number;
  timestamp: number;
};

type StoreShape = {
  items: UserSwap[];
};

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'swaps.json');

function ensureStore() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify({ items: [] } as StoreShape), 'utf8');
    }
  } catch (e) {
    // If creating dir/file fails, we'll operate in-memory
  }
}

function loadAll(): StoreShape {
  ensureStore();
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const json = JSON.parse(raw);
    if (json && Array.isArray(json.items)) return json as StoreShape;
  } catch (_) {}
  return { items: [] };
}

function saveAll(data: StoreShape) {
  try {
    ensureStore();
    fs.writeFileSync(dataFile, JSON.stringify(data), 'utf8');
  } catch (_) {
    // swallow write errors in restricted environments
  }
}

export function insertSwap(s: UserSwap) {
  const store = loadAll();
  // de-duplicate by tx_hash
  if (!store.items.some(it => it.tx_hash === s.tx_hash)) {
    store.items.unshift(s);
    // keep last 500 for safety
    if (store.items.length > 500) store.items.length = 500;
    saveAll(store);
  }
}

export function getSwapsByWallet(wallet: string, limit = 100): UserSwap[] {
  const w = (wallet || '').toLowerCase();
  const store = loadAll();
  return store.items.filter(it => it.wallet.toLowerCase() === w).slice(0, limit);
}
