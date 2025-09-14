const VaultABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_tokenIn", "type": "address" },
      { "internalType": "address", "name": "_tokenOut", "type": "address" },
      { "internalType": "uint256", "name": "_amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "_minAmountOut", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SWAP_FEE_BPS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "BPS_DENOMINATOR",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "tokenIn", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "tokenOut", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "name": "Swap",
    "type": "event"
  }
] as const;

export default VaultABI;
