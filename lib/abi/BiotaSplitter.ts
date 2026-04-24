export const BIOTA_SPLITTER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "address", "name": "collective", "type": "address" },
      { "internalType": "address", "name": "pool", "type": "address" }
    ],
    "name": "payWithSplit",
    "outputs": [],
    "stateMutability": "external",
    "type": "function"
  }
] as const
