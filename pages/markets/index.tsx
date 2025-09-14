import { useEffect, useState } from "react";
import MarketList from "@/components/markets/markets";
import Image from "next/image";
import { fetchAndProcessMarketData } from "@/lib/market-data";
import { DEFAULT_CHAIN } from "@/constants/contract/contract-address";
import { MarketData } from "@/lib/market-data";

// Define the props type
interface MarketsProps {
  initialMarketData: MarketData[];
}

// Add getStaticProps for ISR
export async function getStaticProps() {
  try {
    // Fetch market data at build time
    const marketData = await fetchAndProcessMarketData(Number(DEFAULT_CHAIN));
    
    return {
      props: {
        initialMarketData: marketData,
      },
      // Revalidate every 30 seconds (ISR)
      revalidate: 30,
    };
  } catch (error) {
    console.error("Error fetching market data:", error);
    return {
      props: {
        initialMarketData: [],
      },
      revalidate: 30,
    };
  }
}

const Markets = ({ initialMarketData }: MarketsProps) => {
  // Use state to track both the value and whether we've mounted
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden z-50">
      {/* Main content area */}
      <div className="relative">
        <div>
          <MarketList initialMarketData={initialMarketData} />
        </div>
      </div>
    </div>
  );
};

export default Markets;
