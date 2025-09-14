import { http, createConfig } from 'wagmi';
import { arbitrumSepolia, sepolia, Chain } from 'wagmi/chains';
import {
	bitgetWallet,
	coinbaseWallet,
	metaMaskWallet,
	okxWallet,
	rabbyWallet,
	rainbowWallet,
	walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { ENABLED_CHAINS } from '@/constants/contract/contract-address';

export const projectId = 'c8d08053460bfe0752116d730dc6393b';

// GTX chain
const paxeer: Chain = {
	id: 80000,
	name: 'Paxeer',
	nativeCurrency: {
		decimals: 18,
		name: 'Paxeer',
		symbol: 'PAX',
	},
	rpcUrls: {
		default: {
			http: ['https://v1-rpc.paxeer.app'],
		},
		public: {
			http: ['https://v1-rpc.paxeer.app'],
		},
	},
	blockExplorers: {
		default: {
			name: 'Paxeer Explorer',
			url: 'https://paxscan.paxeer.app/',
		},
	},
	testnet: true,
};

const connectors = connectorsForWallets(
	[
		{
			groupName: 'Recommended',
			wallets: [okxWallet, rabbyWallet],
		},
		{
			groupName: 'Others',
			wallets: [
				walletConnectWallet,
				metaMaskWallet,
				coinbaseWallet,
				rainbowWallet,
				bitgetWallet,
			],
		},
	],
	{ appName: 'RainbowKit App', projectId: projectId }
);

const allChains = [
	paxeer,
];	

const enabledChains = ENABLED_CHAINS
	? allChains.filter((chain) =>
			ENABLED_CHAINS?.split(',').includes(chain.id.toString())
	  )
	: [paxeer];

const transports = enabledChains.reduce((acc, chain) => {
	acc[chain.id] = http(chain.rpcUrls.default.http[0]);
	return acc;
}, {} as Record<number, ReturnType<typeof http>>);

export const wagmiConfig = createConfig({
	chains: enabledChains as [Chain, ...Chain[]],
	connectors: connectors,
	transports,
});
