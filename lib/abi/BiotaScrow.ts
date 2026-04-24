export const BIOTA_SCROW_ABI = [
  {
    "name": "executeDoubleTrigger",
    "type": "function",
    "stateMutability": "external",
    "inputs": [
      { "name": "actionId", "type": "uint256" },
      { "name": "farmerTarget", "type": "address" },
      { "name": "fieldBioScore", "type": "uint32" }
    ],
    "outputs": []
  },
  {
    "name": "validations",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "", "type": "uint256" }],
    "outputs": [
      { "name": "farmerWallet", "type": "address" },
      { "name": "validationTime", "type": "uint64" },
      { "name": "currentBioScore", "type": "uint32" }
    ]
  },
  {
    "name": "NAME",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }]
  }
] as const
