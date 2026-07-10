// lib/contracts.ts
import { type Address, defineChain } from 'viem'
import { celo } from 'viem/chains'
export { celo };

// Importación de ABIs desde la nueva carpeta modular
import { ERC20_ABI } from './abi/ERC20'
import { IDENTITY_ABI } from './abi/Identity'
import { UBI_SCHEME_ABI } from './abi/UBIScheme'
import { BIOTA_SPLITTER_ABI } from './abi/BiotaSplitter'
import { BIOTA_SCROW_ABI } from './abi/BiotaScrow'
import { BIOTA_PASSPORT_ABI } from './abi/BiotaPassport'
import { I_BIOTA_PASSPORT_ABI } from './abi/IBiotaPassport'
import { CFA_V1_FORWARDER_ABI } from './abi/CFAv1Forwarder'

// Re-exportar ABIs para que el resto de la app los encuentre aquí
export {
  ERC20_ABI,
  IDENTITY_ABI,
  UBI_SCHEME_ABI,
  BIOTA_SPLITTER_ABI,
  BIOTA_SCROW_ABI,
  BIOTA_PASSPORT_ABI,
  I_BIOTA_PASSPORT_ABI,
  CFA_V1_FORWARDER_ABI,
}

// 2. Detectar red actual (FORCED MAINNET)
const chainId = 42220;
export const activeChain = celo;

export const ADDRESSES = {
  // === CELO MAINNET (NEW UUPS PROXIES V4) ===
  BIOTA_PASSPORT: '0xF2432fa271adb07B13Aa6221d821a49Eb57de1c0' as Address,
  BIOTA_SCROW: '0x4240Fc4C59d21a3C1CAed90aDB981d47f933a92B' as Address,
  BIOTA_SPLITTER: '0x5C994bed61eD6f2B1F9A1Be505e48F9B979f0850' as Address,
  BIOTA_UBI: '0xA3a720717eE892f249D5CDfe629FFd8C9B95964b' as Address,
  // [REFI] contrato rwa del café
  BIOTA_RWA: '0xb86c5d814fb694B0F85f57FD799532543EB1A98C' as Address,

  /* === CELO SEPOLIA (FUTURE USE) ===
  BIOTA_PASSPORT_SEP: '0x...' as Address,
  BIOTA_SCROW_SEP: '0x...' as Address,
  BIOTA_SPLITTER_SEP: '0x...' as Address,
  BIOTA_UBI_SEP: '0x...' as Address,
  */

  // === INFRAESTRUCTURA Y TOKENS ===
  COLLECTIVE_MUJERES: '0x0d43131f1577310d6349baf9d6da4fc1cd39764c' as Address,
  DAPP_BIOTA: '0x9bc43f955ce11948e4fD6EAC28d46875Fba9f5F9' as Address,
  FONDEO_LOGIN: '0x9158C35f1a054F25f9D45EA47107D54a2ea25945' as Address,
  AGENT_TBA: '0x699AD5EF840764db8CEe62569455bBE6081aA6b8' as Address,
  CUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address,
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e' as Address,
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' as Address,
  G$: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A' as Address,
  IDENTITY: '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42' as Address,
  UBI_SCHEME: '0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1' as Address,
  CFA_V1_FORWARDER: '0xcfA132E353cB4E398080B9700609bb008eceB125' as Address,

  /* === LEGACY ADDRESSES (OLD VERSIONS) ===
  BIOTA_PASSPORT_OLD: '0x07e1DDed6988db0cD1F6d5E9812156Bc4A9EA48D',
  BIOTA_SCROW_OLD: '0x6bbA84c35685746A3FDffb09b8b36bFce6839A1B',
  BIOTA_SPLITTER_OLD: '0x712C036a154419F31dEbbaB31543fd5484ff8D32',
  */
} as const;

// ── Types ───────────────────────────────────────────────────────────────────────
export interface LoteData {
  verificador: `0x${string}`;
  esVerificado: boolean;
  isHumanVerified: boolean;
  areaM2: bigint;
  cmSueloRecuperado: bigint;
  fechaRegistro: bigint;
  ultimaActualizacion: bigint;
  ubicacionGeografica: string;
  estadoBiologico: string;
  hashAnalisisLab: string;
  ingredientesHash: string;
  metodosAgricolas: string;
}

export interface MintParams {
  recipient: `0x${string}`;
  tokenURI: string;
  ubicacionGeografica: string;
  areaM2: bigint;
  cmSueloRecuperado: bigint;
  estadoBiologico: string;
  hashAnalisisLab: string;
  ingredientesHash: string;
  metodosAgricolas: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
export function formatCUSD(raw: bigint): string {
  const whole = raw / 10n ** 18n;
  const fraction = ((raw % 10n ** 18n) * 100n) / 10n ** 18n;
  return `${whole}.${fraction.toString().padStart(2, '0')}`;
}

export function cmToScore(cm: bigint, objetivo = 30n): number {
  if (cm >= objetivo) return 100;
  return Math.round(Number((cm * 100n) / objetivo));
}

export function formatFecha(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// [REFI] abi minimal del contrato biota rwa erc-1155
// expone solo las funciones que el frontend necesita para leer datos del cafe y mintear nfts
export const BIOTA_RWA_ABI = [
  // lee los datos on-chain de un lote de cafe (variedad, municipio, productor, etapa, etc.)
  {
    inputs: [{ name: 'productId', type: 'uint256' }],
    name: 'coffeeRegistry',
    outputs: [
      { name: 'finca', type: 'string' },
      { name: 'municipio', type: 'string' },
      { name: 'vereda', type: 'string' },
      { name: 'nombreProductor', type: 'string' },
      { name: 'etapaBiota', type: 'string' },
      { name: 'variedad', type: 'string' },
      { name: 'tonosPerfil', type: 'string' },
      { name: 'alturaMsnm', type: 'uint256' },
      { name: 'activoParaReclamo', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // consulta cuantos nfts de un lote tiene una billetera (erc-1155 balanceOf)
  {
    inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // el inversor quema 1 token para recibir su cafe fisico (logistica off-chain)
  {
    inputs: [{ name: 'productId', type: 'uint256' }],
    name: 'claimPhysicalCoffee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // [DEFI] el inversor retira su capital + rendimiento de la estrategia
  {
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_amount', type: 'uint256' }
    ],
    name: 'withdrawYield',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // evento que se emite cuando se mintea un nft rwa a un inversor
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'investor', type: 'address' },
      { indexed: true, name: 'productId', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'RWAMinted',
    type: 'event',
  },
] as const;

// [REFI] tipo de datos que el frontend usa para representar un lote de cafe
export interface CoffeeRWA {
  finca: string;
  municipio: string;
  vereda: string;
  nombreProductor: string;
  etapaBiota: string;
  variedad: string;
  tonosPerfil: string;
  alturaMsnm: bigint;
  activoParaReclamo: boolean;
}
