'use client';

import { ButtonConnectWallet } from '@/components/button-connect-wallet.tsx/button-connect-wallet';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BalanceItem,
} from '@/graphql/gtx/clob';
import { ProcessedPoolItem } from '@/types/gtx/clob';
import { Wallet, History } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ClobDexComponentProps } from '../clob-dex';
import BalancesHistoryTable from './balances';
import UserSwaps from './user-swaps';

export interface TradingHistoryProps extends ClobDexComponentProps {
  balanceData: BalanceItem[];
  balancesLoading: boolean;
  balancesError: Error | null;
  selectedPool?: ProcessedPoolItem;
}

export default function TradingHistory({
  address,
  chainId,
  defaultChainId,
  balanceData,
  balancesLoading,
  balancesError,
  selectedPool,
}: TradingHistoryProps) {
  const { isConnected } = useAccount();

  const solidColorConfig = {
    backgroundColor: 'bg-transparent',
    hoverBackgroundColor: 'hover:bg-slate-800/50',
    textColor: 'text-white',
    mode: 'solid' as const,
  };

  return (
    <div className="relative mt-1">
      <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-gray-500/5 blur-3xl" />
      <div className="absolute -right-32 top-0 h-64 w-64 rounded-full bg-gray-500/5 blur-3xl" />

      <Card className="overflow-hidden rounded-xl border border-gray-800/30 bg-gradient-to-b from-gray-950 to-gray-900 shadow-lg backdrop-blur-sm">
        <Tabs defaultValue="my-swaps" className="w-full">
          <div className="space-y-3 p-3">
            <div className="relative">
              <TabsList className="flex w-full justify-start gap-6 bg-transparent">
                <TabsTrigger
                  value="balances"
                  className="group relative flex items-center gap-2 rounded-lg bg-transparent px-3 py-2 text-lg font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm">Balances</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
                <TabsTrigger
                  value="my-swaps"
                  className="group relative flex items-center gap-2 rounded-lg bg-transparent px-3 py-2 text-lg font-medium text-gray-300 transition-all hover:text-gray-200 data-[state=active]:text-white"
                >
                  <History className="h-5 w-5" />
                  <span className="text-sm">My Swaps</span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transform rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-transform duration-300 ease-out group-hover:scale-x-100 group-data-[state=active]:scale-x-100" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="my-swaps"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-0 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <UserSwaps
                  address={address}
                  chainId={chainId}
                  defaultChainId={defaultChainId}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-800/30 bg-gray-900/20 p-8 text-center">
                    <History className="h-12 w-12 text-gray-400" />
                    <p className="text-lg text-gray-200">
                      Connect your wallet to see your swaps
                    </p>
                    <ButtonConnectWallet
                      colors={solidColorConfig}
                      className="border border-slate-500"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="balances"
              className="rounded-lg border border-gray-800/30 bg-gray-900/20 p-0 transition-all duration-500 animate-in fade-in-0"
            >
              {isConnected ? (
                <BalancesHistoryTable
                  address={address}
                  chainId={chainId}
                  defaultChainId={defaultChainId}
                  balancesResponse={balanceData}
                  balancesLoading={balancesLoading}
                  balancesError={balancesError}
                  selectedPool={selectedPool}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-800/30 bg-gray-900/20 p-8 text-center">
                    <Wallet className="h-12 w-12 text-gray-400" />
                    <p className="text-lg text-gray-200">
                      Connect your wallet to see your balances
                    </p>
                    <ButtonConnectWallet
                      colors={solidColorConfig}
                      className="border border-slate-500"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Bottom Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950/50 to-transparent" />
    </div>
  );
}
