// lib/contracts.ts
import { type Address, defineChain } from 'viem'
import { celo, celoSepolia as viemCeloSepolia } from 'viem/chains'

// Importación de ABIs desde la nueva carpeta modular
import { ERC20_ABI } from './abi/ERC20'
import { IDENTITY_ABI } from './abi/Identity'
import { BIOTA_SPLITTER_ABI } from './abi/BiotaSplitter'
import { BIOTA_SCROW_ABI } from './abi/BiotaScrow'
import { BIOTA_PASSPORT_ABI } from './abi/BiotaPassport'

// Re-exportar ABIs para que el resto de la app los encuentre aquí
export {
  ERC20_ABI,
  IDENTITY_ABI,
  BIOTA_SPLITTER_ABI,
  BIOTA_SCROW_ABI,
  BIOTA_PASSPORT_ABI
}

// ── Chains ──────────────────────────────────────────────────────────────────────
export const celoSepolia = viemCeloSepolia;
export const celoMainnet = celo;

// Detectar red actual desde .env (Seguro para TypeScript)
const rawChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 42220);
const chainId = (rawChainId === 11142220 ? 11142220 : 42220) as 42220 | 11142220;

export const activeChain = chainId === 42220 ? celoMainnet : celoSepolia;

// ── Addresses ──────────────────────────────────────────────────────────────────
const CONTRACT_ADDRESSES = {
  CUSD: {
    42220: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address,
    11142220: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' as Address,
  },
  G$: {
    42220: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A' as Address,
    11142220: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A' as Address,
  },
  USDT: {
    42220: '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e' as Address,
    11142220: '0x0000000000000000000000000000000000000000' as Address,
  },
  SDCM: {
    42220: '0xe4d517783d228488b98e85baa430635460f0606b' as Address,
    11142220: '0xE4D517783D228488b98E85Baa430635460F0606B' as Address,
  },
  IDENTITY: {
    42220: '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42' as Address,
    11142220: '0xF25fA0D4896271228193E782831F6f3CFCcF169C' as Address,
  },
  BIOTA_SPLITTER: {
    42220: '0xc60f1B1644B41C7527EE396Ec02F92d0937D53f5' as Address,
    11142220: '0xb78490E17F1290bF4F239F431675a0943A030FE9' as Address,
  },
  BIOTA_PASSPORT: {
    42220: '0xBf1A8642c045E0178A300CDBAE6608571f745C80' as Address,
    11142220: '0xBf1A8642c045E0178A300CDBAE6608571f745C80' as Address,
  },
  BIOTA_SCROW: {
    42220: '0x488Afa235cCc53da2C0F8f4cED1A47776519DF63' as Address,
    11142220: '0x488afa235ccc53da2c0f8f4ced1a47776519df63' as Address,
  },
  COLLECTIVE_MUJERES: {
    42220: '0x0d43131f1577310d6349baf9d6da4fc1cd39764c' as Address,
    11142220: '0x0d43131f1577310d6349baf9d6da4fc1cd39764c' as Address,
  },
  BIOTA_POOL: {
    42220: '0x488afa235ccc53da2c0f8f4ced1a47776519df63' as Address,
    11142220: '0x488afa235ccc53da2c0f8f4ced1a47776519df63' as Address,
  }
};

export const ADDRESSES = {
  BIOTA_PASSPORT: (process.env.NEXT_PUBLIC_BIOTA_PASSPORT_ADDRESS || CONTRACT_ADDRESSES.BIOTA_PASSPORT[chainId]) as Address,
  BIOTA_SCROW: (process.env.NEXT_PUBLIC_BIOTA_SCROW_PROXY_ADDRESS || CONTRACT_ADDRESSES.BIOTA_SCROW[chainId]) as Address,
  BIOTA_SPLITTER: (process.env.NEXT_PUBLIC_SPLITTER_ADDRESS || CONTRACT_ADDRESSES.BIOTA_SPLITTER[chainId]) as Address,
  COLLECTIVE_MUJERES: (process.env.NEXT_PUBLIC_COLLECTIVE_MUJERES || CONTRACT_ADDRESSES.COLLECTIVE_MUJERES[chainId]) as Address,
  BIOTA_POOL: (process.env.NEXT_PUBLIC_BIOTA_POOL_ADDRESS || CONTRACT_ADDRESSES.BIOTA_POOL[chainId]) as Address,
  CUSD: CONTRACT_ADDRESSES.CUSD[chainId],
  G$: CONTRACT_ADDRESSES.G$[chainId],
  USDT: CONTRACT_ADDRESSES.USDT[chainId],
  SDCM: CONTRACT_ADDRESSES.SDCM[chainId],
  IDENTITY: CONTRACT_ADDRESSES.IDENTITY[chainId],
} as const;

// ── Types ───────────────────────────────────────────────────────────────────────
export interface LoteData {
  fechaRegistro: bigint;
  ultimaActualizacion: bigint;
  ubicacionGeografica: string;
  areaM2: bigint;
  cmSueloRecuperado: bigint;
  estadoBiologico: string;
  hashAnalisisLab: string;
  ingredientesHash: string;
  metodosAgricolas: string;
  verificador: `0x${string}`;
  esVerificado: boolean;
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
