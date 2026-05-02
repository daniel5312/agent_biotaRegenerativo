// components/biota/StreamingBalance.tsx
// Componente que anima el saldo en tiempo real basándose en la tasa de flujo de Superfluid.
'use client'

import { useState, useEffect } from 'react'
import { formatUnits } from 'viem'
import { calculateAccumulated } from '@/lib/superfluid-utils'
import { Coins } from 'lucide-react'

interface StreamingBalanceProps {
  baseBalance: bigint
  flowRate: bigint
  lastUpdateTimestamp: number
}

export function StreamingBalance({ baseBalance, flowRate, lastUpdateTimestamp }: StreamingBalanceProps) {
  const [displayBalance, setDisplayBalance] = useState<bigint>(baseBalance)

  useEffect(() => {
    if (flowRate === 0n) {
      setDisplayBalance(baseBalance)
      return
    }

    // Intervalo de alta frecuencia para suavidad visual (20fps aprox)
    const interval = setInterval(() => {
      const accumulated = calculateAccumulated(flowRate, lastUpdateTimestamp)
      setDisplayBalance(baseBalance + accumulated)
    }, 50)

    return () => clearInterval(interval)
  }, [baseBalance, flowRate, lastUpdateTimestamp])

  // Formatear con muchos decimales para ver el movimiento
  const formatted = formatUnits(displayBalance, 18)
  const [whole, decimal] = formatted.split('.')
  
  return (
    <div className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in duration-700">
      <div className="relative">
        <div className="absolute -top-6 -right-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
            <Coins className="w-8 h-8 text-emerald-500 relative z-10" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-6xl font-black text-emerald-950 dark:text-white tracking-tighter transition-all">
            {whole}
          </span>
          <span className="text-2xl font-bold text-emerald-600/60 dark:text-emerald-400/60 font-mono">
            .{decimal?.slice(0, 6) || '000000'}
          </span>
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/40 mt-2">
        GoodDollars en Movimiento
      </p>
    </div>
  )
}
