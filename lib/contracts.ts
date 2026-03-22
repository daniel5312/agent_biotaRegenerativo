// lib/contracts.ts
// ABI completo de BiotaPassport.sol (contrato real desplegado)
// Símbolo: BIO | ERC721URIStorage + Ownable (OpenZeppelin 5.x)
// Red: Celo Alfajores testnet (Chain ID 44787)

import { type Address, defineChain } from 'viem'

// ── Chain ──────────────────────────────────────────────────────────────────────
export const celoAlfajores = defineChain({
  id:   44787,
  name: 'Celo Alfajores',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_CELO_RPC_URL ?? 'https://alfajores-forno.celo-testnet.org'] },
  },
  blockExplorers: {
    default: { name: 'CeloScan Alfajores', url: 'https://alfajores.celoscan.io' },
  },
  testnet: true,
})

// ── Addresses ──────────────────────────────────────────────────────────────────
export const ADDRESSES = {
  BIOTA_PASSPORT: (
    process.env.NEXT_PUBLIC_BIOTA_PASSPORT_ADDRESS ??
    '0x0000000000000000000000000000000000000000'
  ) as Address,
  // cUSD en Alfajores
  CUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' as Address,
} as const

// ── ABI: BiotaPassport.sol ─────────────────────────────────────────────────────
export const BIOTA_PASSPORT_ABI = [
  // WRITE ──────────────────────────────────────────────────────────────────────
  {
    name: 'mintPasaporte',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient',            type: 'address' },
      { name: 'tokenURI',             type: 'string'  },
      { name: '_ubicacionGeografica', type: 'string'  },
      { name: '_areaM2',              type: 'uint256' },
      { name: '_cmSueloRecuperado',   type: 'uint256' },
      { name: '_estadoBiologico',     type: 'string'  },
      { name: '_hashAnalisisLab',     type: 'string'  },
      { name: '_ingredientesHash',    type: 'string'  },
      { name: '_metodosAgricolas',    type: 'string'  },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  // actualizarEvidencia = el PoA (Proof of Application)
  // El productor la llama cuando aplica la Receta Biota en campo
  {
    name: 'actualizarEvidencia',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId',        type: 'uint256' },
      { name: '_nuevoCmSuelo',  type: 'uint256' },
      { name: '_nuevoEstado',   type: 'string'  },
      { name: '_nuevoHashLab',  type: 'string'  },
      { name: '_nuevosMetodos', type: 'string'  },
    ],
    outputs: [],
  },
  // Solo verificadores (técnicos Biota)
  {
    name: 'validarImpacto',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  // Solo owner del contrato
  {
    name: 'gestionarVerificador',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'cuenta', type: 'address' },
      { name: 'estado', type: 'bool'    },
    ],
    outputs: [],
  },
  // READ ───────────────────────────────────────────────────────────────────────
  {
    name: 'lotePasaporte',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'fechaRegistro',       type: 'uint256' },
      { name: 'ultimaActualizacion', type: 'uint256' },
      { name: 'ubicacionGeografica', type: 'string'  },
      { name: 'areaM2',              type: 'uint256' },
      { name: 'cmSueloRecuperado',   type: 'uint256' },
      { name: 'estadoBiologico',     type: 'string'  },
      { name: 'hashAnalisisLab',     type: 'string'  },
      { name: 'ingredientesHash',    type: 'string'  },
      { name: 'metodosAgricolas',    type: 'string'  },
      { name: 'verificador',         type: 'address' },
      { name: 'esVerificado',        type: 'bool'    },
    ],
  },
  {
    name: 'isVerificador',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'cuenta', type: 'address' }],
    outputs: [{ name: '',       type: 'bool'    }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '',      type: 'uint256' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '',        type: 'address' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '',        type: 'string'  }],
  },
  // EVENTS ─────────────────────────────────────────────────────────────────────
  {
    name: 'PassportMinted',
    type: 'event',
    inputs: [
      { name: 'tokenId',  type: 'uint256', indexed: true  },
      { name: 'producer', type: 'address', indexed: true  },
      { name: 'ubicacion',type: 'string',  indexed: false },
    ],
  },
  {
    name: 'EvidenciaActualizada',
    type: 'event',
    inputs: [
      { name: 'tokenId',      type: 'uint256', indexed: true  },
      { name: 'nuevoCmSuelo', type: 'uint256', indexed: false },
      { name: 'nuevoEstado',  type: 'string',  indexed: false },
    ],
  },
  {
    name: 'ImpactoVerificado',
    type: 'event',
    inputs: [
      { name: 'tokenId',     type: 'uint256', indexed: true },
      { name: 'verificador', type: 'address', indexed: true },
    ],
  },
] as const

// ── cUSD ERC-20 ABI ────────────────────────────────────────────────────────────
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'account', type: 'address' }],
    outputs: [{ name: '',        type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to',     type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs:  [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

// ── TypeScript types ───────────────────────────────────────────────────────────
export interface LoteData {
  fechaRegistro:       bigint
  ultimaActualizacion: bigint
  ubicacionGeografica: string
  areaM2:              bigint
  cmSueloRecuperado:   bigint
  estadoBiologico:     string
  hashAnalisisLab:     string
  ingredientesHash:    string
  metodosAgricolas:    string
  verificador:         `0x${string}`
  esVerificado:        boolean
}

export interface MintParams {
  recipient:            `0x${string}`
  tokenURI:             string
  ubicacionGeografica:  string
  areaM2:               bigint
  cmSueloRecuperado:    bigint
  estadoBiologico:      string
  hashAnalisisLab:      string
  ingredientesHash:     string
  metodosAgricolas:     string
}

export interface EvidenciaParams {
  tokenId:       bigint
  nuevoCmSuelo:  bigint
  nuevoEstado:   string
  nuevoHashLab:  string
  nuevosMetodos: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** cUSD bigint 18 decimals → "5.00" */
export function formatCUSD(raw: bigint): string {
  const whole    = raw / 10n ** 18n
  const fraction = ((raw % 10n ** 18n) * 100n) / 10n ** 18n
  return `${whole}.${fraction.toString().padStart(2, '0')}`
}

/**
 * cmSueloRecuperado → Bio-Score 0–100
 * 30 cm = suelo completamente recuperado (100 puntos)
 * Ajustar objetivo según metodología Biota Protocol
 */
export function cmToScore(cm: bigint, objetivo = 30n): number {
  if (cm >= objetivo) return 100
  return Math.round(Number((cm * 100n) / objetivo))
}

/** Unix timestamp → fecha en español */
export function formatFecha(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
