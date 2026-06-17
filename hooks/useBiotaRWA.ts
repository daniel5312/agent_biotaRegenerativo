'use client'

import { useState } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useConnection } from 'wagmi'
import { ADDRESSES, BIOTA_RWA_ABI, type CoffeeRWA } from '@/lib/contracts'
import { useToast } from '@/hooks/use-toast'

// [REFI] hook principal para que el inversor interactúe con los nfts de café (biota rwa erc-1155)
// el erc-1155 fue elegido sobre el 721 porque nos permite mintear N copias del mismo lote sin duplicar metadata on-chain
export function useBiotaRWA(productId: bigint) {
  const { address, isConnected } = useConnection()
  const { toast } = useToast()
  const { writeContractAsync } = useWriteContract()
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | undefined>(undefined)

  // [CELO] lee los datos del cafe directamente del contrato en celo mainnet
  // refetchInterval: 60s para no saturar el nodo rpc publico y ahorrar gas de lectura
  const { data: rawCoffee, isLoading } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_RWA,
    abi: BIOTA_RWA_ABI,
    functionName: 'coffeeRegistry',
    args: [productId],
    query: {
      enabled: !!ADDRESSES.BIOTA_RWA && ADDRESSES.BIOTA_RWA !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 60_000,
    },
  })

  // [EVM] consulta cuantos nfts de este lote tiene el inversor conectado
  const { data: rawBalance } = useReadContract({
    chainId: 42220,
    address: ADDRESSES.BIOTA_RWA,
    abi: BIOTA_RWA_ABI,
    functionName: 'balanceOf',
    args: [address!, productId],
    query: {
      enabled: isConnected && !!address && ADDRESSES.BIOTA_RWA !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30_000,
    },
  })

  // [GOODDOLLAR / SUPERFLUID] cuando el inversor recibe el nft, en la v2 este contrato
  // abrirá un stream de superfluid hacia su billetera por los intereses de la bóveda defi
  // por ahora el reclamo fisico quema el token y notifica a logística vía evento on-chain
  const claimPhysicalCoffee = async () => {
    if (!address || !isConnected) return
    try {
      toast({ title: 'Reclamando café...', description: 'Firma para confirmar el envío físico a tu dirección.' })
      const hash = await writeContractAsync({
        chainId: 42220,
        address: ADDRESSES.BIOTA_RWA,
        abi: BIOTA_RWA_ABI,
        functionName: 'claimPhysicalCoffee',
        args: [productId],
        gas: 150_000n,
      })
      setClaimTxHash(hash)
      toast({ title: '¡Reclamo enviado!', description: 'Confirmando en Celo Mainnet...' })
    } catch (error: any) {
      toast({
        title: 'Error al reclamar',
        description: error?.message?.slice(0, 100) || 'Error desconocido',
        variant: 'destructive',
      })
    }
  }

  // [SOLIDITY] mapeamos el array retornado por el contrato a un objeto tipado de typescript
  const coffeeData: CoffeeRWA | null = rawCoffee ? {
    finca: (rawCoffee as any)[0] || 'Finca La Esperanza',
    municipio: (rawCoffee as any)[1] || 'Pitalito',
    vereda: (rawCoffee as any)[2] || 'El Trébol',
    nombreProductor: (rawCoffee as any)[3] || 'Don Arturo',
    etapaBiota: (rawCoffee as any)[4] || 'Transición Regenerativa',
    variedad: (rawCoffee as any)[5] || 'Chiroso y Chinchiná Castilla',
    tonosPerfil: (rawCoffee as any)[6] || 'Chocolate, Frutos Rojos, Cítricos',
    alturaMsnm: BigInt((rawCoffee as any)[7] || 1700n),
    activoParaReclamo: (rawCoffee as any)[8] ?? true,
  } : null

  // [REFI] mientras el contrato no esté desplegado, usamos datos demo para el hackathon
  // esto permite grabar el video del pitch sin necesidad del contrato en mainnet todavia
  const demoData: CoffeeRWA = {
    finca: 'Finca La Nube',
    municipio: 'Chinchiná',
    vereda: 'El Fresno',
    nombreProductor: 'Don Arturo',
    etapaBiota: 'Fase 1: Análisis de Suelo',
    variedad: 'Chiroso y Chinchiná Castilla',
    tonosPerfil: 'Chocolate, Frutos Rojos, Panela, Cítricos',
    alturaMsnm: 1750n,
    activoParaReclamo: true,
  }

  const { isSuccess: claimConfirmed } = useWaitForTransactionReceipt({
    hash: claimTxHash,
    query: { enabled: !!claimTxHash },
  })

  return {
    // si el contrato no está desplegado aún, usamos los datos demo sin romper nada
    coffeeData: coffeeData || demoData,
    isLive: !!coffeeData, // indica si los datos vienen de la blockchain real o son demo
    investorBalance: rawBalance ? Number(rawBalance as bigint) : 0,
    isLoading,
    claimPhysicalCoffee,
    claimConfirmed,
  }
}
