"use client";

import { useEffect, useState } from 'react';
import { getExplorerUrl } from '@/constants/urls/urls-config';
import { formatNumber } from '@/lib/utils';
import { ClobDexComponentProps } from '../clob-dex';

interface UserSwapItem {
  tx_hash: string;
  wallet: string;
  traded_pair: string;
  amount_quote: number;
  amount_base: number;
  usd_value: number;
  timestamp: number;
}

export default function UserSwaps({ address, chainId, defaultChainId }: ClobDexComponentProps) {
  const [items, setItems] = useState<UserSwapItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!address) return;
      setLoading(true);
      try {
        const url = `/api/user-swaps/by-wallet?wallet=${encodeURIComponent(address)}&limit=100`;
        const res = await fetch(url);
        const json = await res.json();
        if (!active) return;
        setItems(Array.isArray(json.items) ? json.items : []);
      } catch (_) {
        if (!active) return;
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 10000);
    return () => { active = false; clearInterval(t); };
  }, [address]);

  if (!address) return null;

  const baseExplorer = getExplorerUrl(chainId ?? defaultChainId);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
      <div className="grid grid-cols-6 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm text-sm font-medium text-gray-200">
        <div>Time</div>
        <div>Pair</div>
        <div className="text-right">Base</div>
        <div className="text-right">Quote</div>
        <div className="text-right">USD</div>
        <div>Tx</div>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {loading && items.length === 0 && (
          <div className="p-4 text-sm text-gray-300">Loading...</div>
        )}
        {(!loading && items.length === 0) && (
          <div className="p-4 text-sm text-gray-300">No swaps yet.</div>
        )}
        {items.map((it) => (
          <div key={it.tx_hash} className="grid grid-cols-6 gap-4 border-b border-gray-800/20 px-4 py-2 text-sm">
            <div className="text-gray-300">{new Date(it.timestamp).toLocaleString()}</div>
            <div className="text-gray-200">{it.traded_pair}</div>
            <div className="text-right text-gray-200">{formatNumber(it.amount_base, { decimals: 6 })}</div>
            <div className="text-right text-gray-200">{formatNumber(it.amount_quote, { decimals: 2 })}</div>
            <div className="text-right text-gray-100 font-medium">${formatNumber(it.usd_value, { decimals: 2 })}</div>
            <div className="text-blue-400 hover:text-blue-300 truncate">
              <a className="underline" href={`${baseExplorer}${it.tx_hash}`} target="_blank" rel="noreferrer">
                {it.tx_hash.slice(0, 6)}...{it.tx_hash.slice(-4)}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
