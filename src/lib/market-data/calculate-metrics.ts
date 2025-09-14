import { formatUnits } from 'viem';
import { PoolMetrics, ProcessedPool, ProcessedTrade } from './types';

/**
 * Calculate market metrics for a specific pool based on its trades
 * @param pool Processed pool information
 * @param trades Array of processed trades
 * @returns Object containing latest price and 24h volume
 */
export function calculatePoolMetrics(
  pool: ProcessedPool,
  trades: ProcessedTrade[]
): PoolMetrics {
  const poolTrades = trades.filter(
    trade => trade.pool === pool.orderBook || trade.poolId === pool.orderBook
  );

  const sortedTrades = [...poolTrades].sort((a, b) => b.timestamp - a.timestamp);

  // Use a default of 6 decimals if quoteDecimals is undefined
  const quoteDecimalsValue = pool.quoteDecimals ?? 6;

  let latestPrice = 0;
  if (sortedTrades.length > 0) {
    const p = String(sortedTrades[0].price);
    // If price already contains decimals, parse as Number; otherwise treat as integer with quoteDecimals
    latestPrice = p.includes('.') ? Number(p) : Number(formatUnits(BigInt(p), quoteDecimalsValue));
  }

  return {
    latestPrice,
  };
}
