/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false };
        return config;
    },
    publicRuntimeConfig: {
        NEXT_PUBLIC_DEFAULT_CHAIN: process.env.NEXT_PUBLIC_DEFAULT_CHAIN,
        NEXT_PUBLIC_USE_SUBGRAPH: process.env.NEXT_PUBLIC_USE_SUBGRAPH,
        NEXT_PUBLIC_CLOB_31337_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_31337_INDEXER_URL,
        NEXT_PUBLIC_CLOB_31338_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_31338_INDEXER_URL,
        NEXT_PUBLIC_CLOB_1020201_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_1020201_INDEXER_URL,
        NEXT_PUBLIC_CLOB_50002_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_50002_INDEXER_URL,
        NEXT_PUBLIC_CLOB_11155931_INDEXER_URL: process.env.NEXT_PUBLIC_CLOB_11155931_INDEXER_URL,
        NEXT_PUBLIC_CLOB_31337_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_31337_KLINE_URL,
        NEXT_PUBLIC_CLOB_31338_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_31338_KLINE_URL,
        NEXT_PUBLIC_CLOB_1020201_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_1020201_KLINE_URL,
        NEXT_PUBLIC_CLOB_50002_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_50002_KLINE_URL,
        NEXT_PUBLIC_CLOB_11155931_KLINE_URL: process.env.NEXT_PUBLIC_CLOB_11155931_KLINE_URL,
        NEXT_PUBLIC_GTX_ROUTER_31338_ADDRESS: process.env.NEXT_PUBLIC_GTX_ROUTER_31338_ADDRESS,
        NEXT_PUBLIC_GTX_ROUTER_1020201_ADDRESS: process.env.NEXT_PUBLIC_GTX_ROUTER_1020201_ADDRESS,
        NEXT_PUBLIC_BALANCE_MANAGER_31338_ADDRESS: process.env.NEXT_PUBLIC_BALANCE_MANAGER_31338_ADDRESS,
        NEXT_PUBLIC_BALANCE_MANAGER_1020201_ADDRESS: process.env.NEXT_PUBLIC_BALANCE_MANAGER_1020201_ADDRESS,
        NEXT_PUBLIC_POOL_MANAGER_31338_ADDRESS: process.env.NEXT_PUBLIC_POOL_MANAGER_31338_ADDRESS,
        NEXT_PUBLIC_POOL_MANAGER_1020201_ADDRESS: process.env.NEXT_PUBLIC_POOL_MANAGER_1020201_ADDRESS,
        NEXT_PUBLIC_EXPLORER_31338_URL: process.env.NEXT_PUBLIC_EXPLORER_31338_URL,
        NEXT_PUBLIC_EXPLORER_1020201_URL: process.env.NEXT_PUBLIC_EXPLORER_1020201_URL,
        NEXT_PUBLIC_EXPLORER_50002_URL: process.env.NEXT_PUBLIC_EXPLORER_50002_URL,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    async rewrites() {
        return [
            {
                source: '/charting_library/:path*',
                destination: 'https://chart.gtxdex.xyz/charting_library/:path*',
            },
        ];
    },
};

module.exports = nextConfig;