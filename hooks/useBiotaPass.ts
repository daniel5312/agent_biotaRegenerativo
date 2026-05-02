'use client'

import { useState, useEffect } from 'react'
import {
  useConnection, useReadContract, useWriteContract,
  useWaitForTransactionReceipt, useWatchContractEvent,
  usePublicClient
} from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import {
  ADDRESSES, BIOTA_PASSPORT_ABI, ERC20_ABI,
  BIOTA_SPLITTER_ABI,
  type LoteData, type MintParams,
  cmToScore, formatFecha,
} from '@/lib/contracts'
import { parseEther, parseUnits } from 'viem'
import { useToast } from '@/hooks/use-toast'

export type PaymentMethod = 'CELO' | 'G$'

export interface BiotaPassState {
  tokenId:         bigint | null
  loteData:        LoteData | null
  bioScore:        number
  hasPassport:     boolean
  isLoading:       boolean
  mintPassport:    (params: Omit<MintParams, 'recipient'>, methodOverride?: PaymentMethod) => Promise<void>
  isMinting:       boolean
  mintTxHash:      `0x${string}` | undefined
  mintConfirmed:   boolean
  mintError:       string | null
  fechaRegistro:   string
  estadoBiologico: string
  cmRecuperados:   number
  esVerificado:    boolean
  isHumanVerified: boolean
  gDollarBalance:  string // Nuevo: Para ver los G$ reales
  paymentMethod:   'CELO' | 'G$'
  setPaymentMethod: (m: 'CELO' | 'G$') => void
}

export function useBiotaPass(): BiotaPassState {
  const { address, isConnected } = useConnection()
  const { authenticated }        = usePrivy()
  const { toast }                = useToast()
  const publicClient             = usePublicClient({ chainId: 42220 })

  // tokenId: persiste en localStorage vinculado a la wallet
  const [tokenId, setTokenId] = useState<bigint | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem(`biota_tokenId_${address}`)
    return saved ? BigInt(saved) : null
  })

  const [paymentMethod, setPaymentMethod] = useState<'CELO' | 'G$'>('G$')
  const [isMinting, setIsMinting] = useState(false)
  const [mintTxHash, setMintTxHash] = useState<`0x${string}` | undefined>(undefined)

  useEffect(() => {
    if (!address || tokenId === null) return
    localStorage.setItem(`biota_tokenId_${address}`, tokenId.toString())
  }, [tokenId, address])

  // Escuchar PassportMinted para capturar tokenId automáticamente
  useWatchContractEvent({
    address:   ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
    abi:       BIOTA_PASSPORT_ABI,
    eventName: 'PassportMinted',
    chainId:   42220,
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
    chainId:      42220,
    address:      ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
    abi:          BIOTA_PASSPORT_ABI,
    functionName: 'balanceOf',
    args:         [address!],
    query:        { enabled: isConnected && !!address },
  })

  // NUEVO: Consulta de balance de G$ real
  const { data: rawGlowBalance } = useReadContract({
    chainId:      42220,
    address:      ADDRESSES.G$ as `0x${string}`,
    abi:          ERC20_ABI,
    functionName: 'balanceOf',
    args:         [address!],
    query:        { enabled: isConnected && !!address },
  })

  const gDollarBalance = rawGlowBalance 
    ? (Number(rawGlowBalance as bigint) / 1e18).toLocaleString() 
    : '0';

  const hasPassport = !!balance && (balance as bigint) > 0n

  const { data: rawLote, isLoading: loadingLote } = useReadContract({
    chainId:      42220,
    address:      ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
    abi:          BIOTA_PASSPORT_ABI,
    functionName: 'lotePasaporte',
    args:         [tokenId!],
    query:        { enabled: !!tokenId, refetchInterval: 30_000 },
  })

  // Mapeo manual del array de retorno a objeto LoteData
  const loteData: LoteData | null = rawLote ? {
    verificador: (rawLote as any)[0],
    esVerificado: (rawLote as any)[1],
    isHumanVerified: (rawLote as any)[2],
    areaM2: BigInt((rawLote as any)[3]),
    cmSueloRecuperado: BigInt((rawLote as any)[4]),
    fechaRegistro: BigInt((rawLote as any)[5]),
    ultimaActualizacion: BigInt((rawLote as any)[6]),
    ubicacionGeografica: (rawLote as any)[7] || 'Biota Node - Celo Mainnet',
    estadoBiologico: (rawLote as any)[8] || 'Transición Agroecológica',
    hashAnalisisLab: (rawLote as any)[9] || '0xabc...123',
    ingredientesHash: (rawLote as any)[10] || 'Bocashi, MM',
    metodosAgricolas: (rawLote as any)[11] || 'Agricultura Sintrópica',
  } : null

  const { writeContractAsync } = useWriteContract()

  const { isSuccess: mintConfirmed } = useWaitForTransactionReceipt({
    hash:  mintTxHash,
    query: { enabled: !!mintTxHash },
  })

  const mintPassport = async (params: Omit<MintParams, 'recipient'>, methodOverride?: PaymentMethod) => {
    if (!address || !authenticated) return
    setIsMinting(true)
    try {
      // 1. Manejo de Pago según el método seleccionado
      let valueToSend = 0n;

      if ((methodOverride || paymentMethod) === 'G$') {
        const fee = 50n * 10n ** 18n
        
        // 1. Approve Splitter para la comisión
        toast({ title: 'Autorizando G$', description: 'Firma la aprobación para el Splitter Biota.' })
        await writeContractAsync({
          chainId: 42220,
          address: ADDRESSES.G$ as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [ADDRESSES.BIOTA_SPLITTER, fee],
        })

        // 2. Ejecutar Pago Dividido
        toast({ title: 'Dividiendo Comisión', description: 'Enrutando 94/3/3...' })
        await writeContractAsync({
          chainId: 42220,
          address: ADDRESSES.BIOTA_SPLITTER as `0x${string}`,
          abi: BIOTA_SPLITTER_ABI,
          functionName: 'payWithSplit',
          args: [
            ADDRESSES.G$,
            fee,
            ADDRESSES.REFI_MEDELLIN,
            ADDRESSES.COLLECTIVE_MUJERES,
            ADDRESSES.BIOTA_SCROW
          ]
        })
      } else {
        // Pago en CELO Nativo
        valueToSend = parseEther('0.01'); 
      }

      toast({
        title: "Paso Final: Minteando Pasaporte...",
        description: `Pagando con ${methodOverride || paymentMethod}. Firma para completar.`,
      })

      // IMPORTANTE: El contrato ya no recibe 'recipient', usa msg.sender
      const hash = await writeContractAsync({
        chainId: 42220,
        address: ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
        abi: BIOTA_PASSPORT_ABI,
        functionName: 'mintPasaporte',
        value: valueToSend,
        args: [
          params.tokenURI,
          params.ubicacionGeografica,
          Number(params.areaM2),
          Number(params.cmSueloRecuperado),
          params.estadoBiologico,
          params.hashAnalisisLab,
          params.ingredientesHash,
          params.metodosAgricolas,
        ],
      })
      setMintTxHash(hash)
      toast({
        title: "¡Pasaporte solicitado!",
        description: "Confirmando en Celo Mainnet...",
      })
    } catch (error: any) {
      console.error("Error minting passport:", error)
      toast({
        title: "Error al crear pasaporte",
        description: error?.message?.slice(0, 100) || "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsMinting(false)
    }
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
    mintError:       null,
    fechaRegistro:   loteData ? formatFecha((loteData as LoteData).fechaRegistro) : '—',
    estadoBiologico: (loteData as LoteData)?.estadoBiologico ?? 'Sin diagnóstico',
    cmRecuperados:   Number(cm),
    esVerificado:    (loteData as LoteData)?.esVerificado ?? false,
    isHumanVerified: (loteData as LoteData)?.isHumanVerified ?? false,
    gDollarBalance,
    paymentMethod,
    setPaymentMethod
  }
}

