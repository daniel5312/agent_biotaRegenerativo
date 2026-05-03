// hooks/useMultiTokenBalances.ts
'use client'

import { useReadContracts, useBalance } from 'wagmi'
import { ADDRESSES, ERC20_ABI } from '@/lib/contracts'

export interface TokenBalances {
  celo: bigint
  gd: bigint
  cusd: bigint
  usdt: bigint
  usdc: bigint
  isLoading: boolean
}

/**
 * Hook de alto rendimiento que lee todos los balances relevantes 
 * mediante Multicall (una sola petición RPC).
 */
export function useMultiTokenBalances(address?: `0x${string}`) {
  // 1. Balance Nativo (CELO)
  const celoBalance = useBalance({
    address,
    chainId: 42220
  })

  // 2. Balances ERC20 vía Multicall
  const { data, isLoading, refetch } = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: ADDRESSES.G$ as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!] },
      { address: ADDRESSES.CUSD as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!] },
      { address: ADDRESSES.USDT as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!] },
      { address: ADDRESSES.USDC as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [address!] },
    ],
    query: { 
      enabled: !!address,
      refetchInterval: 10_000 
    }
  })

  return {
    balances: {
      celo: celoBalance.data?.value || 0n,
      gd: data?.[0]?.result as bigint || 0n,
      cusd: data?.[1]?.result as bigint || 0n,
      usdt: data?.[2]?.result as bigint || 0n,
      usdc: data?.[3]?.result as bigint || 0n,
    },
    isLoading: isLoading || celoBalance.isLoading,
    refetch
  }
}
