// lib/abi/UBIScheme.ts
// ABI del contrato UBIScheme de GoodDollar
// Celo Mainnet (Producción): 0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1
// Referencia: https://docs.gooddollar.org/for-developers/core-contracts/ubischeme

export const UBI_SCHEME_ABI = [
  // ═══ LECTURA ═══
  {
    name: "checkEntitlement",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_member", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ═══ ESCRITURA ═══
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "fish",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "fishMulti",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_accounts", type: "address[]" }],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ═══ EVENTOS ═══
  {
    name: "UBIClaimed",
    type: "event",
    inputs: [
      { name: "claimer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "UBICalculated",
    type: "event",
    inputs: [
      { name: "day", type: "uint256", indexed: false },
      { name: "dailyUbi", type: "uint256", indexed: false },
      { name: "blockNumber", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ActivatedUser",
    type: "event",
    inputs: [
      { name: "account", type: "address", indexed: true },
    ],
  },
  {
    name: "InactiveUserFished",
    type: "event",
    inputs: [
      { name: "caller", type: "address", indexed: true },
      { name: "fished_account", type: "address", indexed: true },
      { name: "claimAmount", type: "uint256", indexed: false },
    ],
  },
] as const
