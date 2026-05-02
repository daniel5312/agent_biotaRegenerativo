// hooks/useSuperfluidStream.ts
// Hook para gestionar el Money Streaming de G$ (Superfluid)
// Implementa la lógica de "Sueldo Regenerativo" de 1,000 G$ mensuales.
'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useBalance
} from 'wagmi'
import { ADDRESSES, CFA_V1_FORWARDER_ABI, ERC20_ABI } from '@/lib/contracts'
import { REGENERATIVE_SALARY_FLOWRATE } from '@/lib/superfluid-utils'
import { useToast } from '@/hooks/use-toast'
import { formatUnits } from 'viem'

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface StreamState {
  /** ¿Hay un flujo activo hacia este usuario? */
  isActive: boolean
  /** Tasa de flujo actual en wei/seg */
  flowRate: bigint
  /** ¿Cargando información del contrato? */
  isLoading: boolean
  /** Ejecutar transacción para abrir el flujo */
  startStream: () => Promise<void>
  /** Detener el flujo */
  stopStream: () => Promise<void>
  /** ¿Transacción en curso? */
  isPending: boolean
  /** Fecha de la última actualización del flujo */
  lastUpdated: number
  /** Depósito de seguridad (buffer) actual */
  bufferAmount: bigint
}

const CHAIN_ID = 42220
// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSuperfluidStream(receiverAddress?: `0x${string}`, senderOverride?: `0x${string}`): StreamState {
  const { toast } = useToast()
  
  // El SENDER es la billetera de UBI (senderOverride) y el RECEIVER es la de Google (receiverAddress)
  const SENDER = senderOverride || ADDRESSES.BIOTA_SCROW
  const RECEIVER = receiverAddress

  // 1. Consultar estado del flujo entre UBI -> Google
  const { data: flowData, isLoading: loadingFlow, refetch: refetchFlow } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.CFA_V1_FORWARDER,
    abi: CFA_V1_FORWARDER_ABI,
    functionName: 'getFlowInfo',
    args: RECEIVER && SENDER ? [ADDRESSES.G$, SENDER, RECEIVER] : undefined,
    query: {
      enabled: !!RECEIVER && !!SENDER,
      refetchInterval: 10_000, // Más rápido para mejor UX
    }
  })

  // 2. Verificar saldo de la billetera de UBI para el Buffer
  const { data: senderBalance } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.G$,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [SENDER as `0x${string}`],
    query: {
      enabled: !!SENDER,
      refetchInterval: 30_000,
    }
  })

  // 3. Preparar escritura
  const { writeContractAsync, data: txHash, isPending: isWriting } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // ── Datos Derivados ────────────────────────────────────────────────────────
  const [lastUpdated, flowRate, bufferAmount] = useMemo(() => {
    if (!flowData) return [0, 0n, 0n]
    const [updated, rate, buffer] = flowData as [bigint, bigint, bigint, bigint]
    return [Number(updated), rate, buffer]
  }, [flowData])

  const isActive = flowRate > 0n

  // Refrescar al confirmar éxito
  useEffect(() => {
    if (isSuccess) refetchFlow()
  }, [isSuccess, refetchFlow])

  // ── Acciones ───────────────────────────────────────────────────────────────
  
  const startStream = useCallback(async () => {
    if (!SENDER || !RECEIVER) return

    // 1. Validar que no sea un flujo hacia uno mismo (Error 0xa47338ef)
    if (SENDER.toLowerCase() === RECEIVER.toLowerCase()) {
      toast({
        title: "🔄 Flujo Circular Detectado",
        description: "No puedes enviarte un goteo a ti mismo. El goteo debe ir desde tu UBI Wallet hacia tu Google Wallet.",
        variant: "destructive"
      })
      return
    }

    // 2. Validación de Buffer de Seguridad
    const requiredBuffer = 1n * 10n**17n // Estimación conservadora del buffer
    if (senderBalance && (senderBalance as bigint) < requiredBuffer) {
      toast({
        title: "⚠️ Saldo de UBI Insuficiente",
        description: "Tu billetera UBI necesita saldo de G$ para cubrir el depósito del flujo.",
        variant: "destructive"
      })
      return
    }

    try {
      toast({
        title: "🌱 Iniciando Goteo P2P",
        description: "Abriendo flujo desde UBI Wallet..."
      })

      await writeContractAsync({
        chainId: CHAIN_ID,
        address: ADDRESSES.CFA_V1_FORWARDER,
        abi: CFA_V1_FORWARDER_ABI,
        functionName: 'createFlow',
        args: [
          ADDRESSES.G$, 
          SENDER as `0x${string}`, 
          RECEIVER as `0x${string}`, 
          BigInt(REGENERATIVE_SALARY_FLOWRATE.toString()), // int96
          "0x" // userData vacío
        ],
      })
    } catch (error: any) {
      console.error("Superfluid Error:", error)
      const isBufferError = error?.message?.includes("0xa3eab6ac") || error?.data?.includes("0xa3eab6ac")
      
      toast({
        title: isBufferError ? "⚠️ Error de Fondos" : "❌ Error Superfluid",
        description: isBufferError 
          ? "La billetera UBI no tiene fondos suficientes para el depósito de seguridad."
          : error?.shortMessage || "Error al abrir el grifo de G$",
        variant: "destructive"
      })
    }
  }, [RECEIVER, SENDER, senderBalance, writeContractAsync, toast])

  const stopStream = useCallback(async () => {
    if (!RECEIVER || !SENDER) return
    try {
      toast({ title: "⏳ Deteniendo goteo...", description: "Cerrando flujo de G$" })
      await writeContractAsync({
        chainId: CHAIN_ID,
        address: ADDRESSES.CFA_V1_FORWARDER,
        abi: CFA_V1_FORWARDER_ABI,
        functionName: 'deleteFlow',
        args: [ADDRESSES.G$, SENDER as `0x${string}`, RECEIVER as `0x${string}`, "0x"],
      })
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo detener el flujo", variant: "destructive" })
    }
  }, [RECEIVER, SENDER, writeContractAsync, toast])

  return {
    isActive,
    flowRate,
    isLoading: loadingFlow,
    startStream,
    stopStream,
    isPending: isWriting || isConfirming,
    lastUpdated,
    bufferAmount
  }
}
