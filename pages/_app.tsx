import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import { NextPage } from "next/types";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import LandingHeader from "@/components/header/landing-header";
import { useRouter } from "next/router";
import VeGTXHeader from "@/components/header/vegtx-header";
import MobileWarningModal from "@/components/header/mobile-warning-modal";
import { wagmiConfig } from "@/configs/wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

// Monad Testnet chain ID
const paxeer = 80000; 

// Add type to support getLayout
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Mobile detection helper
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isVeGTXPage = router.pathname === "/veGTX";
  const isHomePage = router.pathname === "/" && !isVeGTXPage;
  const isWaitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'false';
  
  // Mobile warning state
  const [mobileWarningOpen, setMobileWarningOpen] = useState(false);

  // Detect mobile device on client-side
  useEffect(() => {
    // Only check on client
    if (typeof window === 'undefined') return;
    
    // Define trading pathnames that should trigger the warning
    const tradingPathnames = ['/markets', '/spot', '/perp', '/trade', '/exchange'];
    
    // Check if current path includes any trading paths
    const isOnTradingPage = tradingPathnames.some(path =>
      router.pathname.startsWith(path)
    );
    
    // If on a trading page and using a mobile device
    if (isOnTradingPage && isMobileDevice()) {
      // Redirect to home page - not allowing trading on mobile at all
      router.push('/');
    }
  }, [router]);
  
  // Listen for custom events from the LandingHeader
  useEffect(() => {
    const handleMobileTrigger = () => {
      setMobileWarningOpen(true);
    };
    
    // Add event listener for custom mobile trigger event
    window.addEventListener('gtx:mobileTrigger', handleMobileTrigger);
    
    // Cleanup 
    return () => {
      window.removeEventListener('gtx:mobileTrigger', handleMobileTrigger);
    };
  }, []);

  // Handle close of mobile warning
  const handleCloseMobileWarning = () => {
    setMobileWarningOpen(false);
  };

  return (
    <>
      {isHomePage ? <LandingHeader /> : isVeGTXPage ? <VeGTXHeader /> : <Header />}
      {children}
      {(isHomePage || isWaitlistMode) && <Footer />}
      <Toaster />
      
      {/* Mobile Warning Modal */}
      <MobileWarningModal 
        isOpen={mobileWarningOpen}
        onClose={handleCloseMobileWarning}
      />
    </>
  );
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Get getLayout from component, fallback to Main Layout
  const getLayout = Component.getLayout || ((page: ReactNode) => (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={paxeer} // Updated to use Rise Sepolia as default
          theme={darkTheme({
            accentColor: "white",
            accentColorForeground: "black",
          })}
        >
          <Head>
            <title>Orbex | Decentralized Trading on Paxeer</title>
            <meta name="description" content="The Most Capital Efficient Decentralized Trading Platform" />
            <link rel="icon" type="image/png" href="/logo/PrimeLogo.png" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          </Head>
          <ThemeProvider
            disableTransitionOnChange
            attribute="class"
            defaultTheme="dark"
            value={{ light: "light", dark: "dark" }}
          >
            <ToastProvider>
              <AppLayout>
                {page}
              </AppLayout>
            </ToastProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  ));

  return getLayout(<Component {...pageProps} />);
}

export default MyApp;