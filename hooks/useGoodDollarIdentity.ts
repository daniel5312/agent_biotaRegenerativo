// hooks/useGoodDollarIdentity.ts
// Hook para interactuar con el contrato Identity de GoodDollar (IdentityV4)
// Verifica whitelist, wallets conectadas, expiración de identidad y genera link de verificación facial.
// Referencia: https://docs.gooddollar.org/for-developers/core-contracts/identity
'use client'

import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { ADDRESSES, IDENTITY_ABI } from '@/lib/contracts'
import { useAdminBypass } from '@/hooks/useAdminBypass'

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface IdentityExpiry {
  lastAuth: bigint
  authPeriodDays: bigint
  expiresAt: Date
  isExpired: boolean
  daysRemaining: number
}

export interface GoodDollarIdentityState {
  /** ¿La wallet directa está whitelisted? */
  isWhitelisted: boolean
  /** Dirección raíz whitelisted (para wallets conectadas) */
  whitelistedRoot: `0x${string}` | null
  /** ¿Tiene identidad válida (directa o conectada)? */
  hasValidIdentity: boolean
  /** Datos de expiración de la identidad */
  expiry: IdentityExpiry | null
  /** ¿Está en la blacklist? */
  isBlacklisted: boolean
  /** DID del protocolo GoodDollar */
  did: string | null
  /** ¿Se está cargando la data? */
  isLoading: boolean
  /** Link para verificación facial de GoodDollar */
  faceVerificationUrl: string
  /** ¿Bypass de admin activo? */
  isBypassed: boolean
}

// ── Constantes ───────────────────────────────────────────────────────────────
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`
const CHAIN_ID = 42220

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useGoodDollarIdentity(address?: `0x${string}`): GoodDollarIdentityState {
  const { authenticated } = usePrivy()
  const { isBypassed } = useAdminBypass()
  const enabled = !!address && authenticated

  // 1. ¿Está whitelisted directamente?
  const { data: rawIsWhitelisted, isLoading: l1 } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
    query: { enabled },
  })

  // 2. ¿Cuál es su wallet raíz? (crucial para wallets conectadas)
  const { data: rawRoot, isLoading: l2 } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'getWhitelistedRoot',
    args: address ? [address] : undefined,
    query: { enabled },
  })

  // 3. Última autenticación
  const { data: rawLastAuth, isLoading: l3 } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'lastAuthenticated',
    args: address ? [address] : undefined,
    query: { enabled },
  })

  // 4. Período de autenticación (días)
  const { data: rawAuthPeriod, isLoading: l4 } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'authenticationPeriod',
    query: { enabled },
  })

  // 5. ¿Está en blacklist?
  const { data: rawBlacklisted, isLoading: l5 } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'isBlacklisted',
    args: address ? [address] : undefined,
    query: { enabled },
  })

  // 6. DID (identidad social)
  const { data: rawDID, isLoading: l6 } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.IDENTITY,
    abi: IDENTITY_ABI,
    functionName: 'addrToDID',
    args: address ? [address] : undefined,
    query: { enabled },
  })

  // ── Datos derivados ────────────────────────────────────────────────────────
  const isWhitelisted = !!(rawIsWhitelisted as boolean)
  const whitelistedRoot = rawRoot && (rawRoot as `0x${string}`) !== ZERO_ADDRESS
    ? (rawRoot as `0x${string}`)
    : null
  const hasValidIdentity = isWhitelisted || !!whitelistedRoot || isBypassed
  const isBlacklisted = !!(rawBlacklisted as boolean)
  const did = rawDID && (rawDID as string).length > 0 ? (rawDID as string) : null

  // Calcular expiración
  const expiry = useMemo<IdentityExpiry | null>(() => {
    const lastAuth = rawLastAuth as bigint | undefined
    const authPeriod = rawAuthPeriod as bigint | undefined
    if (!lastAuth || !authPeriod || lastAuth === 0n) return null

    const lastAuthMs = Number(lastAuth) * 1000
    const periodMs = Number(authPeriod) * 24 * 60 * 60 * 1000
    const expiresAtMs = lastAuthMs + periodMs
    const now = Date.now()

    return {
      lastAuth,
      authPeriodDays: authPeriod,
      expiresAt: new Date(expiresAtMs),
      isExpired: now > expiresAtMs,
      daysRemaining: Math.max(0, Math.floor((expiresAtMs - now) / (24 * 60 * 60 * 1000))),
    }
  }, [rawLastAuth, rawAuthPeriod])

  // Face Verification URL — según la documentación oficial de GoodDollar
  const faceVerificationUrl = useMemo(() => {
    const base = 'https://wallet.gooddollar.org'
    const params = new URLSearchParams({
      id: 'biota',
      ...(address ? { wallet: address } : {}),
    })
    return `${base}?${params.toString()}`
  }, [address])

  return {
    isWhitelisted,
    whitelistedRoot,
    hasValidIdentity,
    expiry,
    isBlacklisted,
    did,
    isLoading: l1 || l2 || l3 || l4 || l5 || l6,
    faceVerificationUrl,
    isBypassed,
  }
}
