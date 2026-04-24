export const BIOTA_PASSPORT_ABI = [
  {
    "name": "mintPasaporte",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "recipient", "type": "address" },
      { "name": "tokenURI", "type": "string" },
      { "name": "_ubicacionGeografica", "type": "string" },
      { "name": "_areaM2", "type": "uint256" },
      { "name": "_cmSueloRecuperado", "type": "uint256" },
      { "name": "_estadoBiologico", "type": "string" },
      { "name": "_hashAnalisisLab", "type": "string" },
      { "name": "_ingredientesHash", "type": "string" },
      { "name": "_metodosAgricolas", "type": "string" }
    ],
    "outputs": [{ "name": "tokenId", "type": "uint256" }]
  },
  {
    "name": "actualizarEvidencia",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "tokenId", "type": "uint256" },
      { "name": "_nuevoCmSuelo", "type": "uint256" },
      { "name": "_nuevoEstado", "type": "string" },
      { "name": "_nuevoHashLab", "type": "string" },
      { "name": "_nuevosMetodos", "type": "string" }
    ],
    "outputs": []
  },
  {
    "name": "validarImpacto",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": []
  },
  {
    "name": "lotePasaporte",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [
      { "name": "fechaRegistro", "type": "uint256" },
      { "name": "ultimaActualizacion", "type": "uint256" },
      { "name": "ubicacionGeografica", "type": "string" },
      { "name": "areaM2", "type": "uint256" },
      { "name": "cmSueloRecuperado", "type": "uint256" },
      { "name": "estadoBiologico", "type": "string" },
      { "name": "hashAnalisisLab", "type": "string" },
      { "name": "ingredientesHash", "type": "string" },
      { "name": "metodosAgricolas", "type": "string" },
      { "name": "verificador", "type": "address" },
      { "name": "esVerificado", "type": "bool" }
    ]
  },
  {
    "name": "balanceOf",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "owner", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }]
  },
  {
    "name": "isVerificador",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "name": "gestionarVerificador",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "cuenta", "type": "address" },
      { "name": "estado", "type": "bool" }
    ],
    "outputs": []
  },
  {
    "name": "PassportMinted",
    "type": "event",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "producer", "type": "address", "indexed": true },
      { "name": "ubicacion", "type": "string", "indexed": false }
    ]
  }
] as const
