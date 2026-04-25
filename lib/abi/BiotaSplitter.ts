export const BIOTA_SPLITTER_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "payWithSplit",
    "inputs": [
      { "name": "token", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "merchant", "type": "address", "internalType": "address" },
      { "name": "collective", "type": "address", "internalType": "address" },
      { "name": "pool", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rescueTokens",
    "inputs": [
      { "name": "token", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PaymentSplit",
    "inputs": [
      { "name": "payer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "token", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "merchant", "type": "address", "indexed": false, "internalType": "address" },
      { "name": "collective", "type": "address", "indexed": false, "internalType": "address" },
      { "name": "pool", "type": "address", "indexed": false, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BiotaSplitter__MontoInsuficiente",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BiotaSplitter__DireccionInvalida",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BiotaSplitter__TransferenciaFallida",
    "inputs": []
  }
] as const
