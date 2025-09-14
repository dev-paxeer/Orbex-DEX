'use client';

import React, { useEffect, useState } from 'react';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/configs/wagmi';
import VaultSwapStandalone from '@/components/vault/vault-swap-standalone';

/**
 * Main application component that sets up providers and layout
 */
export default function SwapPage() {
    // Use state to track both the value and whether we've mounted
    const [mounted, setMounted] = useState(false);
    const [isComingSoon, setIsComingSoon] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsComingSoon(process.env.NEXT_PUBLIC_COMING_SOON_SWAP === 'true');
    }, []);

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <WagmiConfig config={wagmiConfig}>
            <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden z-50">
                <div className="relative">
                    <VaultSwapStandalone />
                </div>
            </div>
        </WagmiConfig>
    );
}