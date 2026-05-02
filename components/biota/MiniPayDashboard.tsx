// components/biota/MiniPayDashboard.tsx
'use client'

import React from 'react'
import { 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Camera, 
  ArrowRight,
  TrendingUp,
  Droplets,
  Sprout,
  Wallet,
  WalletCards,
  RefreshCcw
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useConnection, useReadContract } from 'wagmi'
import { ADDRESSES, ERC20_ABI } from '@/lib/contracts'
import { useGoodDollarIdentity } from '@/hooks/useGoodDollarIdentity'
import { useSuperfluidStream } from '@/hooks/useSuperfluidStream'
import { StreamingBalance } from './StreamingBalance'
import { formatUnits } from 'viem'
import { useMultiTokenBalances } from '@/hooks/useMultiTokenBalances'

export function MiniPayDashboard() {
  const { address: primaryAddress } = useConnection()
  const [viewAccount, setViewAccount] = React.useState<'primary' | 'ubi'>('primary')

  // 1. Datos de Identidad (Necesario para saber si hay wallet UBI)
  const identity = useGoodDollarIdentity(primaryAddress as `0x${string}`)

  // 2. Dirección Activa para lectura
  const activeAddress = viewAccount === 'ubi' && identity.whitelistedRoot 
    ? (identity.whitelistedRoot as `0x${string}`)
    : (primaryAddress as `0x${string}`)

  // 3. Multi-Token Balances
  const { balances, isLoading: loadingBalances } = useMultiTokenBalances(activeAddress)
  
  // 4. Datos de Streaming
  const stream = useSuperfluidStream(
    primaryAddress as `0x${string}`, 
    identity.whitelistedRoot as `0x${string}`
  )

  const isLoading = identity.isLoading || stream.isLoading || loadingBalances

  if (!primaryAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <Sprout className="w-10 h-10 text-emerald-600 animate-bounce" />
        </div>
        <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Conecta tu MiniPay</h2>
        <p className="text-sm text-emerald-700/70">Necesitamos tu wallet para empezar el goteo de G$.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-8 pb-24">
      {/* ── BOLSILLO 1: BILLETERA OPERATIVA (MiniPay) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.3em]">
            Billetera Operativa
          </h4>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-bold">
            MINIPAY
          </Badge>
        </div>
        
        <Card className="bg-white border-emerald-100/50 shadow-sm rounded-[2rem] overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center border-r border-emerald-50">
                <span className="text-[8px] font-black text-emerald-900/30 uppercase tracking-widest mb-1">CELO</span>
                <span className="text-sm font-black text-emerald-950">
                  {parseFloat(formatUnits(balances.celo, 18)).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center border-r border-emerald-50">
                <span className="text-[8px] font-black text-emerald-900/30 uppercase tracking-widest mb-1">cUSD</span>
                <span className="text-sm font-black text-emerald-950">
                  {parseFloat(formatUnits(balances.cusd, 18)).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-emerald-900/30 uppercase tracking-widest mb-1">USDC</span>
                <span className="text-sm font-black text-emerald-950">
                  {parseFloat(formatUnits(balances.usdc, 6)).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── BOLSILLO 2: CUENTA DE IMPACTO (GoodDollar) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.3em]">
            Bolsillo de Impacto
          </h4>
          <Badge className="bg-blue-600 text-white text-[8px] font-bold">
            UBI G$
          </Badge>
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-xl shadow-blue-500/5 rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
          <CardContent className="p-8 text-center space-y-6">
            {/* El Reloj de Dinero */}
            <div className="space-y-2">
               <StreamingBalance 
                baseBalance={balances.gd} 
                flowRate={stream.flowRate}
                lastUpdateTimestamp={stream.lastUpdated}
              />
              <div className="flex items-center justify-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${stream.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                <span className="text-[9px] font-black text-blue-900/40 uppercase tracking-widest">
                  {stream.isActive ? 'Flujo de G$ Activo' : 'Grifo Cerrado'}
                </span>
              </div>
            </div>

            {/* Estado de Identidad */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
              identity.hasValidIdentity ? "bg-white/60 border-blue-100" : "bg-amber-50 border-amber-100"
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                identity.hasValidIdentity ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
              }`}>
                {identity.hasValidIdentity ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
              </div>
              <div className="text-left flex-1">
                <p className="text-[9px] font-black uppercase text-blue-950">
                  {identity.hasValidIdentity ? "Identidad Verificada" : "Acción Requerida"}
                </p>
                <p className="text-[8px] text-blue-900/50 uppercase font-bold tracking-tighter">
                  {identity.hasValidIdentity ? "Listo para recibir UBI" : "Verifica tu rostro para empezar"}
                </p>
              </div>
              {!identity.hasValidIdentity && (
                 <Button 
                    size="sm"
                    className="h-7 bg-amber-500 hover:bg-amber-600 text-[8px] font-black uppercase"
                    onClick={() => window.open(identity.faceVerificationUrl, '_blank')}
                  >
                    Verificar
                  </Button>
              )}
            </div>

            {/* El Grifo (Start/Stop) */}
            <div className="pt-2">
              {!stream.isActive ? (
                <Button 
                  disabled={!identity.hasValidIdentity || stream.isPending}
                  onClick={stream.startStream}
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 disabled:grayscale"
                >
                  {stream.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 fill-white" />
                        <span className="text-sm font-black uppercase">Activar Goteo</span>
                      </div>
                      <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest">
                        +1,000 G$ Mensuales
                      </span>
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  disabled={stream.isPending}
                  onClick={stream.stopStream}
                  className="w-full h-16 border-2 border-amber-200 hover:border-amber-500 text-amber-600 hover:bg-amber-50 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                >
                  {stream.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-black uppercase">Detener Goteo</span>
                      </div>
                      <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">
                        Cerrar grifo de Superfluid
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FOOTER */}
      <div className="text-center pt-4">
        <p className="text-[8px] font-black text-emerald-900/20 uppercase tracking-[0.4em]">
          BiotaScrow Protocol v2.0
        </p>
      </div>
    </div>
  )
}

