// hooks/useMiniPay.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useConnection, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConnect } from 'wagmi'
import { parseUnits } from 'viem'
import { ADDRESSES, ERC20_ABI, formatCUSD } from '@/lib/contracts'

export type AppEnv = 'minipay' | 'telegram' | 'browser' | 'ssr'

export function detectEnvironment(): AppEnv {
  if (typeof window === 'undefined') return 'ssr'
  if ((window as any).ethereum?.isMiniPay)         return 'minipay'
  if ((window as any).Telegram?.WebApp?.initData)  return 'telegram'
  if (document.referrer.includes('t.me'))          return 'telegram'
  return 'browser'
}

export interface MiniPayState {
  env:              AppEnv
  isMiniPay:        boolean
  isTelegram:       boolean
  rawBalance:       bigint
  formattedBalance: string
  isLoadingBalance: boolean
  sendCUSD:         (to: `0x${string}`, amount: string) => void
  isSending:        boolean
  sendTxHash:       `0x${string}` | undefined
  sendConfirmed:    boolean
  sendError:        string | null
  autoConnectDone:  boolean
}

export function useMiniPay(): MiniPayState {
  const { address, isConnected } = useConnection()
  const { connect, connectors }  = useConnect()
  const [env,             setEnv]             = useState<AppEnv>('ssr')
  const [autoConnectDone, setAutoConnectDone] = useState(false)
  const [sendError,       setSendError]       = useState<string | null>(null)

  useEffect(() => { setEnv(detectEnvironment()) }, [])

  // Auto-connect para MiniPay (sin modal)
  useEffect(() => {
    if (env !== 'minipay' || isConnected || autoConnectDone) return
    const c = connectors.find(c => c.id === 'miniPay' || c.id === 'injected')
    if (c) { connect({ connector: c }); setAutoConnectDone(true) }
  }, [env, isConnected, autoConnectDone, connect, connectors])

  const { data: rawBalance = 0n, isLoading: isLoadingBalance } = useReadContract({
    address:      ADDRESSES.CUSD,
    abi:          ERC20_ABI,
    functionName: 'balanceOf',
    args:         [address!],
    query:        { enabled: isConnected && !!address, refetchInterval: 15_000 },
  })

  const { writeContract, data: sendTxHash, isPending: isSending, error: sendWriteError } = useWriteContract()
  const { isSuccess: sendConfirmed } = useWaitForTransactionReceipt({ hash: sendTxHash, query: { enabled: !!sendTxHash } })

  const sendCUSD = useCallback((to: `0x${string}`, amount: string) => {
    if (!address || !isConnected) { setSendError('Wallet no conectada'); return }
    setSendError(null)
    writeContract({ address: ADDRESSES.CUSD, abi: ERC20_ABI, functionName: 'transfer', args: [to, parseUnits(amount, 18)] })
  }, [address, isConnected, writeContract])

  return {
    env, isMiniPay: env === 'minipay', isTelegram: env === 'telegram',
    rawBalance:       rawBalance as bigint,
    formattedBalance: formatCUSD(rawBalance as bigint),
    isLoadingBalance,
    sendCUSD, isSending, sendTxHash, sendConfirmed,
    sendError: sendWriteError?.message?.slice(0, 100) ?? sendError,
    autoConnectDone,
  }
}
