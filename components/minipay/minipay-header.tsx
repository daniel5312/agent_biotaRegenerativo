"use client"

import { useAccount, useBalance } from "wagmi"
import { Leaf, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { celoMainnet } from "@/lib/contracts"

export function MiniPayHeader() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  // Balance en cUSD (Celo Mainnet o Sepolia)
  const { data: balance } = useBalance({
    address: address,
    token: undefined, // Native CELO or we could specify cUSD
  })

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <header className="relative z-50 w-full px-4 pt-4 pb-2 bg-emerald-50/80 dark:bg-[#021a0e]/80 backdrop-blur-md border-b border-emerald-200/30 dark:border-emerald-500/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-emerald-950 dark:text-white leading-none">BIOTA</h1>
            <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase">MiniPay</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300/40">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              {balance && (
                <span className="text-[8px] font-bold text-emerald-600/70 dark:text-emerald-400/50 mt-1">
                  {Number(balance.formatted).toFixed(2)} {balance.symbol}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-dashed border-emerald-300/50">
              <Wallet className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-bold text-emerald-500 italic">Desconectado</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
