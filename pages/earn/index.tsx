'use client';

import { useEffect, useState } from "react";
import GTXEarn from "@/components/earn/earn";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const GTXEarnPage = () => {
    // Use state to track both the value and whether we've mounted
    const [mounted, setMounted] = useState(false);
    const [isComingSoon, setIsComingSoon] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsComingSoon(process.env.NEXT_PUBLIC_COMING_SOON_EARN === 'true');
    }, []);

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden z-50">
            {/* Main content area */}
            <div className="relative">
                {/* GTXEarn component with conditional blur effect */}
                <div className={isComingSoon ? "blur-sm" : ""}>
                    <GTXEarn />
                </div>
                
                {/* Coming Soon overlay positioned over the GTXEarn */}
                {isComingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center -mt-44 z-10">
                        <div className="bg-[#0a0a0a]/60 backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(185,121,240,0.08)] border border-[#b979f0]/30 rounded-xl">
                            <div className="p-12 text-center">
                                <div className="relative inline-block mb-8">
                                    <div className="absolute inset-0 bg-[#b979f0]/10 blur-[24px] rounded-full"></div>
                                    <img 
                                        src="/logo/PrimeLogo.png" 
                                        className="w-24 h-24 relative z-10" 
                                        alt="PrimeSwap Logo"
                                        width={96}
                                        height={96}
                                    />
                                </div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#b979f0] to-[#4c30ad] bg-clip-text text-transparent mb-4">
                                    Coming Soon
                                </h2>
                                <p className="text-[#b979f0]/80 mb-8">Earn features are currently under development</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GTXEarnPage;