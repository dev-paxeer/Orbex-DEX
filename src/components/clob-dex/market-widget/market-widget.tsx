'use client';

import { Ticker24hrData } from '@/lib/market-api';
import { formatNumber } from '@/lib/utils';
import { Pool } from '@/store/market-store';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { ClobDexComponentProps } from '../clob-dex';
import { PairDropdown } from './pair-dropdown';

const SkeletonLoader = () => (
  <div className="w-full h-16 bg-gray-100 dark:bg-[#1B2028] rounded-t-lg animate-pulse flex items-center px-4 space-x-8">
    {[...Array(7)].map((_, i) => (
      <div key={i} className="h-8 bg-gray-300 dark:bg-gray-700/50 rounded w-32" />
    ))}
  </div>
);

export interface MarketDataWidgetProps extends ClobDexComponentProps {
  poolId: string | null;
  selectedPool?: ProcessedPoolItem;
  ticker24hr?: Ticker24hrData;
}

export default function MarketDataWidget({
  selectedPool,
  ticker24hr,
}: MarketDataWidgetProps) {
  const router = useRouter();

  const poolsWithDecimals = useMemo<Pool[]>(() => {
    if (!selectedPool) return [];
    return [selectedPool];
  }, [selectedPool]);

  const handlePoolChange = (poolId: string) => {
    router.push(`/spot/${poolId}`);
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-950 to-gray-900 border border-gray-700/30 text-white rounded-t-lg shadow-md">
      {/* Market data display with integrated selector */}
      <div className="flex items-center h-16 px-4">
        <div className="flex items-center space-x-2 w-72">
          <div className="flex flex-col">
            {/* Integrated trading pair selector using shadcn/ui */}
            <div className="flex items-center gap-2">
              {poolsWithDecimals.length > 0 ? (
                <div className="flex items-center gap-2">
                  <PairDropdown
                    pairs={poolsWithDecimals}
                    selectedPairId={selectedPool?.id || ''}
                    onPairSelect={handlePoolChange}
                  />
                  <span className="text-emerald-600 dark:text-emerald-500 text-xs p-1 bg-emerald-100 dark:bg-emerald-500/10 rounded">
                    Spot
                  </span>
                </div>
              ) : (
                <div className="h-9 w-[180px] bg-gray-800/50 animate-pulse rounded"></div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 justify-center">
          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className="font-semibold text-[15px] pb-1 underline">Price</div>
            <div className="text-gray-900 dark:text-white">
              ${formatNumber(Number(ticker24hr?.lastPrice ?? 0))}
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-400 text-xs w-44">
            <div className="font-semibold text-[15px] pb-1">24h High</div>
            <div className="text-green-600 dark:text-[#5BBB6F]">
              ${formatNumber(Number(ticker24hr?.highPrice ?? 0))}
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-400 text-xs w-44">
            <div className="font-semibold text-[15px] pb-1">24h Low</div>
            <div className="text-red-600 dark:text-[#FF6978]">
              ${formatNumber(Number(ticker24hr?.lowPrice ?? 0))}
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-400 text-xs w-32">
            <div className="font-semibold text-[15px] pb-1">24h Volume</div>
            <div className="text-gray-900 dark:text-white">
              ${formatNumber(ticker24hr?.quoteVolume ?? 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
