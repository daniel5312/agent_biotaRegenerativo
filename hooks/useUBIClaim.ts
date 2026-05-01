// hooks/useUBIClaim.ts
// Hook para reclamar UBI diario desde el contrato UBIScheme de GoodDollar.
// Verifica entitlement, ejecuta claim, y calcula próximo claim disponible.
// Referencia: https://docs.gooddollar.org/for-developers/core-contracts/ubischeme
// NOTA: checkEntitlement usa la wallet RAÍZ (primary whitelisted).
//       Para wallets conectadas, se debe usar getWhitelistedRoot primero.
'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { ADDRESSES, UBI_SCHEME_ABI } from '@/lib/contracts'
import { useToast } from '@/hooks/use-toast'
import { formatUnits } from 'viem'

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface UBIClaimState {
  /** Monto reclamable en wei (bigint) */
  entitlement: bigint
  /** Monto reclamable formateado (G$ con 2 decimales) */
  entitlementFormatted: string
  /** ¿Puede reclamar ahora? */
  canClaim: boolean
  /** ¿Se está ejecutando el claim? */
  isClaiming: boolean
  /** Hash de la transacción de claim */
  claimTxHash: `0x${string}` | undefined
  /** ¿El claim fue confirmado on-chain? */
  claimConfirmed: boolean
  /** Error del claim */
  claimError: string | null
  /** Ejecutar claim de UBI */
  claimUBI: () => Promise<void>
  /** ¿Se están cargando datos? */
  isLoading: boolean
  /** Refrescar entitlement */
  refetchEntitlement: () => void
}

const CHAIN_ID = 42220

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useUBIClaim(
  userAddress?: `0x${string}`,
  rootAddress?: `0x${string}` | null,
): UBIClaimState {
  const { authenticated } = usePrivy()
  const { toast } = useToast()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })

  const [claimError, setClaimError] = useState<string | null>(null)

  // La wallet que se usa para checkEntitlement es la RAÍZ, según la documentación:
  // "checkEntitlement is based on primary/root whitelisted wallet"
  const effectiveAddress = rootAddress || userAddress

  // 1. Verificar entitlement (cuánto puede reclamar)
  const {
    data: rawEntitlement,
    isLoading: loadingEntitlement,
    refetch: refetchEntitlement,
  } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.UBI_SCHEME,
    abi: UBI_SCHEME_ABI,
    functionName: 'checkEntitlement',
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!effectiveAddress && authenticated,
      refetchInterval: 60_000, // refetch cada minuto
    },
  })

  // 2. Preparar escritura de claim
  const {
    writeContractAsync,
    data: claimTxHash,
    isPending: isWriting,
  } = useWriteContract()

  // 3. Esperar confirmación
  const { isSuccess: claimConfirmed, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: claimTxHash,
      query: { enabled: !!claimTxHash },
    })

  // ── Datos derivados ────────────────────────────────────────────────────────
  const entitlement = (rawEntitlement as bigint) ?? 0n
  const canClaim = entitlement > 0n && authenticated && !!userAddress

  const entitlementFormatted = useMemo(() => {
    if (entitlement === 0n) return '0.00'
    return Number(formatUnits(entitlement, 18)).toFixed(2)
  }, [entitlement])

  // ── Ejecutar Claim ─────────────────────────────────────────────────────────
  const claimUBI = useCallback(async () => {
    if (!userAddress || !authenticated) {
      setClaimError('Wallet no conectada')
      return
    }
    if (!canClaim) {
      setClaimError('No hay UBI disponible para reclamar')
      return
    }

    setClaimError(null)

    try {
      toast({
        title: '🌱 Reclamando UBI...',
        description: `Firma para recibir ${entitlementFormatted} G$ del pool diario.`,
      })

      // NOTA: claim() no recibe argumentos — el contrato identifica al caller via msg.sender
      const hash = await writeContractAsync({
        chainId: CHAIN_ID,
        address: ADDRESSES.UBI_SCHEME,
        abi: UBI_SCHEME_ABI,
        functionName: 'claim',
        args: [],
      })

      toast({
        title: '⏳ Confirmando...',
        description: `TX enviada: ${hash.slice(0, 10)}...`,
      })

      // Esperar confirmación on-chain
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }

      toast({
        title: '🎉 ¡UBI Reclamado!',
        description: `+${entitlementFormatted} G$ depositados en tu wallet.`,
      })

      // Refrescar entitlement después del claim exitoso
      setTimeout(() => refetchEntitlement(), 3000)
    } catch (error: any) {
      const msg = error?.shortMessage || error?.message?.slice(0, 120) || 'Error desconocido'
      setClaimError(msg)
      toast({
        title: '❌ Error al reclamar UBI',
        description: msg,
        variant: 'destructive',
      })
    }
  }, [
    userAddress,
    authenticated,
    canClaim,
    entitlementFormatted,
    writeContractAsync,
    publicClient,
    toast,
    refetchEntitlement,
  ])

  return {
    entitlement,
    entitlementFormatted,
    canClaim,
    isClaiming: isWriting || isConfirming,
    claimTxHash,
    claimConfirmed,
    claimError,
    claimUBI,
    isLoading: loadingEntitlement,
    refetchEntitlement,
  }
}
