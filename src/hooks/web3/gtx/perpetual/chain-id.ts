import { DEFAULT_CHAIN, ContractName, getContractAddress, ROUTER_ADDRESS as GLOBAL_ROUTER_ADDRESS, ORACLE_ADDRESS as GLOBAL_ORACLE_ADDRESS } from "@/constants/contract/contract-address";
import { getTokenAddresses } from "@/helper/token-helper";
import type { HexAddress } from "@/types/general/address";

// Define chain IDs for various networks
export const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  ARBITRUM_SEPOLIA: 421614,
  LOCAL_ANVIL: 31337,
  CONDUIT: 911867,
  RISE_SEPOLIA: 11155931,
  MONAD_TESTNET: 10143,
};

// Get the current chain ID from contract-address.json or fallback to environment variable
export const CURRENT_CHAIN_ID = parseInt(DEFAULT_CHAIN) || 
  (process.env.NEXT_PUBLIC_CHAIN_ID 
    ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) 
    : CHAIN_IDS.MONAD_TESTNET);

// Contract addresses organized by chain ID
export const CONTRACT_ADDRESSES = {
  // Ethereum Mainnet
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with actual mainnet address
    ORACLE_ADDRESS: '0x' as const,  // Replace with actual mainnet address
  },
  
  // Ethereum Sepolia
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Sepolia address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Sepolia address
  },
  
  // Arbitrum Sepolia
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Arbitrum Sepolia address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Arbitrum Sepolia address
  },
  
  // Monad Testnet
  [CHAIN_IDS.MONAD_TESTNET]: {
    ROUTER_ADDRESS: '0x123456789abcdef0123456789abcdef012345678' as const, // Replace with actual Monad address
    ORACLE_ADDRESS: '0xabcdef0123456789abcdef0123456789abcdef01' as const, // Replace with actual Monad address
  },
  
  // Local development
  [CHAIN_IDS.LOCAL_ANVIL]: {
    ROUTER_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const, // Default Anvil deployment address
    ORACLE_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const, // Default Anvil deployment address
  },
  
  // Conduit
  [CHAIN_IDS.CONDUIT]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Conduit address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Conduit address
  },
  
  // Rise Sepolia
  [CHAIN_IDS.RISE_SEPOLIA]: {
    ROUTER_ADDRESS: '0x' as const,  // Replace with Rise Sepolia address
    ORACLE_ADDRESS: '0x' as const,  // Replace with Rise Sepolia address
  },
};

// Export current chain's router and oracle addresses
const CURRENT_MAPPING = CONTRACT_ADDRESSES[CURRENT_CHAIN_ID] as { ROUTER_ADDRESS?: HexAddress; ORACLE_ADDRESS?: HexAddress } | undefined;

export const ROUTER_ADDRESS: HexAddress = (CURRENT_MAPPING?.ROUTER_ADDRESS as HexAddress) || (GLOBAL_ROUTER_ADDRESS as HexAddress);
export const ORACLE_ADDRESS: HexAddress = (CURRENT_MAPPING?.ORACLE_ADDRESS as HexAddress) || (GLOBAL_ORACLE_ADDRESS as HexAddress);

// Get token addresses for the current chain
const { WETH: WETH_ADDRESS, WBTC: WBTC_ADDRESS, USDC: USDC_ADDRESS } = getTokenAddresses(CURRENT_CHAIN_ID.toString());

// Export token addresses for convenience
export { WETH_ADDRESS, WBTC_ADDRESS, USDC_ADDRESS };

// Export common token list for the current chain
export const COMMON_TOKENS = [
  { 
    address: WETH_ADDRESS as `0x${string}`, 
    symbol: 'WETH', 
    name: 'Wrapped Ether',
    decimals: 18 
  },
  { 
    address: WBTC_ADDRESS as `0x${string}`, 
    symbol: 'WBTC', 
    name: 'Wrapped Bitcoin',
    decimals: 8
  },
  { 
    address: USDC_ADDRESS as `0x${string}`, 
    symbol: 'USDC', 
    name: 'USD Coin',
    decimals: 6
  },
].filter(token => token.address); // Filter out any tokens with undefined addresses