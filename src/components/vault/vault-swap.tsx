"use client";

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useVaultSwap, PairInfo, TokenInfo } from '@/hooks/web3/vault/useVaultSwap';
import { QUOTE_SYMBOL } from '@/constants/vault';
import { RefreshCw, Wallet } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ClobDexComponentProps } from '../clob-dex/clob-dex';
import { erc20Abi, formatUnits } from 'viem';
import { readContract } from 'wagmi/actions';
import { wagmiConfig } from '@/configs/wagmi';

export type VaultSwapProps = ClobDexComponentProps & {
  // Only USDC pairs supported in the first iteration as per requirements
};

export default function VaultSwap({ address, chainId, defaultChainId, selectedPool }: VaultSwapProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [feeBpsDisplay, setFeeBpsDisplay] = useState<number>(30);
  const [baseBalance, setBaseBalance] = useState<string>('0');
  const [quoteBalance, setQuoteBalance] = useState<string>('0');

  const pair: PairInfo | null = useMemo(() => {
    if (!selectedPool) return null;
    const base: TokenInfo = {
      address: selectedPool.baseTokenAddress as `0x${string}`,
      symbol: selectedPool.baseSymbol || selectedPool.coin.split('/')[0] || '',
      decimals: Number(selectedPool.baseDecimals ?? 18),
    };
    const quote: TokenInfo = {
      address: selectedPool.quoteTokenAddress as `0x${string}`,
      symbol: QUOTE_SYMBOL, // force USDC labeling in UI
      decimals: Number(selectedPool.quoteDecimals ?? 6),
    };
    return { base, quote };
  }, [selectedPool]);

  const { feeBps, bpsDenom, quoteBuy, quoteSell, swapExactTokensForTokens } = useVaultSwap(
    pair
  );

  useEffect(() => {
    setFeeBpsDisplay(feeBps);
  }, [feeBps]);

  // Fetch wallet balances for base and quote
  useEffect(() => {
    let active = true;
    async function fetchBalances() {
      try {
        if (!pair || !address) return;
        const [rawBase, rawQuote] = await Promise.all([
          readContract(wagmiConfig, { address: pair.base.address, abi: erc20Abi, functionName: 'balanceOf', args: [address as `0x${string}`] }) as Promise<bigint>,
          readContract(wagmiConfig, { address: pair.quote.address, abi: erc20Abi, functionName: 'balanceOf', args: [address as `0x${string}`] }) as Promise<bigint>,
        ]);
        if (!active) return;
        setBaseBalance(formatUnits(rawBase, pair.base.decimals));
        setQuoteBalance(formatUnits(rawQuote, pair.quote.decimals));
      } catch (e) {
        // ignore
      }
    }
    fetchBalances();
    const t = setInterval(fetchBalances, 12000);
    return () => { active = false; clearInterval(t); };
  }, [pair, address]);

  // Re-quote when inputs or oracle price change
  useEffect(() => {
    let mounted = true;
    async function doQuote() {
      if (!pair || !amountIn) {
        setAmountOut('');
        return;
      }
      try {
        const q = side === 'BUY' ? await quoteBuy(amountIn) : await quoteSell(amountIn);
        if (!mounted) return;
        if (q) {
          setPrice(q.price);
          setAmountOut(q.amountOut);
        } else {
          setAmountOut('');
        }
      } catch {}
    }
    doQuote();
    // Also refresh every ~2s to reflect oracle updates
    const t = setInterval(doQuote, 2000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [pair, side, amountIn, quoteBuy, quoteSell]);

  if (!pair || !selectedPool) {
    return (
      <div className="flex items-center justify-center h-40 bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800/50 shadow-lg">
        <div className="flex items-center gap-2 text-gray-300">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading trading pair...</span>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountIn || Number(amountIn) <= 0) {
      toast.error('Enter an amount');
      return;
    }
    try {
      const { hash } = await swapExactTokensForTokens(side, amountIn);
      toast.success('Swap submitted. Waiting for confirmation...');
      console.log('vault.swap tx hash', hash);

      // Log swap server-side for user history
      try {
        const traded_pair = selectedPool?.coin || `${pair?.base.symbol}/${pair?.quote.symbol}`;
        const amount_base = side === 'BUY' ? Number(amountOut || 0) : Number(amountIn || 0);
        const amount_quote = side === 'BUY' ? Number(amountIn || 0) : Number(amountOut || 0);
        const usd_value = amount_quote; // quote is USDC
        await fetch('/api/user-swaps/log', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            tx_hash: hash,
            wallet: address,
            traded_pair,
            amount_quote,
            amount_base,
            usd_value,
            timestamp: Date.now(),
          }),
        });
      } catch (e) {
        console.warn('Failed to log swap', e);
      }

      setAmountIn('');
      setAmountOut('');
    } catch (err) {
      console.error('vault swap failed', err);
      toast.error(err instanceof Error ? err.message : 'Swap failed');
    }
  };

  const baseSym = selectedPool.baseSymbol || selectedPool.coin.split('/')[0] || '';
  const quoteSym = QUOTE_SYMBOL;

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl p-3 max-w-md mx-auto border border-gray-700/30 backdrop-blur-sm">
      {/* Side selector */}
      <div className="grid gap-3 mb-2">
        <div className="relative">
          <div className="flex h-9 text-sm rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/20">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
                side === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-800/50'
              }`}
              onClick={() => setSide('BUY')}
            >
              <span>Buy {baseSym}</span>
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
                side === 'SELL' ? 'bg-rose-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-800/50'
              }`}
              onClick={() => setSide('SELL')}
            >
              <span>Sell {baseSym}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Price display */}
      <div className="mb-2 text-sm text-gray-300 flex items-center justify-between bg-gray-900/30 rounded-lg border border-gray-700/40 p-2">
        <span>Price</span>
        <span className="font-mono">{price > 0 ? formatNumber(price, { decimals: 2 }) : '—'} {quoteSym}</span>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {/* Amount In */}
        <div className="space-y-1">
          <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
            <span>Amount {side === 'BUY' ? quoteSym : baseSym}</span>
          </label>
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              Balance: {side === 'BUY' ? formatNumber(Number(quoteBalance), { decimals: 6 }) : formatNumber(Number(baseBalance), { decimals: 6 })} {side === 'BUY' ? quoteSym : baseSym}
            </span>
            <button
              type="button"
              onClick={() => {
                const bal = side === 'BUY' ? Number(quoteBalance || 0) : Number(baseBalance || 0);
                if (bal > 0) setAmountIn(String(bal));
              }}
              className="text-blue-400 hover:text-blue-300"
            >
              Max
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all"
              value={amountIn}
              onChange={e => setAmountIn(e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min="0"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              {side === 'BUY' ? quoteSym : baseSym}
            </div>
          </div>
        </div>

        {/* Amount Out */}
        <div className="space-y-1">
          <label className="text-sm text-gray-300 flex items-center gap-1.5 ml-1">
            <span>You receive</span>
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-gray-900/40 text-white text-sm rounded-lg py-2 px-3 pr-16 border border-gray-700/50"
              value={amountOut ? formatNumber(Number(amountOut), { decimals: 6 }) : ''}
              placeholder="—"
              readOnly
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/40">
              {side === 'BUY' ? baseSym : quoteSym}
            </div>
          </div>
        </div>

        {/* Fee line */}
        <div className="text-xs text-gray-400 flex items-center justify-between">
          <span>Fee</span>
          <span>{(feeBpsDisplay / 100).toFixed(2)}%</span>
        </div>

        {/* Submit */}
        <div className="relative mt-4">
          <button
            type="submit"
            className={`relative w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              side === 'BUY'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]'
            }`}
          >
            {side === 'BUY' ? `Buy ${baseSym}` : `Sell ${baseSym}`}
          </button>
        </div>
      </form>

      {!address && (
        <div className="mt-3 p-2 bg-gray-900/30 text-gray-300 rounded-lg text-sm border border-gray-700/40 text-center flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>Please connect wallet to trade</span>
        </div>
      )}
    </div>
  );
}
