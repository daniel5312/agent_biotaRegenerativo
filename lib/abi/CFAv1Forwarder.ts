// lib/abi/CFAv1Forwarder.ts
// ABI del contrato CFAv1Forwarder de Superfluid
// Celo Mainnet: 0xcfA132E353cB4E398080B9700609bb008eceB125
// Este contrato simplifica la creación y gestión de flujos de dinero (Money Streaming).

export const CFA_V1_FORWARDER_ABI = [
  // ═══ LECTURA: Información de flujos ═══
  {
    name: "getFlowInfo",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "sender", type: "address" },
      { name: "receiver", type: "address" }
    ],
    outputs: [
      { name: "lastUpdated", type: "uint256" },
      { name: "flowRate", type: "int96" },
      { name: "deposit", type: "uint256" },
      { name: "owedDeposit", type: "uint256" }
    ]
  },
  {
    name: "getAccountFlowinfo",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "account", type: "address" }
    ],
    outputs: [
      { name: "lastUpdated", type: "uint256" },
      { name: "flowRate", type: "int96" },
      { name: "deposit", type: "uint256" },
      { name: "owedDeposit", type: "uint256" }
    ]
  },
  {
    name: "getBufferAmountByFlowrate",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "flowRate", type: "int96" }
    ],
    outputs: [
      { name: "bufferAmount", type: "uint256" }
    ]
  },

  // ═══ ESCRITURA: Control de flujos (CRUD) ═══
  {
    name: "createFlow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "sender", type: "address" },
      { name: "receiver", type: "address" },
      { name: "flowRate", type: "int96" },
      { name: "userData", type: "bytes" }
    ],
    outputs: [{ name: "success", type: "bool" }]
  },
  {
    name: "updateFlow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "sender", type: "address" },
      { name: "receiver", type: "address" },
      { name: "flowRate", type: "int96" },
      { name: "userData", type: "bytes" }
    ],
    outputs: [{ name: "success", type: "bool" }]
  },
  {
    name: "deleteFlow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "sender", type: "address" },
      { name: "receiver", type: "address" },
      { name: "userData", type: "bytes" }
    ],
    outputs: [{ name: "success", type: "bool" }]
  },

  // ═══ ESCRITURA: Control de flujos con permisos (ACL) ═══
  {
    name: "grantConstantFlowRole",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "operator", type: "address" }
    ],
    outputs: [{ name: "success", type: "bool" }]
  }
] as const;
