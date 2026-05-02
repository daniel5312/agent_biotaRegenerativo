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
const SENDER_ADDRESS = ADDRESSES.BIOTA_SCROW // El contrato que paga el sueldo

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSuperfluidStream(receiverAddress?: `0x${string}`): StreamState {
  const { toast } = useToast()
  
  // 1. Consultar estado del flujo actual
  const { data: flowData, isLoading: loadingFlow, refetch: refetchFlow } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.CFA_V1_FORWARDER,
    abi: CFA_V1_FORWARDER_ABI,
    functionName: 'getFlowInfo',
    args: receiverAddress ? [ADDRESSES.G$, SENDER_ADDRESS, receiverAddress] : undefined,
    query: {
      enabled: !!receiverAddress,
      refetchInterval: 30_000,
    }
  })

  // 2. Verificar saldo del Emisor (BiotaScrow) para el Buffer
  // Superfluid requiere un buffer (depósito). Si el emisor no tiene G$, la TX fallará.
  const { data: senderBalance } = useReadContract({
    chainId: CHAIN_ID,
    address: ADDRESSES.G$,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [SENDER_ADDRESS],
    query: {
      enabled: !!receiverAddress,
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
    if (!receiverAddress) return

    // Validación de Buffer de Seguridad
    const requiredBuffer = 1n * 10n**17n // Estimación conservadora del buffer
    if (senderBalance && (senderBalance as bigint) < requiredBuffer) {
      toast({
        title: "⚠️ Fondo de Reserva Insuficiente",
        description: "El contrato BiotaScrow no tiene suficientes G$ para cubrir el depósito de seguridad del streaming.",
        variant: "destructive"
      })
      return
    }

    try {
      toast({
        title: "🌱 Iniciando Sueldo Regenerativo",
        description: "Abriendo flujo de 1,000 G$ mensuales..."
      })

      await writeContractAsync({
        chainId: CHAIN_ID,
        address: ADDRESSES.CFA_V1_FORWARDER,
        abi: CFA_V1_FORWARDER_ABI,
        functionName: 'createFlow',
        args: [
          ADDRESSES.G$, 
          SENDER_ADDRESS, 
          receiverAddress, 
          BigInt(REGENERATIVE_SALARY_FLOWRATE.toString()), // int96
          "0x" // userData vacío
        ],
      })
    } catch (error: any) {
      toast({
        title: "❌ Error Superfluid",
        description: error?.shortMessage || "Error al abrir el grifo de G$",
        variant: "destructive"
      })
    }
  }, [receiverAddress, senderBalance, writeContractAsync, toast])

  const stopStream = useCallback(async () => {
    if (!receiverAddress) return
    try {
      toast({ title: "⏳ Deteniendo goteo...", description: "Cerrando flujo de G$" })
      await writeContractAsync({
        chainId: CHAIN_ID,
        address: ADDRESSES.CFA_V1_FORWARDER,
        abi: CFA_V1_FORWARDER_ABI,
        functionName: 'deleteFlow',
        args: [ADDRESSES.G$, SENDER_ADDRESS, receiverAddress, "0x"],
      })
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo detener el flujo", variant: "destructive" })
    }
  }, [receiverAddress, writeContractAsync, toast])

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
