"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { readContract } from 'wagmi/actions';
import { wagmiConfig } from '@/configs/wagmi';
import { useVaultSwap, PairInfo, TokenInfo } from '@/hooks/web3/vault/useVaultSwap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, ArrowUpDown, Wallet } from 'lucide-react';
import TokenNetworkSelector, { Network, Token } from '@/components/pharos/swap/token-network-selector';
import { GTX_GRAPHQL_URL } from '@/constants/subgraph-url';
import { getUseSubgraph } from '@/utils/env';
import { poolsPonderQuery, poolsQuery } from '@/graphql/gtx/clob';
import request from 'graphql-request';
import { toast } from 'sonner';

// Build a same-chain token selector and use Vault for swaps between any two supported tokens
export default function VaultSwapStandalone() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Local networks and token list (single network: Paxeer Network)
  const localNetwork: Network = { id: 'local', name: 'Paxeer Network', icon: '/network/gtx-update-dark.png' };
  const [tokensByNetwork, setTokensByNetwork] = useState<Record<string, Token[]>>({ local: [] });
  const [decimalsMap, setDecimalsMap] = useState<Record<string, number>>({});

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [isSellSelector, setIsSellSelector] = useState(true);

  // Selected tokens
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);

  // Amounts and pricing
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('');
  const [price, setPrice] = useState<number>(0);

  // Balances
  const [balanceIn, setBalanceIn] = useState<string>('0');
  const [balanceOut, setBalanceOut] = useState<string>('0');

  // Map a token symbol to our public/tokens/{SYMBOL}.png path using uppercase
  const toIconPath = (symbol: string) => {
    const u = (symbol || '').toUpperCase();
    return `/tokens/${u}.png`;
  };

  // Warm start from cached tokens/decimals if available
  useEffect(() => {
    try {
      const cacheKeyTokens = `vault_tokens_cache_${chainId}`;
      const cacheKeyDecimals = `vault_decimals_cache_${chainId}`;
      const cachedTokens = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKeyTokens) : null;
      const cachedDecimals = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKeyDecimals) : null;
      if (cachedTokens) {
        const arr: Token[] = JSON.parse(cachedTokens);
        if (Array.isArray(arr) && arr.length > 0) {
          setTokensByNetwork({ local: arr });
        }
      }
      if (cachedDecimals) {
        const dec = JSON.parse(cachedDecimals);
        if (dec && typeof dec === 'object') setDecimalsMap(dec);
      }
    } catch {}
  }, [chainId]);

  // Build a PairInfo for useVaultSwap (base=tokenIn, quote=tokenOut when selling tokenIn for tokenOut)
  const pair: PairInfo | null = useMemo(() => {
    if (!tokenIn || !tokenOut) return null;
    const dIn = decimalsMap[tokenIn.address?.toLowerCase?.() || ''] ?? 18;
    const dOut = decimalsMap[tokenOut.address?.toLowerCase?.() || ''] ?? 18;
    const base: TokenInfo = {
      address: tokenIn.address as `0x${string}`,
      symbol: tokenIn.symbol,
      decimals: dIn,
    };
    const quote: TokenInfo = {
      address: tokenOut.address as `0x${string}`,
      symbol: tokenOut.symbol,
      decimals: dOut,
    };
    return { base, quote };
  }, [tokenIn, tokenOut, decimalsMap]);

  const { quoteSell, swapExactTokensForTokens, feeBps } = useVaultSwap(pair);

  // Fetch pools to build token list (union of base/quote tokens)
  useEffect(() => {
    async function loadTokens() {
      try {
        const url = GTX_GRAPHQL_URL(Number(chainId));
        if (!url) return;
        const useSub = getUseSubgraph();
        const data = await request(url, useSub ? poolsQuery : poolsPonderQuery);
        const pools = 'pools' in data ? data.pools : data.poolss.items;

        const tokenMap = new Map<string, Token>();
        const nextDecimals: Record<string, number> = {};
        for (const p of pools) {
          const base = p.baseCurrency;
          const quote = p.quoteCurrency;
          if (base?.address) {
            const sym = base.symbol || 'TOKEN';
            tokenMap.set(base.address.toLowerCase(), {
              id: sym.toLowerCase(),
              name: sym,
              symbol: sym,
              icon: toIconPath(sym),
              address: base.address,
              description: base.address.slice(0, 6) + '...' + base.address.slice(-4),
            });
            if (typeof base.decimals === 'number') nextDecimals[base.address.toLowerCase()] = base.decimals;
          }
          if (quote?.address) {
            const sym = quote.symbol || 'TOKEN';
            tokenMap.set(quote.address.toLowerCase(), {
              id: sym.toLowerCase(),
              name: sym,
              symbol: sym,
              icon: toIconPath(sym),
              address: quote.address,
              description: quote.address.slice(0, 6) + '...' + quote.address.slice(-4),
            });
            if (typeof quote.decimals === 'number') nextDecimals[quote.address.toLowerCase()] = quote.decimals;
          }
        }
        const arr = Array.from(tokenMap.values());
        setTokensByNetwork({ local: arr });
        setDecimalsMap(nextDecimals);

        // Cache for faster subsequent loads
        try {
          const cacheKeyTokens = `vault_tokens_cache_${chainId}`;
          const cacheKeyDecimals = `vault_decimals_cache_${chainId}`;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(cacheKeyTokens, JSON.stringify(arr));
            window.localStorage.setItem(cacheKeyDecimals, JSON.stringify(nextDecimals));
          }
        } catch {}

        // Initialize defaults
        if (arr.length > 1 && (!tokenIn || !tokenOut)) {
          const defIn = arr.find(t => t.symbol.toUpperCase() === 'WETH') || arr[0];
          const defOut = arr.find(t => t.symbol.toUpperCase() === 'USDC') || arr[1];
          setTokenIn(defIn);
          setTokenOut(defOut && defOut.address !== defIn.address ? defOut : arr.find(t => t.address !== defIn.address) || arr[0]);
        }
      } catch (e) {
        console.warn('Failed to load pools for tokens', e);
      }
    }
    loadTokens();
  }, [chainId]);

  // Quote amountOut whenever amountIn or tokens change
  useEffect(() => {
    let active = true;
    async function doQuote() {
      try {
        if (!pair || !amountIn) { setAmountOut(''); setPrice(0); return; }
        const q = await quoteSell(amountIn);
        if (!active) return;
        if (q) { setAmountOut(q.amountOut); setPrice(q.price); } else { setAmountOut(''); setPrice(0); }
      } catch {
        if (active) { setAmountOut(''); setPrice(0); }
      }
    }
    doQuote();
    const t = setInterval(doQuote, 12000);
    return () => { active = false; clearInterval(t); };
  }, [pair, amountIn, quoteSell]);

  // Fetch balances for tokenIn and tokenOut
  useEffect(() => {
    let active = true;
    async function fetchBalances() {
      try {
        if (!address || !tokenIn || !tokenOut) return;
        const dIn = decimalsMap[tokenIn.address?.toLowerCase?.() || ''] ?? 18;
        const dOut = decimalsMap[tokenOut.address?.toLowerCase?.() || ''] ?? 18;
        const [balIn, balOut] = await Promise.all([
          readContract(wagmiConfig, { address: tokenIn.address as `0x${string}` , abi: erc20Abi, functionName: 'balanceOf', args: [address as `0x${string}`] }) as Promise<bigint>,
          readContract(wagmiConfig, { address: tokenOut.address as `0x${string}`, abi: erc20Abi, functionName: 'balanceOf', args: [address as `0x${string}`] }) as Promise<bigint>,
        ]);
        if (!active) return;
        setBalanceIn(formatUnits(balIn, dIn));
        setBalanceOut(formatUnits(balOut, dOut));
      } catch {
        // ignore
      }
    }
    fetchBalances();
    const t = setInterval(fetchBalances, 15000);
    return () => { active = false; clearInterval(t); };
  }, [address, tokenIn, tokenOut, decimalsMap]);

  const openSelector = (isSell: boolean) => {
    setIsSellSelector(isSell);
    setSelectorOpen(true);
  };

  const handleSelect = (network: Network, token: Token) => {
    if (isSellSelector) {
      setTokenIn(token);
    } else {
      setTokenOut(token);
    }
    setSelectorOpen(false);
  };

  const swapSides = () => {
    if (tokenIn && tokenOut) {
      const a = tokenIn; const b = tokenOut;
      setTokenIn(b); setTokenOut(a);
      setAmountOut('');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) { toast.error('Connect wallet'); return; }
    if (!pair || !amountIn || Number(amountIn) <= 0) { toast.error('Enter amount'); return; }
    try {
      const { hash } = await swapExactTokensForTokens('SELL', amountIn);
      toast.success('Swap submitted. Waiting for confirmation...');
      // Log swap
      try {
        await fetch('/api/user-swaps/log', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            tx_hash: hash,
            wallet: address,
            traded_pair: `${tokenIn?.symbol}/${tokenOut?.symbol}`,
            amount_quote: Number(amountOut || 0),
            amount_base: Number(amountIn || 0),
            usd_value: Number(amountOut || 0), // approximated by quote token assuming USD stable if USDC/USDT; otherwise still recorded
            timestamp: Date.now(),
          }),
        });
      } catch {}
      setAmountIn(''); setAmountOut('');
    } catch (err) {
      console.error('swap failed', err);
      toast.error(err instanceof Error ? err.message : 'Swap failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md relative z-10">
        <Card className="border-white/20 bg-[#121212] p-4">
          <div className="mb-2 text-3xl font-bold text-white">Swap</div>

          {/* Source */}
          <div className="mb-2 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
            <div className="mb-2 text-sm text-gray-400">From {localNetwork.name}</div>
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="w-1/2 bg-transparent text-4xl font-medium text-white outline-none"
                min="0"
                step="0.000001"
              />
              <Button
                variant="outline"
                onClick={() => openSelector(true)}
                className="flex h-12 items-center gap-2 rounded-full border-blue-500/20 bg-blue-500/10 px-4 text-white hover:bg-blue-500/20"
              >
                <div className="relative">
                  {tokenIn ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tokenIn.icon} alt={tokenIn.symbol} className="h-8 w-8 rounded-full" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/tokens/default-token.png'}} />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">?</div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-medium">{tokenIn?.symbol || 'Select'}</span>
                  <span className="text-xs text-gray-400">{localNetwork.name}</span>
                </div>
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-400">{price > 0 && tokenIn && tokenOut ? `1 ${tokenIn.symbol} = ${(price).toFixed(6)} ${tokenOut.symbol}` : ''}</div>
              <div className="flex items-center text-sm text-blue-400">
                <Wallet className="mr-1 h-4 w-4" />
                <span>
                  {isConnected ? `${Number(balanceIn).toFixed(6)} ${tokenIn?.symbol || ''}` : 'Connect wallet'}
                </span>
                <button type="button" className="ml-2 text-xs text-blue-300 hover:text-blue-200" onClick={() => { if (Number(balanceIn) > 0) setAmountIn(String(Number(balanceIn))); }}>Max</button>
              </div>
            </div>
          </div>

          {/* Swap button */}
          <div className="relative flex justify-center">
            <Button variant="outline" size="icon" onClick={swapSides} className="absolute -top-4 z-10 h-8 w-8 rounded-full border-white/10 bg-[#121212] text-gray-400 hover:bg-blue-600/20 hover:text-white transition-colors">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Destination */}
          <div className="mb-4 rounded-xl border border-white/10 bg-[#1A1A1A]/50 p-4">
            <div className="mb-2 text-sm text-gray-400">To {localNetwork.name}</div>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={amountOut || ''}
                readOnly
                placeholder="0.0"
                className="w-1/2 bg-transparent text-4xl font-medium text-white outline-none"
              />
              <Button
                variant="outline"
                onClick={() => openSelector(false)}
                className="flex h-12 items-center gap-2 rounded-full border-white/10 bg-white/5 px-4 text-white hover:bg-white/10"
              >
                <div className="relative">
                  {tokenOut ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tokenOut.icon} alt={tokenOut.symbol} className="h-8 w-8 rounded-full" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/tokens/default-token.png'}} />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">?</div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-medium">{tokenOut?.symbol || 'Select'}</span>
                  <span className="text-xs text-gray-400">{localNetwork.name}</span>
                </div>
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-400">{amountOut ? 'Estimated' : ''}</div>
              <div className="flex items-center text-sm text-gray-400">
                <Wallet className="mr-1 h-4 w-4" />
                <span>
                  {isConnected ? `${Number(balanceOut).toFixed(6)} ${tokenOut?.symbol || ''}` : 'Connect wallet'}
                </span>
              </div>
            </div>
          </div>

          {/* Action */}
          <Button
            className="w-full bg-blue-600 py-6 text-lg font-medium text-white hover:bg-blue-700 disabled:bg-blue-600/50"
            onClick={onSubmit}
            disabled={!isConnected || !amountIn || !tokenIn || !tokenOut}
          >
            {isConnected ? 'Swap' : 'Connect Wallet'}
          </Button>
        </Card>
      </div>

      <TokenNetworkSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        networks={[localNetwork]}
        tokens={tokensByNetwork}
        initialNetwork={localNetwork}
        onSelect={handleSelect}
        title={isSellSelector ? 'Select source token' : 'Select destination token'}
      />
    </div>
  );
}
