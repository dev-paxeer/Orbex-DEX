'use client';

import { useEffect, useState } from "react";
import Perpetual from "@/components/perpetual/perpetual";
import { Hexagon, Droplets, LineChart, ChartBarBig } from "lucide-react";
import { FEATURE_FLAGS } from "@/constants/features/features-config";

const PerpetualPage = () => {
    // Use state to track both the value and whether we've mounted
    const [mounted, setMounted] = useState(false);
    const [isComingSoon, setIsComingSoon] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsComingSoon(FEATURE_FLAGS.COMING_SOON_PERPETUAL);
    }, []);

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden z-50">
            {/* Main content area */}
            <div className="relative">
                {/* Perpetual component with conditional blur effect */}
                <div className={isComingSoon ? "blur-sm" : ""}>
                    <Perpetual />
                </div>
                
                {/* Coming Soon overlay positioned over the Perpetual */}
                {isComingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center -mt-44 z-10">
                        <div className="bg-slate-900/40 backdrop-blur-xl max-w-md w-full shadow-[0_0_30px_rgba(56,189,248,0.03)] border border-cyan-500/10 rounded-xl">
                            <div className="p-12 text-center">
                                <div className="relative inline-block mb-8">
                                    <div className="absolute inset-0 bg-cyan-500/10 blur-[24px] rounded-full"></div>
                                    <img 
                                        src="/logo/PrimeLogo.png" 
                                        className="w-24 h-24 relative z-10" 
                                        alt="PrimeSwap Logo"
                                        width={96}
                                        height={96}
                                    />
                                </div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                                    Coming Soon
                                </h2>
                                <p className="text-cyan-100/80 mb-8">Earn features are currently under development</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerpetualPage;