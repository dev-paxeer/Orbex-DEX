// app/spot/page.tsx
'use client';

import { useEffect, useState, Suspense } from "react";
import ClobDex from "@/components/clob-dex/clob-dex";

export default function Spot() {
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
        {/* ClobDex component with conditional blur effect */}
        <ClobDex />
      </div>
    </div>
  );
}