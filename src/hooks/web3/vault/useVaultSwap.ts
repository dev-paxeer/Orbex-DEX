import { wagmiConfig } from '@/configs/wagmi';
import { VAULT_ADDRESS } from '@/constants/vault';
import VaultABI from '@/abis/vault/VaultABI';
import { erc20Abi, formatUnits, parseUnits } from 'viem';
import { readContract, simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { fetchPythLatestClose, aliasBaseToPyth } from '@/lib/pricing/pyth';
import { useAccount, useChainId } from 'wagmi';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type Address = `0x${string}`;

export type TokenInfo = {
  address: Address;
  symbol: string;
  decimals: number;
};

export type PairInfo = {
  base: TokenInfo; // e.g. WBTC
  quote: TokenInfo; // USDC
};

export type QuoteResult = {
  price: number; // BASE price in quote (USDC)
  amountIn: string; // human
  amountOut: string; // human
  feeBps: number;
  feeAmount: string; // human (in output token)
};

export function useVaultSwap(pair?: PairInfo | null) {
  const chainId = useChainId();
  const { address } = useAccount();

  const [feeBps, setFeeBps] = useState<number>(30);
  const [bpsDenom, setBpsDenom] = useState<number>(10000);
  const loadingFeeRef = useRef(false);

  // Read fee config once
  useEffect(() => {
    (async () => {
      if (loadingFeeRef.current) return;
      loadingFeeRef.current = true;
      try {
        const [f, d] = await Promise.all([
          readContract(wagmiConfig, {
            address: VAULT_ADDRESS as Address,
            abi: VaultABI,
            functionName: 'SWAP_FEE_BPS',
          }) as Promise<bigint>,
          readContract(wagmiConfig, {
            address: VAULT_ADDRESS as Address,
            abi: VaultABI,
            functionName: 'BPS_DENOMINATOR',
          }) as Promise<bigint>,
        ]);
        setFeeBps(Number(f));
        setBpsDenom(Number(d));
      } catch (e) {
        // Defaults already set
        console.warn('useVaultSwap: fee read failed, using defaults', e);
      } finally {
        loadingFeeRef.current = false;
      }
    })();
  }, []);

  const getUsdPrice = useCallback(async (token: TokenInfo | undefined | null) => {
    if (!token) return null;
    const sym = aliasBaseToPyth(token.symbol);
    const p = await fetchPythLatestClose(`${sym}/USDC`);
    return p; // price in USDC (≈USD)
  }, []);

  // BUY base with quote: amountIn is in quote token, output is base token
  const quoteBuy = useCallback(async (amountInQuote: string): Promise<QuoteResult | null> => {
    if (!pair) return null;
    try {
      const [baseUsd, quoteUsd] = await Promise.all([
        getUsdPrice(pair.base),
        getUsdPrice(pair.quote),
      ]);
      if (!baseUsd || !quoteUsd || !Number.isFinite(baseUsd) || !Number.isFinite(quoteUsd)) return null;
      const amtIn = Number(amountInQuote || '0');
      if (!(amtIn > 0)) return null;
      // base price in quote units
      const baseInQuote = baseUsd / quoteUsd;
      // amountOutBase = quote_in / (base_in_quote)
      const grossOut = amtIn / baseInQuote;
      const fee = grossOut * (feeBps / bpsDenom);
      const netOut = grossOut - fee;
      return {
        price: baseInQuote,
        amountIn: amtIn.toString(),
        amountOut: netOut.toString(),
        feeBps,
        feeAmount: fee.toString(),
      };
    } catch (e) {
      console.error('quoteBuy error', e);
      return null;
    }
  }, [pair, feeBps, bpsDenom, getUsdPrice]);

  // SELL base for quote: amountIn is in base token, output is quote token
  const quoteSell = useCallback(async (amountInBase: string): Promise<QuoteResult | null> => {
    if (!pair) return null;
    try {
      const [baseUsd, quoteUsd] = await Promise.all([
        getUsdPrice(pair.base),
        getUsdPrice(pair.quote),
      ]);
      if (!baseUsd || !quoteUsd || !Number.isFinite(baseUsd) || !Number.isFinite(quoteUsd)) return null;
      const amtIn = Number(amountInBase || '0');
      if (!(amtIn > 0)) return null;
      // base price in quote units
      const baseInQuote = baseUsd / quoteUsd;
      // amountOutQuote = base_in * (base_in_quote)
      const grossOut = amtIn * baseInQuote;
      const fee = grossOut * (feeBps / bpsDenom);
      const netOut = grossOut - fee;
      return {
        price: baseInQuote,
        amountIn: amtIn.toString(),
        amountOut: netOut.toString(),
        feeBps,
        feeAmount: fee.toString(),
      };
    } catch (e) {
      console.error('quoteSell error', e);
      return null;
    }
  }, [pair, feeBps, bpsDenom, getUsdPrice]);

  const approveIfNeeded = useCallback(async (token: TokenInfo, spender: Address, required: bigint) => {
    if (!address) throw new Error('Wallet not connected');
    const allowance = await readContract(wagmiConfig, {
      address: token.address,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address as Address, spender],
    }) as bigint;

    if (allowance >= required) return true;

    const approvalHash = await writeContract(wagmiConfig, {
      account: address as Address,
      address: token.address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, required],
    });
    toast.info('Waiting for approval confirmation...');
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: approvalHash });
    if (receipt.status !== 'success') throw new Error('Token approval failed');
    return true;
  }, [address]);

  const swapExactTokensForTokens = useCallback(async (
    side: 'BUY' | 'SELL',
    amountInHuman: string
  ) => {
    if (!pair) throw new Error('Pair not set');
    if (!address) throw new Error('Wallet not connected');

    // Decide tokens per side
    const tokenIn = side === 'BUY' ? pair.quote : pair.base;
    const tokenOut = side === 'BUY' ? pair.base : pair.quote;
    const amountIn = parseUnits(amountInHuman || '0', tokenIn.decimals);

    if (amountIn <= 0n) throw new Error('Amount must be greater than zero');

    // Compute quote and minOut (exact as per "no slippage")
    const q = side === 'BUY'
      ? await quoteBuy(formatUnits(amountIn, tokenIn.decimals))
      : await quoteSell(formatUnits(amountIn, tokenIn.decimals));
    if (!q) throw new Error('Failed to quote with oracle price');

    const amountOutHuman = q.amountOut;
    const minAmountOut = parseUnits(amountOutHuman, tokenOut.decimals);

    // Approve if needed
    await approveIfNeeded(tokenIn, VAULT_ADDRESS as Address, amountIn);

    // Simulate
    await simulateContract(wagmiConfig, {
      address: VAULT_ADDRESS as Address,
      abi: VaultABI,
      functionName: 'swapExactTokensForTokens',
      args: [tokenIn.address, tokenOut.address, amountIn, minAmountOut],
    });

    // Execute
    const hash = await writeContract(wagmiConfig, {
      address: VAULT_ADDRESS as Address,
      abi: VaultABI,
      functionName: 'swapExactTokensForTokens',
      args: [tokenIn.address, tokenOut.address, amountIn, minAmountOut],
    });

    toast.info('Submitting swap...');
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
    if (receipt.status !== 'success') throw new Error('Swap failed on-chain');

    return { hash };
  }, [address, pair, approveIfNeeded, quoteBuy, quoteSell]);

  return {
    feeBps,
    bpsDenom,
    quoteBuy,
    quoteSell,
    swapExactTokensForTokens,
  };
}
