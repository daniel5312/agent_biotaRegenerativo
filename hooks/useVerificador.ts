// hooks/useVerificador.ts
// Para técnicos verificadores de Biota Protocol
'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ADDRESSES, BIOTA_PASSPORT_ABI } from '@/lib/contracts'

export interface VerificadorState {
  isVerificador:      boolean
  isLoadingRole:      boolean
  validarImpacto:     (tokenId: bigint) => void
  isValidating:       boolean
  validateTxHash:     `0x${string}` | undefined
  validateConfirmed:  boolean
  validateError:      string | null
  gestionarVerificador: (cuenta: `0x${string}`, estado: boolean) => void
  isManaging:         boolean
  manageError:        string | null
}

export function useVerificador(): VerificadorState {
  const { address, isConnected } = useAccount()

  const { data: isVerif, isLoading: isLoadingRole } = useReadContract({
    address:      ADDRESSES.BIOTA_PASSPORT,
    abi:          BIOTA_PASSPORT_ABI,
    functionName: 'isVerificador',
    args:         [address!],
    query:        { enabled: isConnected && !!address },
  })

  const { writeContract: writeValidar, data: validateTxHash, isPending: isValidating, error: validateWriteError } = useWriteContract()
  const { isSuccess: validateConfirmed } = useWaitForTransactionReceipt({ hash: validateTxHash, query: { enabled: !!validateTxHash } })

  const validarImpacto = (tokenId: bigint) => {
    if (!isVerif) return
    writeValidar({ address: ADDRESSES.BIOTA_PASSPORT, abi: BIOTA_PASSPORT_ABI, functionName: 'validarImpacto', args: [tokenId] })
  }

  const { writeContract: writeGestionar, isPending: isManaging, error: manageWriteError } = useWriteContract()

  const gestionarVerificador = (cuenta: `0x${string}`, estado: boolean) => {
    writeGestionar({ address: ADDRESSES.BIOTA_PASSPORT, abi: BIOTA_PASSPORT_ABI, functionName: 'gestionarVerificador', args: [cuenta, estado] })
  }

  return {
    isVerificador:     !!(isVerif as boolean),
    isLoadingRole,
    validarImpacto, isValidating, validateTxHash, validateConfirmed,
    validateError: validateWriteError?.message?.slice(0, 100) ?? null,
    gestionarVerificador, isManaging,
    manageError: manageWriteError?.message?.slice(0, 100) ?? null,
  }
}
