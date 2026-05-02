"use client"
import React from 'react'
import { 
  Camera, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Zap, 
  Clock, 
  Coins, 
  RefreshCw, 
  Wallet, 
  WalletCards,
  TrendingUp,
  Droplets,
  Sprout,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useConnection } from "wagmi"
import { useGoodDollarIdentity } from "@/hooks/useGoodDollarIdentity"
import { useUBIClaim } from "@/hooks/useUBIClaim"
import { useSuperfluidStream } from "@/hooks/useSuperfluidStream"
import { StreamingBalance } from "./StreamingBalance"
import { useMultiTokenBalances } from '@/hooks/useMultiTokenBalances'
import { formatUnits } from 'viem'

interface IdentityActionProps {
  tokenId?: bigint
}

export function IdentityAction({ tokenId }: IdentityActionProps) {
  const { address: primaryAddress } = useConnection()
  const [viewAccount, setViewAccount] = React.useState<'primary' | 'ubi'>('primary')

  // 1. Datos de Identidad
  const identity = useGoodDollarIdentity(primaryAddress as `0x${string}` | undefined)
  
  // 2. Dirección Activa para lectura
  const activeAddress = viewAccount === 'ubi' && identity.whitelistedRoot 
    ? (identity.whitelistedRoot as `0x${string}`)
    : (primaryAddress as `0x${string}`)

  // 3. Multi-Token Balances
  const { balances } = useMultiTokenBalances(activeAddress)

  // 4. Hook de Superfluid — monitoreando flujo UBI -> Google
  const stream = useSuperfluidStream(
    primaryAddress as `0x${string}`, 
    identity.whitelistedRoot as `0x${string}`
  )
  const isFlowActive = stream.isActive

  // 5. Hook de UBI Claim — checkEntitlement + claim real
  const {
    entitlementFormatted,
    canClaim,
    isClaiming,
    claimUBI,
    claimConfirmed,
    isLoading: loadingClaim,
    refetchEntitlement,
  } = useUBIClaim(activeAddress, identity.whitelistedRoot)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── BOLSILLO 1: BILLETERA OPERATIVA (MiniPay) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-emerald-900/40 dark:text-emerald-500/40 uppercase tracking-[0.3em]">
            Billetera Operativa (MiniPay)
          </h4>
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <Wallet size={12} className="text-emerald-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'CELO', val: balances.celo, dec: 18, icon: <Coins size={10} className="text-emerald-500" /> },
            { label: 'cUSD', val: balances.cusd, dec: 18, icon: <Zap size={10} className="text-blue-500" /> },
            { label: 'USDT', val: balances.usdt, dec: 6, icon: <TrendingUp size={10} className="text-green-500" /> },
            { label: 'USDC', val: balances.usdc, dec: 6, icon: <ShieldCheck size={10} className="text-blue-400" /> }
          ].map(tk => (
            <div key={tk.label} className="bg-white/40 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-500/10 flex flex-col items-center hover:bg-white/60 dark:hover:bg-emerald-900/30 transition-all">
              <div className="mb-1">{tk.icon}</div>
              <span className="text-[7px] font-black text-emerald-900/40 dark:text-emerald-400/40 uppercase mb-1">{tk.label}</span>
              <span className="text-[11px] font-black text-emerald-950 dark:text-white truncate w-full text-center">
                {parseFloat(formatUnits(tk.val, tk.dec)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOLSILLO 2: BOLSILLO DE IMPACTO (GoodDollar) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-blue-900/40 dark:text-blue-400/40 uppercase tracking-[0.3em]">
            Bolsillo de Impacto (UBI)
          </h4>
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <WalletCards size={12} className="text-blue-500" />
          </div>
        </div>

        <Card className="bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-emerald-950/20 border-blue-100 dark:border-blue-500/20 shadow-xl shadow-blue-500/5 rounded-[2.5rem] overflow-hidden relative border-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
          <CardContent className="p-8 text-center space-y-6">
            
            {/* El Reloj de Dinero G$ */}
            <div className="space-y-2 relative">
               <StreamingBalance 
                baseBalance={balances.gd} 
                flowRate={stream.flowRate}
                lastUpdateTimestamp={stream.lastUpdated}
              />
              <div className="flex items-center justify-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isFlowActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                <span className="text-[9px] font-black text-blue-900/40 dark:text-blue-400/40 uppercase tracking-widest">
                  {isFlowActive ? 'Sueldo Regenerativo Activo' : 'Goteo Detenido'}
                </span>
              </div>
            </div>

            {/* Fila de Estado: Identidad + Refresh */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 flex items-center gap-3 p-3 rounded-2xl border ${
                identity.hasValidIdentity ? "bg-white/60 dark:bg-blue-900/20 border-blue-100 dark:border-blue-500/20" : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-500/20"
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  identity.hasValidIdentity ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                }`}>
                  {identity.hasValidIdentity ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase text-blue-950 dark:text-blue-100 truncate">
                    {identity.hasValidIdentity ? "Humano Verificado" : "Identidad Pendiente"}
                  </p>
                  <p className="text-[8px] text-blue-900/50 dark:text-blue-400/50 uppercase font-bold tracking-tighter">
                    {identity.hasValidIdentity ? "Acceso Total al UBI" : "Verifica tu rostro"}
                  </p>
                </div>
              </div>
              
              {/* Botón de Refresh UBI */}
              <div 
                role="button"
                onClick={() => refetchEntitlement()}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-950/40 border-2 border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-all active:scale-90 cursor-pointer"
              >
                <RefreshCw className={`w-5 h-5 ${loadingClaim ? 'animate-spin' : ''}`} />
              </div>
            </div>

            {/* Acciones: Claim UBI o Botón Superfluid */}
            <div className="space-y-3">
               {!isFlowActive ? (
                <div 
                  role="button"
                  onClick={() => { if (identity.hasValidIdentity && !stream.isPending) stream.startStream() }}
                  className={`w-full h-16 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 ${
                    !identity.hasValidIdentity || stream.isPending ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer hover:bg-emerald-500"
                  }`}
                >
                  {stream.isPending ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <div className="flex items-center gap-2">
                        <Zap size={18} className="fill-white" />
                        <span className="font-black uppercase tracking-tight text-xs">Activar Goteo G$</span>
                      </div>
                      <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">
                        1,000 G$ Mensuales • Superfluid
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div 
                  role="button"
                  onClick={() => { if (!stream.isPending) stream.stopStream() }}
                  className="w-full h-16 rounded-2xl border-2 border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-500 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-500/10"
                >
                  {stream.isPending ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span className="font-black uppercase tracking-tight text-xs">Detener Goteo</span>
                      </div>
                      <span className="text-[8px] opacity-60 uppercase font-bold tracking-widest text-center">
                        Cerrar tubería de streaming
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Link de Verificación si falta */}
              {!identity.hasValidIdentity && (
                <div 
                  role="button"
                  onClick={() => window.open(identity.faceVerificationUrl, "_blank")}
                  className="text-amber-600 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 animate-pulse cursor-pointer"
                >
                  Continuar Verificación <ArrowRight size={10} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

