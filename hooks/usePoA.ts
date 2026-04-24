'use client'

import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ADDRESSES, BIOTA_PASSPORT_ABI } from '@/lib/contracts'

export interface PoACertifyParams {
  tokenId:       bigint
  nuevoCmSuelo:  bigint
  nuevoEstado:   string
  nuevosMetodos: string
  imageBlob?:    Blob
  ipfsHashLab?:  string
}

export interface PoAState {
  certificarPoA: (p: PoACertifyParams) => Promise<void>
  isCertifying:  boolean
  txHash:        `0x${string}` | undefined
  isConfirming:  boolean
  isConfirmed:   boolean
  txError:       string | null
  gpsCoords:     { lat: number; lng: number } | null
  requestGPS:    () => void
  gpsError:      string | null
  isUploading:   boolean
  lastCID:       string | null
}

async function uploadToIPFS(blob: Blob): Promise<string> {
  // TODO: reemplazar con @web3-storage/w3up-client en producción
  const mockCID = `bafybei${Math.random().toString(36).slice(2, 20)}`
  await new Promise(r => setTimeout(r, 800))
  console.info('[PoA] IPFS mock CID:', mockCID)
  return mockCID
}

export function usePoA(): PoAState {
  const { address, isConnected } = useAccount()

  const [gpsCoords,   setGpsCoords]   = useState<{ lat: number; lng: number } | null>(null)
  const [gpsError,    setGpsError]    = useState<string | null>(null)
  const [txError,     setTxError]     = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [lastCID,     setLastCID]     = useState<string | null>(null)

  const {
    writeContractAsync,
    data:      txHash,
    isPending: isCertifying,
    error:     writeError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash:  txHash,
    query: { enabled: !!txHash },
  })

  const requestGPS = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('GPS no disponible en este dispositivo'); return
    }
    navigator.geolocation.getCurrentPosition(
      pos => { setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsError(null) },
      err => setGpsError(`GPS: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }, [])

  const certificarPoA = useCallback(async (params: PoACertifyParams) => {
    if (!address || !isConnected) { setTxError('Wallet no conectada'); return }
    setTxError(null)
    try {
      let cid = params.ipfsHashLab ?? ''
      if (!cid && params.imageBlob) {
        setIsUploading(true)
        cid = await uploadToIPFS(params.imageBlob)
        setLastCID(cid)
        setIsUploading(false)
      }
      const estadoConGPS = gpsCoords
        ? `${params.nuevoEstado} | GPS: ${gpsCoords.lat.toFixed(4)},${gpsCoords.lng.toFixed(4)}`
        : params.nuevoEstado

      await writeContractAsync({
        address:      ADDRESSES.BIOTA_PASSPORT as `0x${string}`,
        abi:          BIOTA_PASSPORT_ABI,
        functionName: 'actualizarEvidencia',
        args: [params.tokenId, params.nuevoCmSuelo, estadoConGPS, cid, params.nuevosMetodos],
      })
    } catch (err: any) {
      setIsUploading(false)
      setTxError((err?.shortMessage ?? err?.message ?? 'Error desconocido').slice(0, 120))
    }
  }, [address, isConnected, gpsCoords, writeContractAsync])

  return {
    certificarPoA,
    isCertifying: isCertifying || isUploading,
    txHash, isConfirming, isConfirmed,
    txError: writeError?.message?.slice(0, 120) ?? txError,
    gpsCoords, requestGPS, gpsError,
    isUploading, lastCID,
  }
}
