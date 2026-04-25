export const I_BIOTA_PASSPORT_ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lotePasaporte",
    "inputs": [{ "name": "tokenId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "verificador", "type": "address", "internalType": "address" },
      { "name": "esVerificado", "type": "bool", "internalType": "bool" },
      { "name": "isHumanVerified", "type": "bool", "internalType": "bool" },
      { "name": "areaM2", "type": "uint32", "internalType": "uint32" },
      { "name": "cmSueloRecuperado", "type": "uint32", "internalType": "uint32" },
      { "name": "fechaRegistro", "type": "uint64", "internalType": "uint64" },
      { "name": "ultimaActualizacion", "type": "uint64", "internalType": "uint64" },
      { "name": "ubicacionGeografica", "type": "string", "internalType": "string" },
      { "name": "estadoBiologico", "type": "string", "internalType": "string" },
      { "name": "hashAnalisisLab", "type": "string", "internalType": "string" },
      { "name": "ingredientesHash", "type": "string", "internalType": "string" },
      { "name": "metodosAgricolas", "type": "string", "internalType": "string" }
    ],
    "stateMutability": "view"
  }
] as const
