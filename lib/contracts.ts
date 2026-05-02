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
  BIOTA_PASSPORT: '0x07e1DDed6988db0cD1F6d5E9812156Bc4A9EA48D' as Address,
  BIOTA_SCROW: '0x6bbA84c35685746A3FDffb09b8b36bFce6839A1B' as Address,
  BIOTA_SPLITTER: '0x712C036a154419F31dEbbaB31543fd5484ff8D32' as Address,
  COLLECTIVE_MUJERES: '0x0d43131f1577310d6349baf9d6da4fc1cd39764c' as Address,
  REFI_MEDELLIN: '0xd4AC6c14B4C96F7e66049210F56cb07468028d4e' as Address,
  CUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address,
  G$: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A' as Address, // Producción G$
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A88248a0CE' as Address,
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' as Address,
  IDENTITY: '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42' as Address,
  UBI_SCHEME: '0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1' as Address,
  CFA_V1_FORWARDER: '0xcfA132E353cB4E398080B9700609bb008eceB125' as Address,
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
