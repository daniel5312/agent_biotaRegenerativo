'use client'

import { useState, useEffect } from 'react'
import {
  useConnection, useReadContract, useWriteContract,
  useWaitForTransactionReceipt, useWatchContractEvent,
} from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import {
  ADDRESSES, BIOTA_PASSPORT_ABI,
  type LoteData, type MintParams,
  cmToScore, formatFecha,
} from '@/lib/contracts'

export interface BiotaPassState {
  tokenId:         bigint | null
  loteData:        LoteData | null
  bioScore:        number
  hasPassport:     boolean
  isLoading:       boolean
  mintPassport:    (params: Omit<MintParams, 'recipient'>) => void
  isMinting:       boolean
  mintTxHash:      `0x${string}` | undefined
  mintConfirmed:   boolean
  mintError:       string | null
  fechaRegistro:   string
  estadoBiologico: string
  cmRecuperados:   number
  esVerificado:    boolean
  isHumanVerified: boolean
}

export function useBiotaPass(): BiotaPassState {
  const { address, isConnected } = useConnection()
  const { authenticated }        = usePrivy()

  // tokenId: persiste en localStorage vinculado a la wallet
  const [tokenId, setTokenId] = useState<bigint | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem(`biota_tokenId_${address}`)
    return saved ? BigInt(saved) : null
  })

  useEffect(() => {
    if (!address || tokenId === null) return
    localStorage.setItem(`biota_tokenId_${address}`, tokenId.toString())
  }, [tokenId, address])

  // Escuchar PassportMinted para capturar tokenId automáticamente
  useWatchContractEvent({
    address:   ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
    abi:       BIOTA_PASSPORT_ABI,
    eventName: 'PassportMinted',
    onLogs(logs) {
      for (const log of logs) {
        const { args } = log as any
        if (args?.producer?.toLowerCase() === address?.toLowerCase() && args?.tokenId !== undefined) {
          setTokenId(BigInt(args.tokenId))
        }
      }
    },
    enabled: isConnected && !!address,
  })

  const { data: balance, isLoading: loadingBalance } = useReadContract({
    address:      ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
    abi:          BIOTA_PASSPORT_ABI,
    functionName: 'balanceOf',
    args:         [address!],
    query:        { enabled: isConnected && !!address },
  })

  const hasPassport = !!balance && (balance as bigint) > 0n

  const { data: rawLote, isLoading: loadingLote } = useReadContract({
    address:      ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
    abi:          BIOTA_PASSPORT_ABI,
    functionName: 'lotePasaporte',
    args:         [tokenId!],
    query:        { enabled: !!tokenId, refetchInterval: 30_000 },
  })

  // Mapeo manual del array de retorno a objeto LoteData
  const loteData: LoteData | null = rawLote ? {
    verificador: rawLote[0],
    esVerificado: rawLote[1],
    isHumanVerified: rawLote[2],
    areaM2: rawLote[3],
    cmSueloRecuperado: rawLote[4],
    fechaRegistro: rawLote[5],
    ultimaActualizacion: rawLote[6],
    ubicacionGeografica: rawLote[7],
    estadoBiologico: rawLote[8],
    hashAnalisisLab: rawLote[9],
    ingredientesHash: rawLote[10],
    metodosAgricolas: rawLote[11],
  } : null

  const {
    writeContract,
    data:      mintTxHash,
    isPending: isMinting,
    error:     mintWriteError,
  } = useWriteContract()

  const { isSuccess: mintConfirmed } = useWaitForTransactionReceipt({
    hash:  mintTxHash,
    query: { enabled: !!mintTxHash },
  })

  const mintPassport = (params: Omit<MintParams, 'recipient'>) => {
    if (!address || !authenticated) return
    writeContract({
      address:      ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
      abi:          BIOTA_PASSPORT_ABI,
      functionName: 'mintPasaporte',
      args: [
        address,
        params.tokenURI,
        params.ubicacionGeografica,
        params.areaM2,
        params.cmSueloRecuperado,
        params.estadoBiologico,
        params.hashAnalisisLab,
        params.ingredientesHash,
        params.metodosAgricolas,
      ],
    })
  }

  const cm = (loteData as LoteData)?.cmSueloRecuperado ?? 0n

  return {
    tokenId,
    loteData:        loteData as LoteData,
    bioScore:        cmToScore(cm),
    hasPassport,
    isLoading:       loadingBalance || loadingLote,
    mintPassport,
    isMinting,
    mintTxHash,
    mintConfirmed,
    mintError:       mintWriteError?.message?.slice(0, 100) ?? null,
    fechaRegistro:   loteData ? formatFecha((loteData as LoteData).fechaRegistro) : '—',
    estadoBiologico: (loteData as LoteData)?.estadoBiologico ?? 'Sin diagnóstico',
    cmRecuperados:   Number(cm),
    esVerificado:    (loteData as LoteData)?.esVerificado ?? false,
    isHumanVerified: (loteData as LoteData)?.isHumanVerified ?? false,
  }
}
