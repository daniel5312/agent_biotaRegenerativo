export const BIOTA_SCROW_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "AGENT_ROLE",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DEFAULT_ADMIN_ROLE",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "NAME",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "VERSION",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "executeDoubleTrigger",
    "inputs": [
      { "name": "actionId", "type": "uint256", "internalType": "uint256" },
      { "name": "farmerTarget", "type": "address", "internalType": "address" },
      { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
      { "name": "fieldBioScore", "type": "uint32", "internalType": "uint32" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      { "name": "defaultAdmin", "type": "address", "internalType": "address" },
      { "name": "agentOracle", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "passport",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "contract IBiotaPassport" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setPassportContract",
    "inputs": [{ "name": "_passport", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "validations",
    "inputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "farmerWallet", "type": "address", "internalType": "address" },
      { "name": "validationTime", "type": "uint64", "internalType": "uint64" },
      { "name": "currentBioScore", "type": "uint32", "internalType": "uint32" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "DoubleTriggerFired",
    "inputs": [
      { "name": "actionId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "farmer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "bioScore", "type": "uint32", "indexed": false, "internalType": "uint32" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BiotaScrow__ActionAlreadyRegistered",
    "inputs": [{ "name": "id", "type": "uint256", "internalType": "uint256" }]
  },
  {
    "type": "error",
    "name": "BiotaScrow__InvalidRegenerationData",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BiotaScrow__UnauthorizedOracle",
    "inputs": [{ "name": "caller", "type": "address", "internalType": "address" }]
  },
  {
    "type": "error",
    "name": "Biota__ProductorNoVerificado",
    "inputs": []
  }
] as const
