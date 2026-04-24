export const IDENTITY_ABI = [
  {
    "name": "isWhitelisted",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "name": "lastAuthenticated",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }]
  }
] as const
