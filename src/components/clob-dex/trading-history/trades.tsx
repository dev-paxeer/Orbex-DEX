'use client';

import { EXPLORER_URL } from '@/constants/explorer-url';
import { TradeItem } from '@/graphql/gtx/clob';
import { formatPrice, formatQuantity } from '@/lib/utils';
import { useMarketStore } from '@/store/market-store';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import {
  BookOpen,
  ChevronDown,
  Clock,
  ExternalLink,
  Loader2,
  Wallet2
} from 'lucide-react';
import { useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { formatDate } from '../../../../helper';
import { ClobDexComponentProps } from '../clob-dex';

export interface TradesProps extends ClobDexComponentProps {
  userTradesData?: TradeItem[];
  tradesLoading: boolean;
  tradesError: Error | null;
  selectedPool?: ProcessedPoolItem;
}

const TradeHistoryTable = ({
  address,
  chainId,
  defaultChainId,
  userTradesData,
  tradesLoading,
  tradesError,
  selectedPool,
}: TradesProps) => {
  const { address: accountAddress } = useAccount();
  type SortDirection = 'asc' | 'desc';
  type SortableKey = 'timestamp' | 'quantity' | 'price';

  const [sortConfig, setSortConfig] = useState<{
    key: SortableKey;
    direction: SortDirection;
  }>({
    key: 'timestamp',
    direction: 'desc',
  });

  const { baseDecimals, quoteDecimals } = useMarketStore();

  const handleSort = (key: SortableKey) => {
    setSortConfig(prevConfig => ({
      key: key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (!address) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Wallet2 className="h-12 w-12 text-gray-400" />
          <p className="text-lg text-gray-200">
            Connect your wallet to view trade history
          </p>
        </div>
      </div>
    );
  }

  if (tradesLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-800/30 bg-gray-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-lg text-gray-200">Loading your trade history...</p>
        </div>
      </div>
    );
  }

  if (tradesError) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-rose-800/30 bg-rose-900/20 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
          <p className="text-lg text-rose-200">
            {tradesError instanceof Error ? tradesError.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  // Select trades based on active tab
  const trades = userTradesData || [];

  const filteredTrades = trades;
  
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    const key = sortConfig.key;

    if (key === 'timestamp') {
      return sortConfig.direction === 'asc'
        ? a.timestamp - b.timestamp
        : b.timestamp - a.timestamp;
    }
    if (key === 'quantity') {
      const aValue = Number(a.order.quantity || 0);
      const bValue = Number(b.order.quantity || 0);
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
    if (key === 'price') {
      const aValue = Number(a.order.price || 0);
      const bValue = Number(b.order.price || 0);
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Tab selector for All Trades vs My Trades */}
      <div className="w-full overflow-hidden rounded-lg border border-gray-800/30 bg-gray-900/20 shadow-lg">
        <div className="grid grid-cols-6 gap-4 border-b border-gray-800/30 bg-gray-900/40 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => handleSort('timestamp')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <Clock className="h-4 w-4" />
            <span>Time</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === 'timestamp' && sortConfig.direction === 'asc'
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Pair</div>
          <button
            onClick={() => handleSort('price')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Price</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === 'price' && sortConfig.direction === 'asc'
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Side</div>
          <button
            onClick={() => handleSort('quantity')}
            className="flex items-center gap-1 text-sm font-medium text-gray-200 transition-colors hover:text-gray-100"
          >
            <span>Amount</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                sortConfig.key === 'quantity' && sortConfig.direction === 'asc'
                  ? 'rotate-180'
                  : ''
              }`}
            />
          </button>
          <div className="text-sm font-medium text-gray-200">Transaction</div>
        </div>

        {/* Table Body */}
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-800/50">
          {sortedTrades.length > 0 ? (
            sortedTrades.map(trade => {
              const isBuy = trade?.order?.side === 'Buy';
              const pair = selectedPool?.coin;
              
              return (
                <div
                  key={`${trade.id}-${trade.timestamp}`}
                  className="grid grid-cols-6 gap-4 border-b border-gray-800/20 px-4 py-3 text-sm transition-colors hover:bg-gray-900/40"
                >
                  <div className="text-gray-200">
                    {formatDate(trade.timestamp?.toString())}
                  </div>
                  <div className="text-gray-200">{pair}</div>
                  <div className="font-medium text-white">
                    ${formatPrice(String(Number(trade.order.price || 0)))}
                  </div>
                  <div className={isBuy ? 'text-emerald-400' : 'text-rose-400'}>
                    {isBuy ? 'Buy' : 'Sell'}
                  </div>
                  <div className="font-medium text-white">
                    {formatQuantity(String(Number(trade.order.quantity || 0)))}
                  </div>
                  <div className="text-blue-400 hover:text-blue-300 transition-colors truncate">
                    <a
                      href={`${EXPLORER_URL(chainId ?? defaultChainId)}${
                        trade.transactionId
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {`${trade.transactionId?.slice(0, 6)}...${trade.transactionId?.slice(
                        -4
                      )}`}{' '}
                      <ExternalLink className="w-4 h-4 inline" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-[200px] items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <BookOpen className="h-8 w-8 text-gray-400" />
                <p className="text-gray-200">No trades found for this pool</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeHistoryTable;
