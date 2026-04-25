export const BIOTA_PASSPORT_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "mintPasaporte",
    "inputs": [
      { "name": "recipient", "type": "address", "internalType": "address" },
      { "name": "tokenURI", "type": "string", "internalType": "string" },
      { "name": "_ubicacionGeografica", "type": "string", "internalType": "string" },
      { "name": "_areaM2", "type": "uint32", "internalType": "uint32" },
      { "name": "_cmSueloRecuperado", "type": "uint32", "internalType": "uint32" },
      { "name": "_estadoBiologico", "type": "string", "internalType": "string" },
      { "name": "_hashAnalisisLab", "type": "string", "internalType": "string" },
      { "name": "_ingredientesHash", "type": "string", "internalType": "string" },
      { "name": "_metodosAgricolas", "type": "string", "internalType": "string" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "actualizarEvidencia",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
      { "name": "_nuevoCmSuelo", "type": "uint32", "internalType": "uint32" },
      { "name": "_nuevoEstado", "type": "string", "internalType": "string" },
      { "name": "_nuevoHashLab", "type": "string", "internalType": "string" },
      { "name": "_nuevosMetodos", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "validarImpacto",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "internalType": "uint256" },
      { "name": "_isHumanVerified", "type": "bool", "internalType": "bool" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
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
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "owner", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "PassportMinted",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "producer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "ubicacion", "type": "string", "indexed": false, "internalType": "string" }
    ],
    "anonymous": false
  }
] as const
