'use client';

import GTXRouterABI from '@/abis/gtx/clob/GTXRouterABI';
import OrderBookABI from '@/abis/gtx/clob/OrderBookABI';
import { wagmiConfig } from '@/configs/wagmi';
import { ContractName, getContractAddress } from '@/constants/contract/contract-address';
import { PoolsResponse } from '@/graphql/gtx/clob';
import { useMarketStore } from '@/store/market-store';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { readContract } from '@wagmi/core';
import { ArrowDown, ArrowUp, Menu, RefreshCw, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import { OrderSideEnum } from '../../../../lib/enums/clob.enum';
import { ClobDexComponentProps } from '../clob-dex';
import { DepthData } from '@/lib/market-api';
import { orderbookConfig } from '@/config/orderbookConfig';
import { aliasBaseToPyth } from '@/lib/pricing/pyth';

interface Order {
  price: number;
  size: number;
  total?: number;
  key?: string;
  isMatched?: boolean;
  lastUpdated?: number;
}

interface OrderBook {
  asks: Order[];
  bids: Order[];
  lastPrice: bigint;
  spread: bigint;
  lastUpdate?: number;
  previousAsks?: Order[];
  previousBids?: Order[];
}

type ViewType = 'both' | 'bids' | 'asks';
type DecimalPrecision = '0.01' | '0.1' | '1';

const STANDARD_ORDER_COUNT = 6;
const PRICE_MATCH_THRESHOLD = 0.1;
const TOTAL_MATCH_THRESHOLD = 10;

export type OrderBookDexProps = ClobDexComponentProps & {
  selectedPool: ProcessedPoolItem;
  poolsData?: PoolsResponse;
  poolsLoading?: boolean;
  poolsError?: Error | null;
};

interface EnhancedOrderBookDexProps {
  selectedPool?: ProcessedPoolItem;
  chainId: number | undefined;
  defaultChainId: number;
  poolsLoading: boolean;
  poolsError: Error | null;
  depthData: DepthData | null;
}

const EnhancedOrderBookDex = ({
  chainId,
  defaultChainId,
  depthData,
  selectedPool,
  poolsLoading,
  poolsError,
}: EnhancedOrderBookDexProps) => {
  const [mounted, setMounted] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('both');
  const [selectedDecimal, setSelectedDecimal] = useState<string>('0.01');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dynamicPriceOptions, setDynamicPriceOptions] = useState<string[]>(['0.01','0.1','1']);
  const previousOrderBook = useRef<OrderBook | null>(null);
  const previousPrice = useRef<number | null>(null);
  const priceDirection = useRef<'up' | 'down' | null>(null);
  
  const [orderBook, setOrderBook] = useState<OrderBook>({
    asks: [],
    bids: [],
    lastPrice: BigInt(0),
    spread: BigInt(0),
    lastUpdate: Date.now(),
  });
  // Depth scale: influences synthetic volume and price step. 1=light, 2=medium, 3=heavy
  const [depthScale, setDepthScale] = useState<number>(2);

  const { marketData, quoteDecimals, baseDecimals } = useMarketStore();

  // Custom functions to handle dynamic orderbook addresses
  const getBestPrice = async ({
    side,
  }: {
    side: OrderSideEnum;
  }): Promise<{ price: bigint; volume: bigint }> => {
    if (!selectedPool) {
      throw new Error('No pool selected');
    }

    try {
      const result = await readContract(wagmiConfig, {
        address: selectedPool.orderBook as `0x${string}`,
        abi: OrderBookABI,
        functionName: 'getBestPrice',
        args: [side] as const,
      });

      return result as { price: bigint; volume: bigint };
    } catch (error) {
      console.error('Error getting best price:', error);
      throw error;
    }
  };

  const formatPrice = (price: number | bigint): string => {
    const precision = Number.parseFloat(selectedDecimal);
    const priceNumber = typeof price === 'bigint' ? Number(price) : price;
    const roundedPrice = Math.round((priceNumber || 0) / precision) * precision;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(roundedPrice);
  };

  // Format already-normalized numeric prices (e.g., from marketData.price)
  const formatDisplayPriceNum = (price: number | null | undefined): string => {
    if (price == null || Number.isNaN(Number(price))) return '—';
    const precision = Number.parseFloat(selectedDecimal);
    const rounded = Math.round(Number(price) / precision) * precision;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(rounded);
  };
  
  // Format size with base asset decimals
  const formatSize = (size: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(size || 0);
  };

  // Generate synthetic depth around a last price
  const generateSyntheticDepth = useCallback((last: number) => {
    const levels = 10;
    // Step depends on asset price and depthScale
    const baseStepPct = last > 5000 ? 0.0002 : last > 500 ? 0.0005 : last > 50 ? 0.001 : 0.002;
    const stepPct = baseStepPct * depthScale; // scale 1..3
    const asks: Order[] = [];
    const bids: Order[] = [];
    for (let i = 1; i <= levels; i++) {
      const askP = last * (1 + stepPct * i);
      const bidP = last * (1 - stepPct * i);
      // Volume scales mildly with level and depthScale
      const volBase = last > 5000 ? 0.003 : last > 500 ? 0.05 : last > 50 ? 0.5 : 5;
      const jitter = 1 + Math.random() * 0.2;
      const vol = volBase * i * (depthScale / 2) * jitter;
      asks.push({ price: askP, size: vol });
      bids.push({ price: bidP, size: vol });
    }
    asks.sort((a, b) => a.price - b.price);
    bids.sort((a, b) => b.price - a.price);
    let at = 0, bt = 0;
    const asksWithTotal = asks.map(a => { at += a.size; return { ...a, total: at }; });
    const bidsWithTotal = bids.map(b => { bt += b.size; return { ...b, total: bt }; });
    const spreadPct = asksWithTotal[0] && bidsWithTotal[0]
      ? ((asksWithTotal[0].price - bidsWithTotal[0].price) / ((asksWithTotal[0].price + bidsWithTotal[0].price) / 2)) * 100
      : 0;
    return { asks: asksWithTotal, bids: bidsWithTotal, spreadPct };
  }, [depthScale]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute grouping options from config when pool changes
  useEffect(() => {
    if (!selectedPool) return;
    const baseSym = (selectedPool.baseSymbol || selectedPool.coin?.split('/')?.[0] || '').toUpperCase();
    const alias = aliasBaseToPyth(baseSym);
    const cfg = orderbookConfig[alias] || orderbookConfig.default;
    const opts = cfg.groupingOptions.map(o => o.value);
    setDynamicPriceOptions(opts);
    if (opts.length > 0) {
      setSelectedDecimal(opts[0]);
    }
  }, [selectedPool]);

  // Reset orderbook when selectedPool changes
  useEffect(() => {
    if (selectedPool) {
      setOrderBook({
        asks: [],
        bids: [],
        lastPrice: BigInt(0),
        spread: BigInt(0),
        lastUpdate: Date.now(),
      });
      previousOrderBook.current = null;
      previousPrice.current = null;
      priceDirection.current = null;
    }
  }, [selectedPool]);

  // Helper function to detect if an order should be highlighted (matched)
  const detectMatchedOrders = (
    newOrders: Order[],
    previousOrders: Order[] | undefined,
    now: number
  ): Order[] => {
    if (!previousOrders || previousOrders.length === 0) {
      return newOrders.map(order => ({
        ...order,
        key: `${order.price}-${now}`,
        isMatched: false,
        lastUpdated: now,
      }));
    }

    return newOrders.map(newOrder => {
      // Check if this is a new price level that didn't exist before
      const existingOrderAtSamePrice = previousOrders.find(
        prevOrder => Math.abs(prevOrder.price - newOrder.price) < PRICE_MATCH_THRESHOLD
      );

      // Check if there's a size change at this price level
      const isMatched = existingOrderAtSamePrice
        ? Math.abs((existingOrderAtSamePrice.total || 0) - (newOrder.total || 0)) /
            (existingOrderAtSamePrice.total || 1) >
          TOTAL_MATCH_THRESHOLD / 100
        : false;

      return {
        ...newOrder,
        key: isMatched
          ? `${newOrder.price}-${now}`
          : existingOrderAtSamePrice?.key || `${newOrder.price}-${now}`,
        isMatched,
        lastUpdated: isMatched ? now : existingOrderAtSamePrice?.lastUpdated || now,
      };
    });
  };

  // Update price direction whenever the price changes
  useEffect(() => {
    if (marketData?.price) {
      // Compare with previous price and set direction
      if (previousPrice.current !== null) {
        if (marketData.price < previousPrice.current) {
          priceDirection.current = 'down';
        } else if (marketData.price > previousPrice.current) {
          priceDirection.current = 'up';
        }
        // If equal, maintain the previous direction
      }

      // Store the current price for the next comparison
      previousPrice.current = marketData.price;
    }
  }, [marketData?.price]);

  // Process depth data from WebSocket to create order book
  useEffect(() => {
    if (!mounted || !selectedPool || !depthData) return;

    try {
      // Convert WebSocket depth data to order book format
      const asks: Order[] = [];
      const bids: Order[] = [];
      
      // Process asks from depth data
      if (depthData.asks && depthData.asks.length > 0) {
        depthData.asks.slice(0, STANDARD_ORDER_COUNT).forEach(([priceStr, sizeStr]) => {
          // Normalize price and size based on asset decimals
          const price = parseFloat(priceStr);
          const size = parseFloat(sizeStr);
          
          if (price > 0 && size > 0) {
            asks.push({ price, size });
          }
        });
      }
      
      // Process bids from depth data
      if (depthData.bids && depthData.bids.length > 0) {
        depthData.bids.slice(0, STANDARD_ORDER_COUNT).forEach(([priceStr, sizeStr]) => {
          // Normalize price and size based on asset decimals
          const price = parseFloat(priceStr);
          const size = parseFloat(sizeStr);
          
          if (price > 0 && size > 0) {
            bids.push({ price, size });
          }
        });
      }
      
      // Sort asks in ascending order by price
      asks.sort((a, b) => a.price - b.price);
      
      // Sort bids in descending order by price
      bids.sort((a, b) => b.price - a.price);
      
      // Calculate cumulative totals
      let bidTotal = 0;
      const bidsWithTotal = bids.map(bid => {
        bidTotal += bid.size;
        return { ...bid, total: bidTotal };
      });

      let askTotal = 0;
      const asksWithTotal = asks.map(ask => {
        askTotal += ask.size;
        return { ...ask, total: askTotal };
      });

      // Calculate spread
      const spread =
        asks[0]?.price && bids[0]?.price
          ? (
              (Math.abs(asks[0].price - bids[0].price) /
                ((asks[0].price + bids[0].price) / 2)) *
              100
            ).toFixed(2)
          : '0';
      const now = Date.now();

      // If depth appears empty or negligible, synthesize from last market price
      const totalSize = (arr: Order[]) => arr.reduce((s, o) => s + (o.size || 0), 0);
      const emptyDepth = asks.length === 0 || bids.length === 0 || (totalSize(asks) + totalSize(bids)) === 0;
      if (emptyDepth) {
        const last = typeof marketData?.price === 'number' && marketData.price > 0 ? marketData.price : (asks[0]?.price || bids[0]?.price || 0);
        if (last > 0) {
          const synth = generateSyntheticDepth(last);
          const now2 = Date.now();
          const matchedAsks = detectMatchedOrders(synth.asks, previousOrderBook.current?.asks, now2);
          const matchedBids = detectMatchedOrders(synth.bids, previousOrderBook.current?.bids, now2);
          setOrderBook({
            asks: matchedAsks,
            bids: matchedBids,
            lastPrice: BigInt(Math.round(last)),
            spread: BigInt(Math.round(synth.spreadPct * 100)),
            lastUpdate: now2,
            previousAsks: previousOrderBook.current?.asks,
            previousBids: previousOrderBook.current?.bids,
          });
          return;
        }
      }

      // Detect matched orders based on previous state
      const matchedAsks = detectMatchedOrders(
        asksWithTotal,
        previousOrderBook.current?.asks,
        now
      );
      const matchedBids = detectMatchedOrders(
        bidsWithTotal,
        previousOrderBook.current?.bids,
        now
      );

      const newOrderBook = {
        asks: matchedAsks,
        bids: matchedBids,
        lastPrice: asks.length > 0 && bids.length > 0
          ? BigInt(Math.round((asks[0].price + bids[0].price) / 2))
          : asks.length > 0
            ? BigInt(Math.round(asks[0].price))
            : bids.length > 0
              ? BigInt(Math.round(bids[0].price))
              : BigInt(0),
        // store spread as integer percent * 100 (basis points), consistent with display (/100)
        spread: BigInt(Math.round(Number(spread) * 100)),
        lastUpdate: now,
        previousAsks: previousOrderBook.current?.asks,
        previousBids: previousOrderBook.current?.bids,
      };

      setOrderBook(newOrderBook);
    } catch (error) {
      console.error('Error processing depth data:', error);
    }
  }, [depthData, mounted, selectedPool, baseDecimals, quoteDecimals]);
  
  // Update previous orderbook reference after state update
  useEffect(() => {
    if (orderBook && orderBook.lastUpdate) {
      previousOrderBook.current = {
        asks: orderBook.asks,
        bids: orderBook.bids,
        lastPrice: orderBook.lastPrice,
        spread: orderBook.spread,
        lastUpdate: orderBook.lastUpdate,
      };
    }
  }, [orderBook]);

  const toggleView = useCallback(() => {
    const views: ViewType[] = ['both', 'bids', 'asks'];
    const currentIndex = views.indexOf(viewType);
    setViewType(views[(currentIndex + 1) % views.length]);
  }, [viewType]);

  const isLoading = poolsLoading;

  if (poolsError) {
    return (
      <div className="w-full rounded-xl bg-gray-950 p-4 text-white border border-gray-800/30">
        <p className="text-rose-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Error loading data
        </p>
        <p className="mt-2 text-sm text-gray-300">
          {poolsError instanceof Error ? poolsError.message : 'Unknown error'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-hidden rounded-b-xl bg-gradient-to-b from-gray-950 to-gray-900 text-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-800/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleView}
            className="rounded-lg bg-gray-700/40 py-1.5 px-2 text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-gray-300 border border-gray-700/50"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-300">
            {viewType === 'both'
              ? 'Bid/Ask'
              : viewType === 'asks'
              ? 'Asks Only'
              : 'Bids Only'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Grouping dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(o => !o)}
              className="flex items-center gap-1 rounded-lg bg-gray-700/40 py-1 px-2 text-xs text-gray-300 hover:bg-gray-800/50 border border-gray-700/50"
              aria-label="Select price grouping"
            >
              <span>Group: {selectedDecimal}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border border-gray-700/50 bg-gray-900 shadow-lg">
                {dynamicPriceOptions.map(option => (
                  <button
                    key={option}
                    className="w-full px-4 py-2 text-left text-xs text-gray-200 transition-colors duration-200 hover:bg-gray-800 hover:text-white"
                    onClick={() => {
                      setSelectedDecimal(option);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Depth dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                const el = e.currentTarget.nextElementSibling as HTMLDivElement | null;
                if (el) el.classList.toggle('hidden');
              }}
              className="flex items-center gap-1 rounded-lg bg-gray-700/40 py-1 px-2 text-xs text-gray-300 hover:bg-gray-800/50 border border-gray-700/50"
              aria-label="Select depth density"
            >
              <span>Depth: {depthScale === 1 ? 'Light' : depthScale === 2 ? 'Medium' : 'Heavy'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute right-0 top-full z-50 mt-1 hidden rounded-lg border border-gray-700/50 bg-gray-900 shadow-lg">
              {[{label:'Light',v:1},{label:'Medium',v:2},{label:'Heavy',v:3}].map(opt => (
                <button
                  key={opt.v}
                  className="w-full px-4 py-2 text-left text-xs text-gray-200 transition-colors duration-200 hover:bg-gray-800 hover:text-white"
                  onClick={(e) => {
                    setDepthScale(opt.v);
                    const menu = (e.currentTarget.parentElement) as HTMLDivElement | null;
                    if (menu) menu.classList.add('hidden');
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="py-2">
        {/* Loading state */}
        {isLoading || !selectedPool ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {(viewType === 'both' || viewType === 'asks') && (
              <div>
                {/* Column Headers for Asks */}
                <div className="grid grid-cols-3 border-y border-gray-800/30 bg-gray-900/20 px-4 py-2 text-xs font-medium text-gray-300">
                  <div>Price</div>
                  <div className="text-center">Size</div>
                  <div className="text-right">Total</div>
                </div>

                <div className="flex flex-col-reverse space-y-[2px] space-y-reverse">
                  {orderBook.asks.slice(0, 10).map((ask, i) => {
                    const maxTotal = orderBook.asks.reduce(
                      (max, curr) =>
                        curr.total && max
                          ? curr.total > max
                            ? curr.total
                            : max
                          : curr.total || max || 1,
                      0
                    );

                    // Determine if this order should be highlighted
                    const isHighlighted = ask.isMatched;

                    return (
                      <div key={ask.key || `ask-${i}`} className="group relative">
                        {/* Volume bar - not animated */}
                        <div
                          className="absolute bottom-0 left-0 top-0 bg-rose-500/10 transition-all group-hover:bg-rose-500/20"
                          style={{
                            width: `${((ask.total || 0) * 100) / maxTotal}%`,
                          }}
                        />

                        {/* Only add the highlight animation when matched */}
                        {isHighlighted && (
                          <div className="absolute inset-0 animate-highlight-ask"></div>
                        )}

                        <div className="relative grid grid-cols-3 px-4 py-1 text-xs">
                          <div className="font-medium text-rose-400">
                            {formatPrice(ask.price)}
                          </div>
                          <div className="text-center text-gray-200">
                            {formatSize(ask.size)}
                          </div>
                          <div className="text-right text-gray-200">
                            {ask.total ? formatSize(ask.total) : '0.00'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewType === 'both' && (
              <div className="my-2 border-y border-gray-800/30 bg-gray-900/40 px-4 py-2 text-xs">
                {/* Single row with price (with arrow) and spread */}
                <div className="flex justify-between text-gray-200">
                  <div className="flex items-center gap-4">
                    {/* Price with arrow */}
                    <div className="flex items-center">
                      {typeof marketData?.price === 'number' && Number.isFinite(marketData.price) && (
                        <span
                          className={`font-medium flex items-center ${
                            priceDirection.current === 'down'
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {formatDisplayPriceNum(marketData.price)}
                          {priceDirection.current &&
                            (priceDirection.current === 'up' ? (
                              <ArrowUp className="h-3 w-3 ml-1" />
                            ) : (
                              <ArrowDown className="h-3 w-3 ml-1" />
                            ))}
                        </span>
                      )}
                    </div>

                    {/* Spread */}
                    <div className="flex items-center gap-1">
                      <span>Spread: </span>
                      <span className="font-medium text-white">
                        {(Number(orderBook.spread) / 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(viewType === 'both' || viewType === 'bids') && (
              <div>
                {/* Column Headers for Bids */}
                <div className="grid grid-cols-3 border-y border-gray-800/30 bg-gray-900/20 px-4 py-2 text-xs font-medium text-gray-300">
                  <div>Price</div>
                  <div className="text-center">Size</div>
                  <div className="text-right">Total</div>
                </div>

                <div className="space-y-[2px]">
                  {orderBook.bids.slice(0, 10).map((bid, i) => {
                    const maxTotal = orderBook.bids.reduce(
                      (max, curr) =>
                        curr.total && max
                          ? curr.total > max
                            ? curr.total
                            : max
                          : curr.total || max || 1,
                      0
                    );

                    // Determine if this order should be highlighted
                    const isHighlighted = bid.isMatched;

                    return (
                      <div key={bid.key || `bid-${i}`} className="group relative">
                        {/* Volume bar - not animated */}
                        <div
                          className="absolute bottom-0 left-0 top-0 bg-emerald-500/10 transition-all group-hover:bg-emerald-500/20"
                          style={{
                            width: `${((bid.total || 0) * 100) / maxTotal}%`,
                          }}
                        />

                        {/* Only add the highlight animation when matched */}
                        {isHighlighted && (
                          <div className="absolute inset-0 animate-highlight-bid"></div>
                        )}

                        <div className="relative grid grid-cols-3 px-4 py-1 text-xs">
                          <div className="font-medium text-emerald-400">
                            {formatPrice(bid.price)}
                          </div>
                          <div className="text-center text-gray-200">
                            {formatSize(bid.size)}
                          </div>
                          <div className="text-right text-gray-200">
                            {bid.total ? formatSize(bid.total) : '0.00'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add CSS for the blinking animations with more subtle effects */}
      <style jsx global>{`
        @keyframes highlight-bid {
          0% {
            background-color: rgba(16, 185, 129, 0.1);
          }
          50% {
            background-color: rgba(16, 185, 129, 0.25);
          }
          100% {
            background-color: rgba(16, 185, 129, 0.1);
          }
        }

        @keyframes highlight-ask {
          0% {
            background-color: rgba(239, 68, 68, 0.1);
          }
          50% {
            background-color: rgba(239, 68, 68, 0.25);
          }
          100% {
            background-color: rgba(239, 68, 68, 0.1);
          }
        }

        .animate-highlight-bid {
          animation: highlight-bid 1.2s ease-in-out;
        }

        .animate-highlight-ask {
          animation: highlight-ask 1.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default EnhancedOrderBookDex;
